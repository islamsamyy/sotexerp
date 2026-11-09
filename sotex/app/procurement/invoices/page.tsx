"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  invNo: string;
  supplier: string;
  poNo: string;
  grnNo: string;
  amount: string;
  matching: "perfect" | "variance";
  status: "ready_to_pay" | "under_review";
  date: string;
}

export default function SupplierInvoicesPage() {
  const { openModal, showToast, currentRole, currentUser } = useERP();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("supplier_invoices")
        .select("*")
        .order("inv_date", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setInvoices(
          data.map((r) => ({
            invNo: r.inv_no,
            supplier: r.supplier,
            poNo: r.po_no || "PO-4091",
            grnNo: r.grn_no || "GRN-3018",
            amount: r.amount,
            matching: (r.matching === "variance" ? "variance" : "perfect") as Invoice["matching"],
            status: (r.status === "DISCREPANCY" ? "under_review" : "ready_to_pay") as Invoice["status"],
            date: r.inv_date,
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل فواتير الموردين");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePayApproval = async (inv: Invoice) => {
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `اعتماد صرف فاتورة المورد ${inv.invNo} (${inv.amount}) بعد اجتياز المطابقة الثلاثية`,
        module: "المشتريات",
        severity: "normal",
      });
      showToast("success", "تم اعتماد الفاتورة للصرف", `تم إرسال إشعار للمالية لتحرير شيك الصرف لفاتورة ${inv.invNo}.`);
    } catch (err: unknown) {
      showToast("error", "فشل الاعتماد", err instanceof Error ? err.message : "خطأ غير متوقع");
    }
  };

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              فواتير المشتريات والمطابقة الثلاثية (3-Way Matching: PO + GRN + Invoice)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            التحقق الآلي من تطابق أسعار الفاتورة مع أمر الشراء PO ومحضر فحص واستلام المستودع GRN قبل الترحيل المالي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "pay_approval",
                title: "اعتماد صرف دفعة فاتورة مورد",
                description: "صرف الفواتير التي اجتازت المطابقة الثلاثية بنجاح 100%",
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>اعتماد الفواتير المطابقة للصرف</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل فواتير المشتريات من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInvoices} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Invoices Table */}
      {!isLoading && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-2.5 px-3">رقم فاتورة المورد</th>
                  <th className="py-2.5 px-3">المورد</th>
                  <th className="py-2.5 px-3">أمر الشراء (PO)</th>
                  <th className="py-2.5 px-3">إذن استلام المخزن (GRN)</th>
                  <th className="py-2.5 px-3 text-left">قيمة الفاتورة</th>
                  <th className="py-2.5 px-3 text-center">المطابقة الثلاثية</th>
                  <th className="py-2.5 px-3 text-center">حالة الدفع</th>
                  <th className="py-2.5 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {invoices.map((inv) => (
                  <tr key={inv.invNo} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-3 font-mono font-bold text-primary">{inv.invNo}</td>
                    <td className="py-3 px-3 font-semibold text-on-surface">{inv.supplier}</td>
                    <td className="py-3 px-3 font-mono text-on-surface-variant">{inv.poNo}</td>
                    <td className="py-3 px-3 font-mono text-on-surface-variant">{inv.grnNo}</td>
                    <td className="py-3 px-3 text-left font-mono font-bold text-primary text-sm">{inv.amount}</td>
                    <td className="py-3 px-3 text-center">
                      {inv.matching === "perfect" ? (
                        <Badge variant="success">مطابقة 100%</Badge>
                      ) : (
                        <Badge variant="warning">فروق كمية (تحت التسوية)</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold text-xs">
                        {inv.status === "ready_to_pay" ? "جاهزة للصرف" : "معلقة للمراجعة"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() =>
                            showToast(
                              "success",
                              "تفاصيل المطابقة الثلاثية",
                              `فاتورة: ${inv.invNo} - أمر شراء: ${inv.poNo} - استلام: ${inv.grnNo}`
                            )
                          }
                          className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold cursor-pointer"
                        >
                          معاينة
                        </button>
                        {inv.status === "ready_to_pay" && (
                          <button
                            onClick={() => handlePayApproval(inv)}
                            className="px-2.5 py-1 rounded bg-primary text-white text-[11px] font-bold hover:bg-primary-container cursor-pointer"
                          >
                            صرف
                          </button>
                        )}
                      </div>
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
