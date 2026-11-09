"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface CountSession {
  id: string;
  name: string;
  warehouse: string;
  date: string;
  countedItems: number;
  discrepanciesCount: number;
  netDiffAmount: string;
  status: "reconciled" | "in_progress";
}

export default function StockCountPage() {
  const { showToast, currentRole, currentUser } = useERP();
  const [sessions, setSessions] = useState<CountSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("stock_count_sessions")
        .select("*")
        .order("session_date", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setSessions(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            warehouse: r.warehouse,
            date: r.session_date,
            countedItems: Number(r.counted_items || 0),
            discrepanciesCount: Number(r.discrepancies_count || 0),
            netDiffAmount: r.net_diff_amount || "0 ج.م",
            status: (r.status || "in_progress") as CountSession["status"],
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل جلسات الجرد");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleNewSession = async () => {
    setIsCreating(true);
    const newId = `CNT-2026-${Math.floor(100 + Math.random() * 899)}`;
    try {
      const { error: insertErr } = await supabase.from("stock_count_sessions").insert({
        id: newId,
        name: "جرد دوري مفاجئ لمخزن الأقمشة والإكسسوارات",
        warehouse: "مستودع الأقمشة المركزي — المحلة الكبرى",
        session_date: new Date().toISOString().split("T")[0],
        counted_items: 0,
        discrepancies_count: 0,
        net_diff_amount: "0 ج.م",
        status: "in_progress",
      });
      if (insertErr) throw insertErr;
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `فتح جلسة جرد مخزني جديدة ${newId}`,
        module: "المخازن",
        severity: "normal",
      });
      showToast("success", "تم فتح جلسة جرد جديدة", `الجلسة ${newId} جاهزة لمسح الباركود.`);
      await fetchSessions();
    } catch (err: unknown) {
      showToast("error", "تعذر فتح الجلسة", err instanceof Error ? err.message : "خطأ في الصلاحيات");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">qr_code_scanner</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">الجرد الدوري والباركود وفروقات المخازن</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            محاضر الجرد الفعلي، مطابقة الأرصدة الدفترية عبر ماسح الباركود، واعتماد التسويات الجردية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast("info", "ماسح الباركود نشط", "قم بتوجيه قارئ الباركود نحو ملصق الرول أو الكرتونة.")}
            className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">barcode_scanner</span>
            <span>بدء مسح باركود مباشر</span>
          </button>
          <button
            onClick={handleNewSession}
            disabled={isCreating}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>{isCreating ? "جاري الفتح..." : "جلسة جرد جديدة"}</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل جلسات الجرد من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSessions} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Grid of Sessions */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 transition-all text-right space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">{session.id}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  session.status === "reconciled" ? "bg-emerald-100 text-emerald-800" : "bg-secondary/15 text-secondary border border-secondary/30"
                }`}>
                  {session.status === "reconciled" ? "تمت المطابقة والترحيل" : "جاري الجرد الفعلي"}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-on-surface">{session.name}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{session.warehouse}</p>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-outline text-[11px]">الأصناف المجرودة:</span>
                  <p className="font-mono font-bold text-on-surface">{session.countedItems.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-outline text-[11px]">صافي الفروقات:</span>
                  <p className="font-mono font-bold text-on-surface">{session.netDiffAmount}</p>
                </div>
              </div>

              <div className="text-[11px] text-outline font-mono pt-1">
                تاريخ الجرد: {session.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
