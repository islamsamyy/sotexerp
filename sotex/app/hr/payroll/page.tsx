"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface PayrollRow {
  id: string;
  name: string;
  role: string;
  qty: string;
  rate: string;
  bonus: string;
  base: string;
  net: string;
}

export default function PayrollPage() {
  const { showToast, openModal, canViewCost, currentRole, currentUser } = useERP();
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayroll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("employees")
        .select("*")
        .order("code");
      if (fetchErr) throw fetchErr;
      if (data) {
        setPayrollRows(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            role: `${r.role} (${r.line})`,
            qty: r.piece_qty_str || `${r.completed_today || 400} قطعة`,
            rate: r.piece_rate_str || "0.60 ج.م",
            bonus: r.piece_bonus_str || "1,470 ج.م",
            base: r.base_salary_str || "1,200 ج.م",
            net: r.net_pay_str || "2,670 ج.م",
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل مسير الأجور وحوافز القطعة");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const handleApprovePayroll = async () => {
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `اعتماد وصرف كشف مسير حوافز الإنتاج بالقطعة الأسبوعي لـ ${payrollRows.length} فنياً`,
        module: "الموارد البشرية",
        severity: "normal",
      });
      showToast("success", "تم اعتماد مسير الأجور", "تم ترحيل مسير الحوافز إلى إدارة الحسابات العامة للصرف.");
    } catch (err: unknown) {
      showToast("error", "فشل الاعتماد", err instanceof Error ? err.message : "خطأ غير متوقع");
    }
  };

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              مسير الأجور وحوافز الإنتاج بالقطعة (Piece-Rate Payroll)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            احتساب استحقاقات فنيي الخياطة والقص بناءً على عدد القطع المنجزة ومطابقتها لمعايير الجودة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApprovePayroll}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>اعتماد وصرف حوافز الأسبوع</span>
          </button>
          <button
            onClick={() =>
              openModal({
                type: "export_report",
                title: "تصدير مسير الرواتب وحوافز القطعة (Excel)",
                description: "استخراج كشف تفصيلي بالأجر الثابت وحافز القطعة والخصومات",
              })
            }
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>تصدير كشف الرواتب</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-1">
          <span className="text-xs text-on-surface-variant font-semibold">إجمالي حوافز الإنتاج بالقطعة (الأسبوع الحالي)</span>
          <div className="text-2xl font-bold text-emerald-700">
            {canViewCost ? "148,500 ج.م" : "••••••"}
          </div>
          <p className="text-[11px] text-on-surface-variant">محسوبة على قطع متوافقة مع الجودة</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-1">
          <span className="text-xs text-on-surface-variant font-semibold">متوسط حافز الفني للأسبوع</span>
          <div className="text-2xl font-bold text-primary">
            {canViewCost ? "1,190 ج.م" : "••••••"}
          </div>
          <p className="text-[11px] text-[#16A36A] font-semibold">+14% عن الأسبوع السابق لزيادة سرعة الخطوط</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-1">
          <span className="text-xs text-on-surface-variant font-semibold">الخصومات لعيوب الجودة المرفوضة</span>
          <div className="text-2xl font-bold text-amber-700">
            {canViewCost ? "2,400 ج.م" : "••••••"}
          </div>
          <p className="text-[11px] text-on-surface-variant">عيوب درزات غير قابلة للإصلاح (1.6% فقط)</p>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل مسير الأجور وحوافز القطعة من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchPayroll} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
          <h2 className="text-base font-bold text-on-surface">استحقاق الفنيين بحسب القطع المنجزة</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-2.5 px-3">الفني / العامل</th>
                  <th className="py-2.5 px-3">الخط والعملية</th>
                  <th className="py-2.5 px-3">القطع المنجزة</th>
                  <th className="py-2.5 px-3">سعر القطعة (ج.م)</th>
                  <th className="py-2.5 px-3">إجمالي حافز القطعة</th>
                  <th className="py-2.5 px-3">الأجر الأساسي</th>
                  <th className="py-2.5 px-3 font-bold text-primary">صافي الاستحقاق</th>
                  <th className="py-2.5 px-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {payrollRows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-3 font-bold text-on-surface">{row.name}</td>
                    <td className="py-3 px-3 text-on-surface-variant">{row.role}</td>
                    <td className="py-3 px-3 font-mono font-bold">{row.qty}</td>
                    <td className="py-3 px-3 font-mono">{canViewCost ? row.rate : "•••"}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">{canViewCost ? row.bonus : "••••"}</td>
                    <td className="py-3 px-3 font-mono">{canViewCost ? row.base : "••••"}</td>
                    <td className="py-3 px-3 font-mono font-bold text-primary text-sm">{canViewCost ? row.net : "••••••"}</td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="success">معتمد للصرف</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
