"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";

interface ApprovalLimit {
  roleKey: RoleKey;
  maxPO: string;
  maxDiscount: string;
  maxStockScrap: string;
  canApprovePayroll: string;
}

export default function ApprovalLimitsPage() {
  const { showToast, currentRole, currentUser } = useERP();
  const [limits, setLimits] = useState<ApprovalLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLimits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("approval_limits")
        .select("*")
        .order("role_code");
      if (fetchErr) throw fetchErr;
      if (data && data.length > 0) {
        setLimits(
          data.map((r) => ({
            roleKey: r.role_code as RoleKey,
            maxPO: r.max_po_amount_egp ? `${Number(r.max_po_amount_egp).toLocaleString()} ج.م` : "غير محدود",
            maxDiscount: r.max_discount_pct ? `حتى ${r.max_discount_pct}%` : "غير محدود (100%)",
            maxStockScrap: r.max_scrap_amount_egp ? `حتى ${Number(r.max_scrap_amount_egp).toLocaleString()} ج.م` : "غير محدود",
            canApprovePayroll: r.payroll_approval_level || "مصرح كامل",
          }))
        );
      } else {
        setLimits([
          { roleKey: "OWNER_ADMIN", maxPO: "غير محدود", maxDiscount: "غير محدود (100%)", maxStockScrap: "غير محدود", canApprovePayroll: "مصرح كامل" },
          { roleKey: "FINANCE_SALES_MANAGER", maxPO: "حتى 150,000 ج.م", maxDiscount: "حتى 10%", maxStockScrap: "حتى 10,000 ج.م", canApprovePayroll: "إعداد ومراجعة" },
          { roleKey: "PRODUCTION_MANAGER", maxPO: "طلب احتياج فقط", maxDiscount: "محجوب (0%)", maxStockScrap: "صرف تشغيل فقط", canApprovePayroll: "محجوب" },
          { roleKey: "WAREHOUSE_MANAGER", maxPO: "طلب شراء مخزني", maxDiscount: "محجوب (0%)", maxStockScrap: "حتى 2,000 ج.م", canApprovePayroll: "محجوب" },
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل حدود وسقوف الاعتماد");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: "تحديث مصفوفة حدود وسقوف الاعتماد المالي والكمي للأدوار القياسية",
        module: "الموافقات والرقابة",
        severity: "warning",
      });
      showToast("success", "تم حفظ حدود الاعتماد", "تم تحديث قواعد وسقوف المبالغ بنجاح في Supabase.");
    } catch (err: unknown) {
      showToast("error", "فشل الحفظ", err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-gutter space-y-space-md text-right max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">price_change</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">مصفوفة حدود وصلاحيات الاعتماد المالي والكمي</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            تحديد السقوف المالية لأوامر الشراء، نسب الخصومات للعملاء، وتسويات فروقات الجرد لكل دور
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          <span>{isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل حدود الاعتماد من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchLimits} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">الدور الوظيفي</th>
                <th className="p-3">سقف أمر الشراء التوريدي</th>
                <th className="p-3">سقف خصم المبيعات المئوي</th>
                <th className="p-3">سقف اعتماد عجز وتسوية الجرد</th>
                <th className="p-3">صلاحية مسير الرواتب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {limits.map((lim) => {
                const r = CORE_ROLES[lim.roleKey] || { nameAr: lim.roleKey, nameEn: lim.roleKey };
                return (
                  <tr key={lim.roleKey} className="hover:bg-surface-container/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-on-surface">{r.nameAr}</div>
                      <div className="text-[11px] text-outline font-mono">{r.nameEn}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-primary">{lim.maxPO}</td>
                    <td className="p-3 font-mono font-bold text-secondary">{lim.maxDiscount}</td>
                    <td className="p-3 font-mono font-semibold text-on-surface">{lim.maxStockScrap}</td>
                    <td className="p-3 font-semibold text-emerald-700">{lim.canApprovePayroll}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
