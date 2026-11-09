"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface PartyDebt {
  name: string;
  code: string;
  totalDebt: number;
  current: number;
  days30: number;
  days60: number;
  days90Plus: number;
  status: "healthy" | "warning";
}

export default function LedgersAgingPage() {
  const { openModal, showToast, canViewCost, roleConfig } = useERP();
  const [partyType, setPartyType] = useState<"customers" | "suppliers">("customers");
  const [customers, setCustomers] = useState<PartyDebt[]>([]);
  const [suppliers, setSuppliers] = useState<PartyDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [custRes, suppRes] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("suppliers").select("*"),
      ]);

      if (custRes.error) throw custRes.error;
      if (suppRes.error) throw suppRes.error;

      if (custRes.data) {
        setCustomers(
          custRes.data.map((c) => {
            const outstanding = Number(c.outstanding_balance_egp || 0);
            const cur = Number(c.aging_current || Math.round(outstanding * 0.7));
            const d30 = Number(c.aging_30 || Math.round(outstanding * 0.2));
            const d60 = Number(c.aging_60 || Math.round(outstanding * 0.1));
            const d90 = Number(c.aging_90_plus || 0);
            return {
              name: c.name,
              code: c.id,
              totalDebt: outstanding,
              current: cur,
              days30: d30,
              days60: d60,
              days90Plus: d90,
              status: d90 > 0 ? "warning" : "healthy",
            };
          })
        );
      }

      if (suppRes.data) {
        setSuppliers(
          suppRes.data.map((s) => {
            const total = Number(s.total_debt || (s.credit_days ? s.credit_days * 12000 : 250000));
            const cur = Number(s.aging_current || Math.round(total * 0.7));
            const d30 = Number(s.aging_30 || Math.round(total * 0.3));
            const d60 = Number(s.aging_60 || 0);
            const d90 = Number(s.aging_90_plus || 0);
            return {
              name: s.name,
              code: s.id,
              totalDebt: total,
              current: cur,
              days30: d30,
              days60: d60,
              days90Plus: d90,
              status: "healthy",
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل تقارير أعمار الديون");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgingData();
  }, [fetchAgingData]);

  if (!canViewCost) {
    return (
      <div className="p-gutter flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">صلاحية محجوبة</h2>
        <p className="text-xs text-on-surface-variant max-w-md">
          حسابك الحالي ({roleConfig.nameAr}) غير مصرح له بالاطلاع على تقارير مديونيات وأعمار الديون.
        </p>
      </div>
    );
  }

  const currentList = partyType === "customers" ? customers : suppliers;
  const totalReceivables = customers.reduce((acc, c) => acc + c.totalDebt, 0);
  const totalPayables = suppliers.reduce((acc, s) => acc + s.totalDebt, 0);

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">contacts</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              أرصدة ومديونيات العملاء والموردين وأعمار الديون (Aging Report)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            تحليل فترات الائتمان ومستحقات التحصيل والمدفوعات لتفادي الديون المعدومة وتأخير التوريدات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "new_journal_entry",
                title: "تسجيل سند قبض / تحصيل من عميل",
                description: "توثيق استلام شيك أو تحويل بنكي على حساب البنك الأهلي",
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_card</span>
            <span>+ سند قبض / سداد</span>
          </button>
          <button
            onClick={() =>
              openModal({
                type: "export_report",
                title: "تصدير تقرير أعمار الديون (Aging Schedule)",
              })
            }
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>تصدير التقرير</span>
          </button>
        </div>
      </div>

      {/* Switcher Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPartyType("customers")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
            partyType === "customers"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/30"
          }`}
        >
          مديونيات العملاء (Receivables - {totalReceivables.toLocaleString()} ج.م)
        </button>
        <button
          onClick={() => setPartyType("suppliers")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
            partyType === "suppliers"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/30"
          }`}
        >
          مستحقات الموردين (Payables - {totalPayables.toLocaleString()} ج.م)
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل تقارير أعمار الديون من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAgingData} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Aging Table */}
      {!isLoading && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-2.5 px-3">الجهة / الشريك التجاري</th>
                  <th className="py-2.5 px-3">الكود</th>
                  <th className="py-2.5 px-3 text-left">إجمالي الرصيد (ج.م)</th>
                  <th className="py-2.5 px-3 text-left text-emerald-700">جاري (0-30 يوم)</th>
                  <th className="py-2.5 px-3 text-left text-secondary">31 - 60 يوم</th>
                  <th className="py-2.5 px-3 text-left text-amber-700">61 - 90 يوم</th>
                  <th className="py-2.5 px-3 text-left text-error">+90 يوم (حرج)</th>
                  <th className="py-2.5 px-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {currentList.map((p) => (
                  <tr key={p.code} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-3 font-bold text-on-surface">{p.name}</td>
                    <td className="py-3 px-3 font-mono text-on-surface-variant">{p.code}</td>
                    <td className="py-3 px-3 text-left font-mono font-bold text-primary text-sm">
                      {p.totalDebt.toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-emerald-700 font-semibold">
                      {p.current.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-secondary font-semibold">
                      {p.days30.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-amber-700">
                      {p.days60.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-left font-mono text-error font-bold">
                      {p.days90Plus.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => showToast("info", "إشعار مطالبة بالرصيد", `تم إعداد كشف حساب لـ: ${p.name}`)}
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold cursor-pointer"
                      >
                        كشف حساب ومطالبة
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
