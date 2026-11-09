"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface Station {
  id: string;
  name: string;
  process: string;
  defectRate: string;
  status: "green" | "amber" | "red";
  inspected: number;
  rejected: number;
}

export default function InLineQCPage() {
  const { openModal, showToast } = useERP();
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("quality_inline_stations")
        .select("*")
        .order("id");
      if (fetchErr) throw fetchErr;
      if (data) {
        setStations(
          data.map((r) => {
            const rawStatus = (r.status || "").toLowerCase();
            const normStatus: Station["status"] =
              rawStatus.includes("warning") || rawStatus.includes("amber")
                ? "amber"
                : rawStatus.includes("critical") || rawStatus.includes("red")
                ? "red"
                : "green";
            return {
              id: r.id,
              name: r.name,
              process: r.process,
              defectRate: r.defect_rate,
              status: normStatus,
              inspected: Number(r.inspected || 0),
              rejected: Number(r.rejected || 0),
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل محطات فحص الجودة");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">traffic</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              فحص الجودة المرحلي أثناء التشغيل (In-Line QC Traffic Light)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            نظام إشارات المرور اللحظي لكل محطة تشغيل لاكتشاف العيوب ومعالجتها فوراً قبل انتقال القطعة للمرحلة التالية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "new_inspection",
                title: "تسجيل فحص عينة جودة مرحلية (In-Line QC)",
                description: "تسجيل فحص عشوائي لمحطة خياطة أو تشطيب وفق معيار AQL",
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>+ تسجيل فحص عينة</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل محطات الفحص المرحلي من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStations} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Traffic Light Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((st) => (
            <div
              key={st.id}
              className={`p-5 rounded-2xl border transition-all ${
                st.status === "green"
                  ? "bg-emerald-50/30 border-emerald-300"
                  : st.status === "amber"
                  ? "bg-amber-50/40 border-amber-300 ring-2 ring-amber-400/40"
                  : "bg-red-50/40 border-red-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-on-surface text-sm">{st.name}</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${
                      st.status === "green"
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                        : st.status === "amber"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-rose-500 animate-ping"
                    }`}
                  />
                </div>
              </div>

              <p className="text-xs text-on-surface-variant min-h-[32px]">{st.process}</p>

              <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">نسبة العيوب:</span>
                <span className={`font-bold font-mono text-sm ${st.status === "green" ? "text-emerald-700" : "text-amber-700"}`}>
                  {st.defectRate}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-1">
                <span>فحص: {st.inspected.toLocaleString()} قطعة</span>
                <span className="text-error font-semibold">مرفوض: {st.rejected}</span>
              </div>

              <button
                onClick={() =>
                  openModal({
                    type: "new_inspection",
                    title: `فحص إضافي عاجل لـ: ${st.name}`,
                    description: `تسجيل عينة فحص جديدة لمحطة ${st.name} بعد ملاحظة نسبة العيوب (${st.defectRate})`,
                  })
                }
                className="w-full mt-3 py-1.5 rounded-lg border border-outline-variant/40 bg-white hover:bg-surface-container text-xs font-semibold text-on-surface text-center transition-colors cursor-pointer"
              >
                فحص جودة إضافي
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
