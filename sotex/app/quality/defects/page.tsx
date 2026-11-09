"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface DefectItem {
  id: string;
  type: string;
  count: number;
  percentage: string;
  cumulative: string;
  action: string;
  status: "IN_PROGRESS" | "RESOLVED" | "OPEN";
}

export default function DefectsParetoPage() {
  const { openModal } = useERP();
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDefects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("quality_defects")
        .select("*")
        .order("sort_order", { ascending: true });
      if (fetchErr) throw fetchErr;
      if (data) {
        setDefects(
          data.map((r) => ({
            id: r.id,
            type: r.defect_type,
            count: Number(r.count || 0),
            percentage: r.percentage,
            cumulative: r.cumulative,
            action: r.capa_action,
            status: r.status as DefectItem["status"],
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل سجل العيوب");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-error/10 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">bug_report</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              سجل العيوب والمردودات وتحليل باريتو (Pareto Defect Analysis 80/20)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            تحديد الأسباب الجذرية المسؤولة عن 80% من عيوب التصنيع لاتخاذ إجراءات تصحيحية وقائية CAPA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "new_inspection",
                title: "تسجيل عيب تصنيع جديد وفتح إجراء تصحيحي",
                description: "توثيق نوع العيب ومحطة التشغيل والمسؤول عن الإجراء التصحيحي",
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_alert</span>
            <span>+ تسجيل عيب تصنيع (CAPA)</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل تحليل باريتو للعيوب من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDefects} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Visual Pareto Bars */}
      {!isLoading && (
        <>
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-on-surface">مخطط باريتو لأسباب العيوب (ترتيب تنازلي بالتأثير)</h2>
            <div className="space-y-3 pt-2">
              {defects.map((d, idx) => (
                <div key={d.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-on-surface flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-container-high text-primary flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{d.type}</span>
                    </span>
                    <span className="text-primary font-mono font-bold">
                      {d.count} قطعة ({d.percentage}) — تراكمي {d.cumulative}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all ${
                        idx === 0 ? "bg-error" : idx === 1 ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: d.percentage }}
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant pr-7">
                    الإجراء الوقائي الموصى به: <strong>{d.action}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Defect Logs Table */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-on-surface">جدول تفصيل العيوب ومتابعة خطة CAPA</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                  <tr>
                    <th className="py-2.5 px-3">تصنيف العيب</th>
                    <th className="py-2.5 px-3 text-center">العدد</th>
                    <th className="py-2.5 px-3 text-center">النسبة</th>
                    <th className="py-2.5 px-3">التراكمي</th>
                    <th className="py-2.5 px-3">خطة المعالجة والإجراء الوقائي (CAPA)</th>
                    <th className="py-2.5 px-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {defects.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3 px-3 font-bold text-on-surface">{d.type}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-primary">{d.count}</td>
                      <td className="py-3 px-3 text-center font-mono">{d.percentage}</td>
                      <td className="py-3 px-3 font-mono text-on-surface-variant">{d.cumulative}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{d.action}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={d.status === "IN_PROGRESS" ? "warning" : "success"}>
                          {d.status === "IN_PROGRESS" ? "قيد التنفيذ" : "مغلق ومصحح"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
