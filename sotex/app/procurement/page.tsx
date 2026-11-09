"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface PO {
  id: string;
  supplier: string;
  items: string;
  totalEGP: number;
  date: string;
  expectedDelivery: string;
  status: "delivered" | "in_shipping" | "pending_approval";
}

export default function ProcurementPage() {
  const { canViewCost, openModal, showToast, currentUser, roleConfig } = useERP();
  const [purchaseOrders, setPurchaseOrders] = useState<PO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPOs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("po_date", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setPurchaseOrders(
          data.map((r) => {
            const rawStatus = (r.status || "").toLowerCase();
            const normStatus: PO["status"] =
              rawStatus.includes("completed") || rawStatus.includes("delivered")
                ? "delivered"
                : rawStatus.includes("transit") || rawStatus.includes("shipping")
                ? "in_shipping"
                : "pending_approval";
            return {
              id: r.id,
              supplier: r.supplier,
              items: r.items,
              totalEGP: Number(r.total_egp || 0),
              date: r.po_date,
              expectedDelivery: r.expected_delivery,
              status: normStatus,
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل أوامر الشراء");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPOs();
    const handleUpdate = () => fetchPOs();
    window.addEventListener("sotex_procurement_updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    return () => {
      window.removeEventListener("sotex_procurement_updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [fetchPOs]);

  const handleMarkDelivered = async (id: string, supplier: string) => {
    try {
      const { error: upErr } = await supabase
        .from("purchase_orders")
        .update({ status: "COMPLETED" })
        .eq("id", id);
      if (upErr) throw upErr;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: `تأكيد وصول واستلام شحنة أمر الشراء: ${id}`,
        entityType: "purchase_orders",
        entityId: id,
        entityName: supplier,
        severity: "INFO",
      });

      showToast(
        "success",
        "تم تأكيد استلام الشحنة في Supabase",
        `تم تحويل حالة أمر الشراء #${id} إلى "تم التوريد والفحص".`
      );
      await fetchPOs();
    } catch (err: any) {
      showToast("error", "فشل تحديث حالة أمر الشراء", err?.message);
    }
  };

  const handleDeletePO = async (id: string, supplier: string) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء وحذف أمر الشراء #${id} الصادر لـ "${supplier}"؟`)) return;
    try {
      const { error: delErr } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (delErr) throw delErr;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: `إلغاء أمر شراء خامات: ${id}`,
        entityType: "purchase_orders",
        entityId: id,
        severity: "WARNING",
      });

      showToast("success", "تم إلغاء أمر الشراء بنجاح", `تم حذف أمر الشراء #${id}`);
      setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      showToast("error", "فشل حذف أمر الشراء", err?.message);
    }
  };

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">shopping_cart</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إدارة المشتريات والتوريد وعقود الموردين</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            متابعة أوامر الشراء، عروض الموردين، ومواعيد وصول شحنات الأقمشة والإكسسوارات
          </p>
        </div>

        <button
          onClick={() =>
            openModal({
              type: "new_po",
              title: "إصدار أمر شراء وتوريد خامات جديد",
              description: "تحديد المورد المعتمد، الخامات، والكميات المطلوبة",
            })
          }
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>أمر شراء توريد جديد</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل أوامر الشراء من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchPOs} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">رقم أمر الشراء</th>
                <th className="p-3">المورد المعتمد</th>
                <th className="p-3">بيان الخامات المطلوبة</th>
                <th className="p-3">القيمة الإجمالية</th>
                <th className="p-3">تاريخ الإصدار</th>
                <th className="p-3">تاريخ الوصول المتوقع</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{po.id}</td>
                  <td className="p-3 font-semibold text-on-surface">{po.supplier}</td>
                  <td className="p-3 text-on-surface-variant">{po.items}</td>
                  <td className="p-3 font-mono font-bold text-primary">
                    {canViewCost ? `${po.totalEGP.toLocaleString()} ج.م` : "••••••"}
                  </td>
                  <td className="p-3 font-mono text-outline">{po.date}</td>
                  <td className="p-3 font-mono text-outline">{po.expectedDelivery}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        po.status === "delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : po.status === "in_shipping"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {po.status === "delivered"
                        ? "تم التوريد والفحص"
                        : po.status === "in_shipping"
                        ? "شحنة في الطريق"
                        : "بانتظار الاعتماد"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {po.status !== "delivered" && (
                        <button
                          onClick={() => handleMarkDelivered(po.id, po.supplier)}
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-700 transition-colors"
                          title="تأكيد استلام وفحص الشحنة بالمخازن"
                        >
                          <span className="material-symbols-outlined text-[16px]">verified</span>
                        </button>
                      )}
                      <button
                        onClick={() => showToast("info", `طباعة أمر شراء ${po.id}`, `المورد: ${po.supplier}`)}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
                        title="طباعة أمر الشراء"
                      >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                      </button>
                      <button
                        onClick={() => handleDeletePO(po.id, po.supplier)}
                        className="p-1 rounded hover:bg-rose-50 text-rose-700 transition-colors"
                        title="إلغاء أمر الشراء"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
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
