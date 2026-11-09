"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export default function OEEPage() {
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOEE = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("production_lines")
        .select("*")
        .order("id");

      if (error) throw error;
      setLines(data || []);
    } catch (err) {
      console.error("Failed to load OEE lines:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOEE();
  }, [fetchOEE]);

  const avgOEE = lines.length
    ? (
        lines.reduce((acc, l) => acc + Number(l.overall_oee || 0), 0) / lines.length
      ).toFixed(1)
    : "87.5";

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">speed</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">
              لوحة الفعالية الشاملة لكفاءة الخطوط (OEE)
            </h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            مؤشرات الفعالية التشغيلية الكلية: التوافر (Availability)، معدل الأداء (Performance)، ومعدل الجودة (Quality)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-surface-container font-mono text-primary font-bold">
            متوسط المصنع اليوم: {avgOEE}%
          </span>
        </div>
      </div>

      {/* Lines Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-surface-container-lowest border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lines.map((line) => {
            const oeeVal = Number(line.overall_oee || 0);
            const statusClass =
              oeeVal >= 85 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50";

            return (
              <div
                key={line.id}
                className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-outline">{line.line_code}</span>
                    <h3 className="font-bold text-sm text-on-surface">{line.line_name}</h3>
                    <span className="text-[11px] text-on-surface-variant">
                      المشرف: {line.supervisor} — العمال: {line.workers_count} فني
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-surface-container-low min-w-[75px]">
                    <span className="text-[10px] text-outline font-semibold">OEE الكلي</span>
                    <span className="text-lg font-bold font-mono text-primary">{oeeVal}%</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${statusClass}`}>
                      {oeeVal >= 85 ? "ممتاز" : "يحتاج تحسين"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline block">التوافر (Availability)</span>
                    <span className="font-mono font-bold text-on-surface">{line.availability}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline block">معدل الأداء (Performance)</span>
                    <span className="font-mono font-bold text-on-surface">{line.performance}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline block">معدل الجودة (Quality)</span>
                    <span className="font-mono font-bold text-on-surface">{line.quality}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-on-surface-variant font-mono">
                    <span>المنجز: {(line.actual_daily || 0).toLocaleString()} قطعة</span>
                    <span>المستهدف اليومي: {(line.target_daily || 0).toLocaleString()} قطعة</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((line.actual_daily || 0) / (line.target_daily || 1)) * 100)
                        )}%`,
                      }}
                    />
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
