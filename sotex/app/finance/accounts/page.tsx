"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface AccountNode {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance: number;
  level: number;
  hasChildren?: boolean;
}

export default function ChartOfAccountsPage() {
  const { openModal, showToast, canViewCost, roleConfig, currentRole, currentUser } = useERP();
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("code");
      if (fetchErr) throw fetchErr;
      if (data) {
        setAccounts(
          data.map((r) => {
            const rawType = (r.type || "").toLowerCase();
            let normType: AccountNode["type"] = "asset";
            if (rawType.includes("التزام") || rawType.includes("liability")) normType = "liability";
            else if (rawType.includes("ملكية") || rawType.includes("equity")) normType = "equity";
            else if (rawType.includes("إيراد") || rawType.includes("revenue")) normType = "revenue";
            else if (rawType.includes("مصروف") || rawType.includes("expense")) normType = "expense";

            return {
              code: r.code,
              name: r.name,
              type: normType,
              balance: Number(r.balance || 0),
              level: Number(r.level || 1),
              hasChildren: Boolean(r.has_children),
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل دليل الحسابات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  if (!canViewCost) {
    return (
      <div className="p-gutter flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">صلاحية محجوبة</h2>
        <p className="text-xs text-on-surface-variant max-w-md">
          حسابك الحالي ({roleConfig.nameAr}) غير مصرح له بالاطلاع على شجرة ودليل الحسابات المالية.
        </p>
      </div>
    );
  }

  const filtered = filterType === "all" ? accounts : accounts.filter((a) => a.type === filterType);

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">account_tree</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              شجرة ودليل الحسابات الموحد (Chart of Accounts)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            هيكلية الحسابات المحاسبية لمصنع سوتكس — الأصول، الالتزامات، إيرادات التصدير، وتكاليف التصنيع المباشرة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "new_journal_entry",
                title: "إضافة حساب جديد في شجرة الحسابات",
                description: "تحديد الحساب الرئيسي ونوعه والرمز المحاسبي",
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ إضافة حساب فرعي</span>
          </button>
          <button
            onClick={() =>
              openModal({
                type: "export_report",
                title: "تصدير شجرة الحسابات والأرصدة (Excel)",
              })
            }
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>تصدير الدليل</span>
          </button>
        </div>
      </div>

      {/* Account Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {["all", "asset", "liability", "equity", "revenue", "expense"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === t
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/30"
            }`}
          >
            {t === "all" ? "كافة الحسابات" :
             t === "asset" ? "الأصول (1)" :
             t === "liability" ? "الالتزامات (2)" :
             t === "equity" ? "حقوق الملكية (3)" :
             t === "revenue" ? "الإيرادات (4)" : "المصروفات والتكاليف (5)"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل دليل الحسابات من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAccounts} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Tree Table */}
      {!isLoading && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-2.5 px-3">رقم الحساب</th>
                  <th className="py-2.5 px-3">اسم الحساب</th>
                  <th className="py-2.5 px-3">التصنيف المحاسبي</th>
                  <th className="py-2.5 px-3">المستوى</th>
                  <th className="py-2.5 px-3 text-left">الرصيد الدفتري اللحظي (ج.م)</th>
                  <th className="py-2.5 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.map((acc) => (
                  <tr key={acc.code} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-3 font-mono font-bold text-primary">{acc.code}</td>
                    <td className="py-3 px-3 font-semibold text-on-surface" style={{ paddingRight: `${acc.level * 16}px` }}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-outline">
                          {acc.hasChildren ? "folder" : "description"}
                        </span>
                        <span>{acc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={acc.type === "asset" ? "info" : acc.type === "revenue" ? "success" : "secondary"}>
                        {acc.type === "asset" ? "أصول" : acc.type === "liability" ? "التزامات" : acc.type === "equity" ? "حقوق ملكية" : acc.type === "revenue" ? "إيرادات" : "مصروفات"}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-mono text-on-surface-variant">مستوى {acc.level}</td>
                    <td className="py-3 px-3 text-left font-mono font-bold text-primary">
                      {acc.balance.toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => showToast("info", "كشف حساب الأستاذ", `حساب: ${acc.name}`)}
                        className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold cursor-pointer"
                      >
                        كشف حساب
                      </button>
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
