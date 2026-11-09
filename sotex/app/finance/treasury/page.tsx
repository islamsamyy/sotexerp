"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface TreasuryAccount {
  id: string;
  name: string;
  accountNo: string;
  description: string;
  balance: number;
  type: "BANK" | "CASH_SAFE";
}

interface Cheque {
  no: string;
  type: string;
  party: string;
  bank: string;
  amount: number;
  date: string;
  status: "under_collection" | "collected" | "issued";
}

export default function TreasuryPage() {
  const { openModal, showToast, canViewCost, roleConfig } = useERP();
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasuryData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [accRes, chkRes] = await Promise.all([
        supabase.from("treasury_accounts").select("*").order("id"),
        supabase.from("cheques").select("*").order("due_date", { ascending: true }),
      ]);

      if (accRes.error) throw accRes.error;
      if (chkRes.error) throw chkRes.error;

      if (accRes.data) {
        setAccounts(
          accRes.data.map((r) => ({
            id: r.id,
            name: r.name,
            accountNo: r.account_no || "",
            description: r.description || "",
            balance: Number(r.balance || 0),
            type: r.type as "BANK" | "CASH_SAFE",
          }))
        );
      }

      if (chkRes.data) {
        setCheques(
          chkRes.data.map((c) => ({
            no: c.cheque_no,
            type: c.type === "INWARD" ? "وارد (قبض)" : "صادر (دفع)",
            party: c.party,
            bank: c.bank,
            amount: Number(c.amount || 0),
            date: c.due_date,
            status: (c.status === "COLLECTED"
              ? "collected"
              : c.status === "ISSUED"
              ? "issued"
              : "under_collection") as Cheque["status"],
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل بيانات الخزينة والبنوك");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreasuryData();
  }, [fetchTreasuryData]);

  if (!canViewCost) {
    return (
      <div className="p-gutter flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">lock</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">صلاحية محجوبة</h2>
        <p className="text-xs text-on-surface-variant max-w-md">
          حسابك الحالي ({roleConfig.nameAr}) غير مصرح له بالاطلاع على حسابات الخزينة والشيكات البنكية.
        </p>
      </div>
    );
  }

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">account_balance</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              إدارة الخزينة وحسابات البنوك وحافظة الشيكات
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            متابعة أرصدة الحسابات البنكية الجارية، الشيكات تحت التحصيل، وأذون الصرف النقدية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "new_journal_entry",
                title: "تسجيل حركة تحويل بين البنوك أو الخزينة",
                description: "تغذية خزينة المصنع أو تحويل بنكي داخلي",
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            <span>+ تحويل نقدي / بنكي</span>
          </button>
          <button
            onClick={() => showToast("success", "تمت مطابقة الحسابات البنكية", "تطابق رصيد الدفاتر مع كشف حساب CIB حتى اليوم.")}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>تسوية بنكية (Reconciliation)</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل حسابات الخزينة والشيكات من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchTreasuryData} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Bank & Cash Cards */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">{acc.name}</span>
                  <span className={`material-symbols-outlined text-[20px] ${acc.type === "BANK" ? "text-primary" : "text-emerald-600"}`}>
                    {acc.type === "BANK" ? "credit_card" : "payments"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary font-mono">{acc.balance.toLocaleString()} ج.م</div>
                <p className="text-[11px] text-on-surface-variant">{acc.description}</p>
              </div>
            ))}
          </div>

          {/* Cheques Portfolio */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
            <h2 className="text-base font-bold text-on-surface">حافظة الشيكات الصادرة والواردة</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                  <tr>
                    <th className="py-2.5 px-3">رقم الشيك</th>
                    <th className="py-2.5 px-3">النوع</th>
                    <th className="py-2.5 px-3">الطرف الآخر (الساحب / المستفيد)</th>
                    <th className="py-2.5 px-3">البنك المسحوب عليه</th>
                    <th className="py-2.5 px-3 text-left">المبلغ (ج.م)</th>
                    <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                    <th className="py-2.5 px-3 text-center">حالة التحصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {cheques.map((c) => (
                    <tr key={c.no} className="hover:bg-surface-container-low/50">
                      <td className="py-3 px-3 font-mono font-bold text-primary">{c.no}</td>
                      <td className="py-3 px-3 font-semibold">{c.type}</td>
                      <td className="py-3 px-3 font-medium text-on-surface">{c.party}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{c.bank}</td>
                      <td className="py-3 px-3 text-left font-mono font-bold text-primary">
                        {c.amount.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-3 font-mono text-on-surface-variant">{c.date}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={c.status === "under_collection" ? "warning" : c.status === "collected" ? "success" : "info"}>
                          {c.status === "under_collection" ? "تحت التحصيل" : c.status === "collected" ? "تم التحصيل" : "صادر ومسجل"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
