"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface Transfer {
  id: string;
  source: string;
  destination: string;
  itemsCount: number;
  totalQty: string;
  driverName: string;
  vehicleNumber: string;
  departureTime: string;
  status: "in_transit" | "delivered" | "draft";
}

export default function TransfersPage() {
  const { openModal, showToast, currentRole, currentUser } = useERP();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("stock_transfers")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbErr) throw dbErr;

      if (data) {
        setTransfers(
          data.map((r) => {
            const rawStatus = (r.status || "").toLowerCase();
            const normStatus: Transfer["status"] =
              rawStatus.includes("deliver")
                ? "delivered"
                : rawStatus.includes("transit")
                ? "in_transit"
                : "draft";

            return {
              id: r.code,
              source: r.from_facility || "مستودع الأقمشة المركزي - المحلة الكبرى",
              destination: r.to_facility || "صالة القص والتشغيل 1 - المحلة الكبرى",
              itemsCount: Number(r.items_count || 1),
              totalQty: r.total_qty_desc || "غير محدد",
              driverName: r.driver_name || "سائق النقل",
              vehicleNumber: r.vehicle_number || "أ ج د 9412",
              departureTime: r.date_ar || "اليوم",
              status: normStatus,
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذر تحميل حركات التحويل المخزني");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleConfirmDelivery = async (id: string) => {
    try {
      const { error: updateErr } = await supabase
        .from("stock_transfers")
        .update({ status: "DELIVERED" })
        .eq("code", id);

      if (updateErr) throw updateErr;

      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `تأكيد استلام وتسوية شحنة التحويل المخزني رقم ${id}`,
        module: "المخازن والتحويلات",
        severity: "normal",
      });

      showToast("success", "تم تأكيد الاستلام والتسوية", `تم تحديث حالة الشحنة ${id} إلى "تم الاستلام والتأكيد".`);
      fetchTransfers();
    } catch (err: unknown) {
      showToast("error", "فشل تحديث الشحنة", err instanceof Error ? err.message : "خطأ غير متوقع");
    }
  };

  const handlePrintWaybill = (item: Transfer) => {
    showToast("info", "طباعة بوليصة الشحن", `جاري إرسال بوليصة النقل #${item.id} (${item.totalQty}) إلى طابعة المستودع.`);
  };

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">تحويلات الفروع والمستودعات وسيارات الإمداد</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            إدارة أذون التحويل بين الفروع، خطوط السير، ومتابعة الشحنات قيد النقل بين العاشر وأكتوبر والقاهرة
          </p>
        </div>

        <button
          onClick={() =>
            openModal({
              type: "new_stock_transfer",
              title: "إذن تحويل بين الفروع والمستودعات جديد",
              description: "تحديد المخزن المحول منه والمحول إليه مع بيانات السائق والكمية",
            })
          }
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border border-brand-gold/40 hover:border-brand-gold text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-brand-gold">add</span>
          <span>إذن تحويل بين الفروع جديد</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل بيانات الشحنات والتحويلات من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchTransfers} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {transfers.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-xs border rounded-xl bg-surface-container-lowest">
              لا توجد شحنات تحويل حالياً. اضغط على &quot;إذن تحويل بين الفروع جديد&quot; لإنشاء أول شحنة.
            </div>
          ) : (
            transfers.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-right shadow-xs"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-primary text-sm">{item.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.status === 'in_transit' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      item.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status === 'in_transit' ? 'شحنة في الطريق' : item.status === 'delivered' ? 'تم الاستلام والتأكيد' : 'مسودة'}
                    </span>
                  </div>

                  {/* Source & Destination */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-on-surface">
                    <span>من: {item.source}</span>
                    <span className="material-symbols-outlined text-[16px] text-primary">arrow_back</span>
                    <span>إلى: {item.destination}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                    <span>الكمية: <strong className="text-on-surface">{item.totalQty}</strong></span>
                    <span>السائق: {item.driverName} ({item.vehicleNumber})</span>
                    <span className="font-mono text-outline">تاريخ الحركة: {item.departureTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {item.status === "in_transit" && (
                    <button
                      onClick={() => handleConfirmDelivery(item.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>تأكيد الاستلام</span>
                    </button>
                  )}
                  <button
                    onClick={() => handlePrintWaybill(item)}
                    className="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>بوليصة الشحن</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
