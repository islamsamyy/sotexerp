"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface PlanItem {
  orderId: string;
  model: string;
  totalQty: number;
  line: string;
  startDate: string;
  finishDate: string;
  daysRequired: number;
  workersCount: number;
  bottleneck: string;
}

export default function ProductionPlanningPage() {
  const { openModal, workOrders } = useERP();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("work_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setPlans(
          data.map((r, idx) => ({
            orderId: r.id,
            model: r.product_name,
            totalQty: Number(r.target_qty || 0),
            line: r.line || "خط خياطة A",
            startDate: r.start_date || "2026-11-10",
            finishDate: r.due_date || "2026-11-16",
            daysRequired: 4,
            workersCount: idx === 0 ? 28 : idx === 1 ? 24 : 20,
            bottleneck:
              idx === 0
                ? "تركيب الياقة والأساور (مرحلة 6)"
                : idx === 1
                ? "خياطة الجيوب الخلفية المزدوجة"
                : "تطريز شعار الصدر بالليزر",
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل خطط التشغيل");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans, workOrders.length]);

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">view_timeline</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">تخطيط وموازنة خطوط الإنتاج والورديات</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            موازنة أزمنة العمليات القياسية (SAM)، اكتشاف نقاط الاختناق (Bottlenecks)، وجدولة تشغيل الطلبيات
          </p>
        </div>

        <button
          onClick={() =>
            openModal({
              type: "new_work_order",
              title: "جدولة خطة وأمر تشغيل جديد",
              description: "تحديد خط التشغيل والموديل والكمية المستهدفة وتاريخ التسليم",
            })
          }
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>جدولة خطة تشغيل جديدة</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل خطط التشغيل من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchPlans} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          {plans.map((p) => (
            <div key={p.orderId} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">{p.orderId}</span>
                  <span className="font-semibold text-sm text-on-surface">{p.model}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface">
                  {p.line}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-outline-variant/20">
                <div>
                  <span className="text-outline">الكمية المقررة:</span>
                  <p className="font-mono font-bold text-on-surface">{p.totalQty.toLocaleString()} قطعة</p>
                </div>
                <div>
                  <span className="text-outline">أيام التشغيل المطلوبة:</span>
                  <p className="font-mono font-bold text-on-surface">{p.daysRequired} أيام عمل</p>
                </div>
                <div>
                  <span className="text-outline">العمالة المخصصة للخط:</span>
                  <p className="font-mono font-bold text-on-surface">{p.workersCount} عامل/فني</p>
                </div>
                <div>
                  <span className="text-outline">تاريخ البدء والتسليم:</span>
                  <p className="font-mono text-outline">{p.startDate} ← {p.finishDate}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600">report</span>
                <span><strong>نقطة الاختناق الحرجة للخط:</strong> {p.bottleneck}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
