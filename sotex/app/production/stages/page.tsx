"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface StageCard {
  id: string;
  name: string;
  icon: string;
  supervisor: string;
  activeOrders: number;
  completedPieces: number;
  targetPieces: number;
  defectRate: number;
  status: "running" | "idle" | "delayed";
}

export default function StagesPage() {
  const { showToast } = useERP();
  const [stages, setStages] = useState<StageCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("production_stages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (fetchErr) throw fetchErr;
      if (data) {
        setStages(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            icon: r.icon || "precision_manufacturing",
            supervisor: r.supervisor || "",
            activeOrders: Number(r.active_orders || 0),
            completedPieces: Number(r.completed_pieces || 0),
            targetPieces: Number(r.target_pieces || 1000),
            defectRate: Number(r.defect_rate || 0),
            status: (r.status || "running") as StageCard["status"],
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل مراحل التشغيل");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">conveyor_belt</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">محطات ومراحل التشغيل وصالات المصنع</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            متابعة حية للقطع المنجزة والمعيبة ونسب الإنجاز عبر صالات القص، الخياطة، الكي والتعبئة
          </p>
        </div>

        <button
          onClick={() => showToast("success", "تم فتح نافذة مسح الدفعة المرحلية", "قم بمسح باركود أمر التشغيل لتسجيل خروج الدفعة من المحطة.")}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
          <span>تسجيل خروج دفعة مرحلية</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل مراحل التشغيل من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStages} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Stages Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stages.map((stg) => {
            const progress = Math.min(100, (stg.completedPieces / (stg.targetPieces || 1)) * 100);

            return (
              <div
                key={stg.id}
                className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">{stg.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface">{stg.name}</h3>
                      <span className="text-[11px] text-on-surface-variant">المسؤول: {stg.supervisor}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    تشغيل نشط
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-outline-variant/20">
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline">الأوامر الجارية</span>
                    <p className="text-sm font-bold font-mono text-on-surface">{stg.activeOrders} أوامر</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline">القطع المنجزة</span>
                    <p className="text-sm font-bold font-mono text-emerald-700">{stg.completedPieces} ق</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline">نسبة المعيب</span>
                    <p className="text-sm font-bold font-mono text-rose-700">{stg.defectRate}%</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-outline font-mono">
                    <span>نسبة إنجاز المستهدف اليومي:</span>
                    <span>{progress.toFixed(0)}% ({stg.completedPieces} من {stg.targetPieces})</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
