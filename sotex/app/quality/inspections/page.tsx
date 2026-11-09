"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface Inspection {
  id: string;
  type: "fabric_incoming" | "in_line" | "final_aql";
  typeAr: string;
  sampleName: string;
  batchQty: number;
  sampleQty: number;
  defectsFound: number;
  decision: "accepted" | "rework" | "rejected";
  inspector: string;
  date: string;
}

export default function InspectionsPage() {
  const { openModal, inspectionRecords } = useERP();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("quality_inspections")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setInspections(
          data.map((r) => {
            const rawType = (r.type || "").toLowerCase();
            const normType: Inspection["type"] =
              rawType.includes("fabric")
                ? "fabric_incoming"
                : rawType.includes("line")
                ? "in_line"
                : "final_aql";
            const rawDecision = (r.decision || "").toLowerCase();
            const normDecision: Inspection["decision"] =
              rawDecision.includes("rework")
                ? "rework"
                : rawDecision.includes("reject")
                ? "rejected"
                : "accepted";
            return {
              id: r.id,
              type: normType,
              typeAr:
                r.type_ar ||
                (normType === "fabric_incoming"
                  ? "فحص أقمشة واردة (نظام 4 نقاط)"
                  : normType === "in_line"
                  ? "فحص تشغيل مرحلي (In-Line)"
                  : "فحص نهائي قبل التسليم (AQL 2.5)"),
              sampleName: r.sample_name || "عينة إنتاج",
              batchQty: Number(r.batch_qty || 0),
              sampleQty: Number(r.sample_qty || 0),
              defectsFound: Number(r.defects_found || 0),
              decision: normDecision,
              inspector: r.inspector || "أ. ياسر عبد العظيم",
              date: r.date_label || "اليوم",
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل تقارير الفحص الفني");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections, inspectionRecords.length]);

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">fact_check</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">سجل الفحص والاختبارات الفنية وتقارير الجودة</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            سجل فحص الأقمشة بنظام الـ 4 نقاط، فحص خطوط الخياطة المرحلي، والفحص النهائي AQL
          </p>
        </div>

        <button
          onClick={() =>
            openModal({
              type: "new_inspection",
              title: "إصدار تقرير فحص عينات جودة جديد (AQL)",
              description: "توثيق حجم اللوت، العينات المختارة، ونسبة العيوب وقرار الفحص النهائي",
            })
          }
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>تقرير فحص عينات جديد</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل تقارير الفحص من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInspections} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">رقم التقرير</th>
                <th className="p-3">نوع الفحص</th>
                <th className="p-3">الدفعة المفحوصة</th>
                <th className="p-3">حجم الدفعة</th>
                <th className="p-3">العينة المختارة</th>
                <th className="p-3">العيوب المرصودة</th>
                <th className="p-3">مفتش الجودة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">قرار الجودة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {inspections.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.id}</td>
                  <td className="p-3 font-medium text-on-surface">{item.typeAr}</td>
                  <td className="p-3 text-on-surface">{item.sampleName}</td>
                  <td className="p-3 font-mono">{item.batchQty.toLocaleString()}</td>
                  <td className="p-3 font-mono">{item.sampleQty} ق</td>
                  <td className="p-3 font-mono text-rose-700 font-bold">{item.defectsFound}</td>
                  <td className="p-3 text-on-surface-variant">{item.inspector}</td>
                  <td className="p-3 font-mono text-outline">{item.date}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.decision === "accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.decision === "rework"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {item.decision === "accepted"
                        ? "مقبول مطابق"
                        : item.decision === "rework"
                        ? "إعادة تشغيل Rework"
                        : "مرفوض"}
                    </span>
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
