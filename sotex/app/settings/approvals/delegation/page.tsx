"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface Delegation {
  id: string;
  fromUser: string;
  fromRole: string;
  toUser: string;
  toRole: string;
  scope: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "active" | "expired";
}

export default function DelegationPage() {
  const { showToast, currentRole, currentUser } = useERP();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDelegations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("delegations")
        .select("*")
        .order("start_date", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setDelegations(
          data.map((r) => ({
            id: r.id,
            fromUser: r.from_user,
            fromRole: r.from_role,
            toUser: r.to_user,
            toRole: r.to_role,
            scope: r.scope,
            startDate: r.start_date,
            endDate: r.end_date,
            reason: r.reason || "",
            status: (r.status === "EXPIRED" ? "expired" : "active") as Delegation["status"],
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل تفويضات الصلاحيات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDelegations();
  }, [fetchDelegations]);

  return (
    <div className="p-gutter space-y-space-md text-right max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">assignment_ind</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إدارة تفويض الصلاحيات والاعتمادات المؤقتة</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            تفويض صلاحيات الاعتماد للزملاء أثناء فترات الإجازات السنوية أو المهام الخارجية مع توثيق رقابي كامل
          </p>
        </div>

        <button
          onClick={() => showToast("info", "إنشاء تفويض جديد", "تم فتح معالج تفويض الصلاحيات المؤقت في Supabase")}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>إنشاء تفويض مؤقت جديد</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل تفويضات الصلاحيات من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDelegations} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {delegations.map((del) => (
            <div
              key={del.id}
              className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">{del.id}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    del.status === "active" ? "bg-emerald-100 text-emerald-800 animate-pulse" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {del.status === "active" ? "تفويض سارٍ ونشط" : "منتهي الصلاحية"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-on-surface">
                <span>المفوض الأساسي: {del.fromUser} ({del.fromRole})</span>
                <span className="material-symbols-outlined text-[16px] text-primary">arrow_back</span>
                <span>المفوض إليه: {del.toUser} ({del.toRole})</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-low text-xs space-y-1">
                <div>نطاق التفويض: <strong>{del.scope}</strong></div>
                <div className="text-outline">السبب: {del.reason}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-outline font-mono pt-1">
                <span>سريان التفويض: {del.startDate} ← {del.endDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
