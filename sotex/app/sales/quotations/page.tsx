"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface Quotation {
  id: string;
  customer: string;
  modelsSummary: string;
  qty: number;
  totalEGP: number;
  validUntil: string;
  status: "accepted" | "pending" | "expired";
}

export default function QuotationsPage() {
  const { showToast, canViewCost, currentRole, currentUser } = useERP();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newQuo, setNewQuo] = useState({
    customer: "",
    modelsSummary: "قميص أكسفورد صيفي + بنطلون جبردين",
    qty: 1000,
    totalEGP: 250000,
    validUntil: "2026-12-01",
  });

  const fetchQuotations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("sales_quotations")
        .select("*")
        .order("valid_until", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setQuotations(
          data.map((r) => {
            const rawStatus = (r.status || "").toLowerCase();
            const normStatus: Quotation["status"] =
              rawStatus.includes("accepted") || rawStatus.includes("converted")
                ? "accepted"
                : rawStatus.includes("expired")
                ? "expired"
                : "pending";
            return {
              id: r.id,
              customer: r.customer,
              modelsSummary: r.models_summary,
              qty: Number(r.qty || 0),
              totalEGP: Number(r.total_egp || 0),
              validUntil: r.valid_until,
              status: normStatus,
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل عروض الأسعار");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleAddQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuo.customer) return;
    setIsSubmitting(true);
    const newId = `QUO-2026-${Math.floor(100 + Math.random() * 899)}`;
    try {
      const { error: insertErr } = await supabase.from("sales_quotations").insert({
        id: newId,
        customer: newQuo.customer,
        models_summary: newQuo.modelsSummary,
        qty: Number(newQuo.qty),
        total_egp: Number(newQuo.totalEGP),
        valid_until: newQuo.validUntil,
        status: "SENT",
      });
      if (insertErr) throw insertErr;
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `إصدار عرض سعر رسمي ${newId} للعميل ${newQuo.customer} بإجمالي ${newQuo.totalEGP} ج.م`,
        module: "المبيعات",
        severity: "normal",
      });
      showToast("success", "تم إصدار عرض السعر", `تم حفظ عرض السعر ${newId} بنجاح.`);
      setShowAddForm(false);
      setNewQuo({
        customer: "",
        modelsSummary: "قميص أكسفورد صيفي + بنطلون جبردين",
        qty: 1000,
        totalEGP: 250000,
        validUntil: "2026-12-01",
      });
      await fetchQuotations();
    } catch (err: unknown) {
      showToast("error", "تعذر حفظ عرض السعر", err instanceof Error ? err.message : "خطأ في الصلاحيات");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">request_quote</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">عروض الأسعار والتوكيلات التجارية</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            إصدار ومتابعة عروض الأسعار الرسمية للشركات، كبار العملاء، ووكلاء التوزيع
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>عرض سعر رسمي جديد</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddQuotation} className="p-4 rounded-xl border border-primary/30 bg-surface-container-lowest space-y-3 text-right shadow-sm">
          <h3 className="text-xs font-bold text-primary">إصدار عرض سعر رسمي للعميل</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              required
              placeholder="اسم العميل أو التوكيل"
              value={newQuo.customer}
              onChange={(e) => setNewQuo({ ...newQuo, customer: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              required
              placeholder="الموديلات المقترحة"
              value={newQuo.modelsSummary}
              onChange={(e) => setNewQuo({ ...newQuo, modelsSummary: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              type="number"
              placeholder="الكمية المطلوبة"
              value={newQuo.qty}
              onChange={(e) => setNewQuo({ ...newQuo, qty: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <input
              type="number"
              placeholder="إجمالي القيمة (ج.م)"
              value={newQuo.totalEGP}
              onChange={(e) => setNewQuo({ ...newQuo, totalEGP: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <div className="sm:col-span-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
              >
                {isSubmitting ? "جاري الإصدار..." : "إصدار العرض"}
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل عروض الأسعار من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchQuotations} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {quotations.map((q) => (
            <div key={q.id} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">{q.id}</span>
                  <span className="font-bold text-sm text-on-surface">{q.customer}</span>
                </div>
                <p className="text-xs text-on-surface-variant">الموديلات: {q.modelsSummary}</p>
                <div className="flex items-center gap-4 text-xs text-outline font-mono">
                  <span>الكمية: {q.qty.toLocaleString()} ق</span>
                  <span className="text-primary font-bold">
                    الإجمالي: {canViewCost ? `${q.totalEGP.toLocaleString()} ج.م` : "••••••"}
                  </span>
                  <span>ساري حتى: {q.validUntil}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    q.status === "accepted"
                      ? "bg-emerald-100 text-emerald-800"
                      : q.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {q.status === "accepted"
                    ? "تم القبول والتعاقد"
                    : q.status === "pending"
                    ? "قيد دراسة العميل"
                    : "منتهي الصلاحية"}
                </span>
                <button
                  onClick={() => showToast("info", "طباعة عرض السعر", `جاري تجهيز نسخة PDF من العرض ${q.id}`)}
                  className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
