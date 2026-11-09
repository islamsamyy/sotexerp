"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface SalesOrder {
  id: string;
  clientName: string;
  orderType: "export" | "wholesale" | "retail";
  orderTypeAr: string;
  piecesCount: number;
  totalAmountEGP: number;
  paidAmountEGP: number;
  deliveryDate: string;
  status: "ready" | "in_production" | "shipped" | "pending_payment";
}

export default function SalesPage() {
  const { canViewCost, openModal, showToast, currentUser, roleConfig } = useERP();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");

  const fetchSalesOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("sales_orders")
        .select("*")
        .order("delivery_date", { ascending: true });
      if (fetchErr) throw fetchErr;
      if (data) {
        setSalesOrders(
          data.map((r) => {
            const rawType = (r.order_type || "").toLowerCase();
            const normType: SalesOrder["orderType"] =
              rawType.includes("export")
                ? "export"
                : rawType.includes("retail")
                ? "retail"
                : "wholesale";
            const rawStatus = (r.status || "").toLowerCase();
            const normStatus: SalesOrder["status"] =
              rawStatus.includes("ready")
                ? "ready"
                : rawStatus.includes("shipped") || rawStatus.includes("delivered")
                ? "shipped"
                : rawStatus.includes("pending")
                ? "pending_payment"
                : "in_production";
            return {
              id: r.id,
              clientName: r.client_name,
              orderType: normType,
              orderTypeAr: r.order_type_ar || (normType === "export" ? "تصدير خارجي" : "جملة محلي"),
              piecesCount: Number(r.pieces_count || 0),
              totalAmountEGP: Number(r.total_amount_egp || 0),
              paidAmountEGP: Number(r.paid_amount_egp || 0),
              deliveryDate: r.delivery_date,
              status: normStatus,
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل طلبيات البيع");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesOrders();
    const handleUpdate = () => fetchSalesOrders();
    window.addEventListener("sotex_sales_updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    return () => {
      window.removeEventListener("sotex_sales_updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [fetchSalesOrders]);

  const handleUpdateStatus = async (id: string, newStatus: SalesOrder["status"]) => {
    try {
      const dbStatus =
        newStatus === "ready"
          ? "READY_TO_SHIP"
          : newStatus === "shipped"
          ? "DELIVERED"
          : "IN_PRODUCTION";

      const { error: upErr } = await supabase
        .from("sales_orders")
        .update({ status: dbStatus })
        .eq("id", id);
      if (upErr) throw upErr;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: `تحديث حالة طلب البيع: ${id} إلى ${newStatus}`,
        entityType: "sales_orders",
        entityId: id,
        severity: "INFO",
      });

      showToast("success", "تم تحديث حالة طلب البيع في Supabase", `أصبح الطلب #${id} في حالة: ${newStatus}`);
      await fetchSalesOrders();
    } catch (err: any) {
      showToast("error", "فشل تحديث حالة الطلب", err?.message);
    }
  };

  const handleDeleteOrder = async (id: string, client: string) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء وحذف طلب البيع #${id} الخاص بـ "${client}"؟`)) return;
    try {
      const { error: delErr } = await supabase.from("sales_orders").delete().eq("id", id);
      if (delErr) throw delErr;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: `إلغاء وحذف طلب بيع: ${id}`,
        entityType: "sales_orders",
        entityId: id,
        severity: "WARNING",
      });

      showToast("success", "تم إلغاء وحذف طلب البيع بنجاح", `تم حذف الطلب #${id}`);
      setSalesOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      showToast("error", "فشل حذف طلب البيع", err?.message);
    }
  };

  const filtered =
    filterType === "all"
      ? salesOrders
      : salesOrders.filter((o) => o.orderType === filterType);

  const totalSalesVal = salesOrders.reduce((acc, o) => acc + o.totalAmountEGP, 0);
  const totalPieces = salesOrders.reduce((acc, o) => acc + o.piecesCount, 0);
  const inProdPieces = salesOrders
    .filter((o) => o.status === "in_production")
    .reduce((acc, o) => acc + o.piecesCount, 0);
  const readyPieces = salesOrders
    .filter((o) => o.status === "ready")
    .reduce((acc, o) => acc + o.piecesCount, 0);

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">point_of_sale</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إدارة طلبات البيع وعقود التصدير</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            سجل طلبيات الجملة والتصدير، التوريد، ومتابعة تحصيل المدفوعات والشحن
          </p>
        </div>

        <button
          onClick={() =>
            openModal({
              type: "new_sales_order",
              title: "إصدار وتعميد طلب بيع وعقد تصدير جديد",
              description: "تسجيل عقد بيع جديد، بيانات العميل، والكميات المطلوبة",
            })
          }
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>طلب بيع جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">إجمالي مبيعات الشهر</span>
          <p className="text-2xl font-bold font-mono text-primary mt-1">
            {canViewCost ? `${totalSalesVal.toLocaleString()} ج.م` : "••••••"}
          </p>
          <span className="text-[11px] text-outline font-mono">{totalPieces.toLocaleString()} قطعة مباعة</span>
        </div>
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">طلبيات قيد التجهيز بالمصنع</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{inProdPieces.toLocaleString()} قطعة</p>
          <span className="text-[11px] text-outline font-mono">مرتبطة بخطوط الخياطة</span>
        </div>
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">جاهز للتسليم والشحن</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">{readyPieces.toLocaleString()} قطعة</p>
          <span className="text-[11px] text-outline font-mono">جاهزة بمخزن المنتج التام</span>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل طلبات البيع من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSalesOrders} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">رقم الطلب</th>
                <th className="p-3">اسم العميل / التوكيل</th>
                <th className="p-3">نوع الطلب</th>
                <th className="p-3">الكمية</th>
                <th className="p-3">إجمالي القيمة</th>
                <th className="p-3">المسدد</th>
                <th className="p-3">موعد التسليم</th>
                <th className="p-3">حالة الطلب</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.id}</td>
                  <td className="p-3 font-semibold text-on-surface">{item.clientName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.orderType === "export"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-secondary/15 text-secondary border border-secondary/30"
                      }`}
                    >
                      {item.orderTypeAr}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold">{item.piecesCount.toLocaleString()} ق</td>
                  <td className="p-3 font-mono font-bold text-primary">
                    {canViewCost ? `${item.totalAmountEGP.toLocaleString()} ج.م` : "••••••"}
                  </td>
                  <td className="p-3 font-mono text-emerald-700">
                    {canViewCost ? `${item.paidAmountEGP.toLocaleString()} ج.م` : "••••••"}
                  </td>
                  <td className="p-3 font-mono text-outline">{item.deliveryDate}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.status === "ready"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "shipped"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status === "ready"
                        ? "جاهز للتسليم"
                        : item.status === "shipped"
                        ? "تم الشحن والتسليم"
                        : "جاري التشغيل"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {item.status === "in_production" && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "ready")}
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-700 transition-colors"
                          title="تأكيد جاهزية الطلب للتسليم"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        </button>
                      )}
                      {item.status === "ready" && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "shipped")}
                          className="p-1 rounded hover:bg-purple-50 text-purple-700 transition-colors"
                          title="تأكيد خروج الشحنة والتسليم"
                        >
                          <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                        </button>
                      )}
                      <button
                        onClick={() => showToast("info", `طباعة عقد وبيان طلب ${item.id}`, `العميل: ${item.clientName} | الكمية: ${item.piecesCount} قطعة`)}
                        className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-colors"
                        title="طباعة العقد وبوليصة الشحن"
                      >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(item.id, item.clientName)}
                        className="p-1 rounded hover:bg-rose-50 text-rose-700 transition-colors"
                        title="إلغاء وحذف طلب البيع"
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
