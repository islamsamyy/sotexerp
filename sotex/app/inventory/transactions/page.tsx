"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface Transaction {
  id: string;
  type: "grn" | "issue" | "return";
  typeAr: string;
  referenceDoc: string;
  date: string;
  warehouse: string;
  itemsSummary: string;
  officer: string;
  status: "approved" | "pending";
}

export default function TransactionsPage() {
  const { openModal, stockMovements } = useERP();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setTransactions(
          data.map((r) => {
            const rawType = r.type as string;
            const normType: Transaction["type"] =
              rawType === "GRN" || rawType === "grn"
                ? "grn"
                : rawType === "RETURN" || rawType === "return"
                ? "return"
                : "issue";
            return {
              id: r.id,
              type: normType,
              typeAr:
                r.type_ar ||
                (normType === "grn"
                  ? "إذن استلام فحص (GRN)"
                  : normType === "return"
                  ? "إذن ارتجاع خامات للمخزن"
                  : "إذن صرف للتشغيل"),
              referenceDoc: r.reference_doc || "مستند مخزني",
              date: r.date_label || r.movement_date || "اليوم",
              warehouse: r.warehouse || "مخزن الأقمشة الخام",
              itemsSummary: r.items_summary || `${r.quantity} ${r.unit} ${r.item_name}`,
              officer: r.officer || r.created_by || "أ. مصطفى عبد العزيز",
              status: (r.status || "approved") as Transaction["status"],
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل حركات المخازن");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, stockMovements.length]);

  const filtered =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type === filterType);

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">sync_alt</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إذون الصرف والإضافة (GRN) وحركات المخازن</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            سجل كافة الحركات المخزنية المعتمدة: أذون الاستلام الفحص، صرف الخامات للإنتاج، والارتجاع
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "new_stock_movement",
                title: "إصدار إذن استلام خامات وفحص (GRN)",
                description: "تسجيل وارد خامات جديدة إلى المستودع",
              })
            }
            className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-secondary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            <span>إذن استلام خامات (GRN)</span>
          </button>
          <button
            onClick={() =>
              openModal({
                type: "new_stock_movement",
                title: "إصدار إذن صرف خامات لخطوط التشغيل",
                description: "خصم الرصيد من المخزن وتحميله على أمر الإنتاج",
              })
            }
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            <span>إذن صرف للتشغيل</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "كافة الحركات المخزنية" },
          { key: "grn", label: "أذون الاستلام والفحص (GRN)" },
          { key: "issue", label: "أذون الصرف لخطوط التشغيل" },
          { key: "return", label: "أذون الارتجاع والفائض" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === tab.key
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل حركات المخازن من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchTransactions} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">رقم الإذن</th>
                <th className="p-3">نوع الحركة</th>
                <th className="p-3">المستند المرجعي</th>
                <th className="p-3">المخزن المعني</th>
                <th className="p-3">بيان الأصناف والكميات</th>
                <th className="p-3">المسؤول / أمين العهدة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.id}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.type === "grn" ? "bg-purple-100 text-purple-800" :
                      item.type === "issue" ? "bg-secondary/15 text-secondary border border-secondary/30" : "bg-amber-100 text-amber-800"
                    }`}>
                      {item.typeAr}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-outline">{item.referenceDoc}</td>
                  <td className="p-3 font-medium text-on-surface">{item.warehouse}</td>
                  <td className="p-3 text-on-surface">{item.itemsSummary}</td>
                  <td className="p-3 text-on-surface-variant">{item.officer}</td>
                  <td className="p-3 font-mono text-outline">{item.date}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      معتمد ومُرحل
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
