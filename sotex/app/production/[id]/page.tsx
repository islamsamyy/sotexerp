"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "WO-2026-0891";
  const { showToast, canViewCost, activeRole, currentUser, roleConfig } = useERP();

  const [activeTab, setActiveTab] = useState("stages");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .or(`code.eq.${orderId},id.eq.${orderId}`)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setOrder(data);
      } else {
        // Fallback demo order if id does not match a db row
        setOrder({
          code: orderId,
          product_name_ar: "قميص أكسفورد كلاسيكي قطن 100%",
          sku_code: "STX-SHRT-405",
          target_qty: 1850,
          completed_qty: 1120,
          line_name_ar: "خط خياطة القمصان الرجالي A",
          start_date: "2026-11-10",
          due_date: "2026-11-14",
          status: "SEWING",
          efficiency: 92,
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleRecordBatch = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const newCompleted = Math.min(
        Number(order.target_qty),
        Number(order.completed_qty || 0) + 80
      );
      const newStatus = newCompleted >= Number(order.target_qty) ? "COMPLETED" : order.status;

      const { error } = await supabase
        .from("work_orders")
        .update({
          completed_qty: newCompleted,
          status: newStatus,
        })
        .or(`code.eq.${orderId},id.eq.${orderId}`);

      if (error) throw error;

      setOrder((prev: any) => ({
        ...prev,
        completed_qty: newCompleted,
        status: newStatus,
      }));

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "تسجيل إنجاز دفعة إنتاج جديدة",
        entityType: "work_orders",
        entityId: order.code || orderId,
        entityName: order.product_name_ar,
        details: { piecesAdded: 80, totalCompleted: newCompleted },
        severity: "INFO",
      });

      showToast(
        "success",
        "تم تحديث كمية إنجاز الوردية في Supabase",
        `تم تسجيل إنجاز 80 قطعة جديدة بنجاح (الإجمالي: ${newCompleted} / ${order.target_qty})`
      );
    } catch (err: any) {
      showToast("error", "فشل تسجيل الدفعة", err?.message || "خطأ في الاتصال بقاعدة البيانات");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-gutter space-y-4 max-w-5xl mx-auto text-right">
        <div className="h-8 w-48 bg-surface-container animate-pulse rounded" />
        <div className="h-40 bg-surface-container-lowest border rounded-xl animate-pulse" />
      </div>
    );
  }

  const targetQty = Number(order?.target_qty || 1);
  const completedQty = Number(order?.completed_qty || 0);
  const progress = Math.min(100, Math.round((completedQty / targetQty) * 100));

  return (
    <div className="p-gutter space-y-space-md max-w-5xl mx-auto text-right">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30 print:hidden">
        <div className="flex items-center gap-2 text-xs">
          <Link href="/production" className="text-primary hover:underline">
            أوامر الإنتاج والتصنيع
          </Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-mono font-bold">{order.code || orderId}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>طباعة بطاقة التشغيل الميدانية (Job Card)</span>
          </button>
          <button
            onClick={handleRecordBatch}
            disabled={updating || completedQty >= targetQty}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {updating ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">add_task</span>
            )}
            <span>تسجيل إنجاز دفعة (+80 قطعة)</span>
          </button>
        </div>
      </div>

      {/* Order Header Summary Card */}
      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-primary">{order.code || orderId}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/15 text-secondary border border-secondary/30">
                {order.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                كفاءة الخط: {order.efficiency || 92}%
              </span>
            </div>
            <h1 className="text-base font-bold text-on-surface mt-1">{order.product_name_ar}</h1>
            <span className="text-xs text-outline font-mono">
              كود الموديل: {order.sku_code || "STX-SHRT-405"} — العميل: {order.customer_ar || "عقود التصدير"}
            </span>
          </div>

          <div className="flex flex-col items-end text-left sm:text-right">
            <span className="text-xs text-outline">خط التشغيل المخصص:</span>
            <span className="text-xs font-bold text-on-surface">{order.line_name_ar}</span>
            <span className="text-[11px] text-outline font-mono mt-0.5">
              التسليم المستهدف: {order.due_date}
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-outline-variant/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface font-semibold">
              إجمالي نسبة الإنجاز والقص الفعلي: <strong className="text-primary font-mono">{progress}%</strong>
            </span>
            <span className="text-outline font-mono">
              {completedQty.toLocaleString()} من أصل {targetQty.toLocaleString()} قطعة
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-[#16A36A] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-1 text-xs print:hidden">
        {[
          { key: "stages", label: "مراحل خط الإنتاج والتجميع" },
          { key: "materials", label: "استهلاك الأقمشة ومكونات الـ BOM" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-t-lg transition-colors font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary font-bold bg-surface-container-low"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Stages */}
      {activeTab === "stages" && (
        <div className="space-y-3">
          {[
            {
              name: "1. الفرد والقص الآلي (Laser Cutting)",
              status: "completed",
              target: targetQty,
              actual: targetQty,
              supervisor: "م. هاني شاكر",
              time: "مكتمل 100%",
            },
            {
              name: "2. خياطة وتجميع الأجزاء (Sewing Line)",
              status: completedQty >= targetQty ? "completed" : "in_progress",
              target: targetQty,
              actual: completedQty,
              supervisor: "م. محمد السيد",
              time: `${progress}% منجز`,
            },
            {
              name: "3. الكي والتشطيب بالبخار (Steam Finishing)",
              status: "pending",
              target: targetQty,
              actual: Math.round(completedQty * 0.7),
              supervisor: "أ. سعيد عبد الفتاح",
              time: "بانتظار دفعات الخياطة",
            },
            {
              name: "4. التعبئة والتغليف النهائي (Packaging)",
              status: "pending",
              target: targetQty,
              actual: Math.round(completedQty * 0.5),
              supervisor: "أ. عادل نصر",
              time: "بانتظار الفحص النهائي AQL",
            },
          ].map((stg, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between text-xs shadow-xs"
            >
              <div>
                <h4 className="font-bold text-on-surface text-sm">{stg.name}</h4>
                <span className="text-[11px] text-outline">المشرف: {stg.supervisor} — {stg.time}</span>
              </div>
              <div className="text-left font-mono">
                <span className="text-primary font-bold text-sm block">
                  {stg.actual.toLocaleString()} / {stg.target.toLocaleString()} ق
                </span>
                <span className="text-emerald-700 text-[11px] font-bold">
                  {Math.round((stg.actual / stg.target) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Materials Consumption */}
      {activeTab === "materials" && (
        <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-3 text-xs shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h3 className="font-bold text-sm text-on-surface">استهلاك الخامات المعتمدة لأمر التشغيل</h3>
            <span className="text-xs text-outline font-mono">سجل الصرف الفعلي من المخزن</span>
          </div>
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
              <tr>
                <th className="p-2.5">الخامة / المكون</th>
                <th className="p-2.5">المخطط (BOM)</th>
                <th className="p-2.5">المصروف الفعلي</th>
                <th className="p-2.5">الانحراف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              <tr>
                <td className="p-2.5 font-bold">قماش أكسفورد 60/1 أزرق</td>
                <td className="p-2.5 font-mono">2,682 متر</td>
                <td className="p-2.5 font-mono font-bold text-primary">2,640 متر</td>
                <td className="p-2.5 font-mono text-emerald-700">-42 متر (توفير ممتاز)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">أزرار صدف طبيعي مقاس 18</td>
                <td className="p-2.5 font-mono">14,800 زرار</td>
                <td className="p-2.5 font-mono font-bold text-primary">14,850 زرار</td>
                <td className="p-2.5 font-mono text-amber-700">+50 زرار (ضمن التسامح)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">خيط بوليستر سبان 40/2</td>
                <td className="p-2.5 font-mono">222,000 متر</td>
                <td className="p-2.5 font-mono font-bold text-primary">220,000 متر</td>
                <td className="p-2.5 font-mono text-emerald-700">-2,000 متر</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
