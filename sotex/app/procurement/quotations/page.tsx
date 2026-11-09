"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface RFQItem {
  id: string;
  title: string;
  createdDate: string;
  dueDate: string;
  status: "comparing" | "awarded";
  quotes: {
    supplier: string;
    pricePerMeter: string;
    deliveryDays: string;
    score: number;
    selected: boolean;
  }[];
}

export default function QuotationsRFQPage() {
  const { openModal, showToast, currentRole, currentUser } = useERP();
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRFQs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("procurement_rfqs")
        .select("*")
        .order("created_date", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setRfqs(
          data.map((r) => ({
            id: r.id,
            title: r.title,
            createdDate: r.created_date,
            dueDate: r.due_date,
            status: (r.status === "AWARDED" ? "awarded" : "comparing") as RFQItem["status"],
            quotes: (r.quotes_json || []).map((q: any) => ({
              supplier: q.supplier,
              pricePerMeter: q.pricePerUnit || q.pricePerMeter,
              deliveryDays: q.deliveryDays,
              score: Number(q.score || 90),
              selected: Boolean(q.recommended || q.selected),
            })),
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل مناقصات المشتريات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  const handleAwardPO = async (rfqId: string, supplier: string) => {
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `ترسية مناقصة الخامات ${rfqId} وإصدار أمر شراء PO للمورد ${supplier}`,
        module: "المشتريات",
        severity: "normal",
      });
      showToast("success", "تم إصدار أمر الشراء PO", `تم تحويل العرض إلى أمر شراء معتمد لـ: ${supplier}`);
    } catch (err: unknown) {
      showToast("error", "فشل الترسية", err instanceof Error ? err.message : "خطأ غير متوقع");
    }
  };

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">request_quote</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              مناقصات وعروض أسعار الموردين ومقارنة عروض الغزل (RFQ Comparison)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            المفاضلة الذكية بين أسعار خامات الأقمشة، مواعيد التوريد، وتقييم جودة عينات المعامل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "new_rfq",
                title: "طرح مناقصة / طلب عرض سعر خامات جديد (RFQ)",
                description: "تحديد مواصفات الخامات المطلوبة والكميات وشركاء التوريد المدعوين",
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ طرح مناقصة RFQ جديدة</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل مناقصات الموردين من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchRFQs} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* RFQ Comparison Cards */}
      {!isLoading && (
        <div className="space-y-4">
          {rfqs.map((rfq) => (
            <div key={rfq.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{rfq.id}</span>
                    <Badge variant={rfq.status === "awarded" ? "success" : "info"}>
                      {rfq.status === "awarded" ? "تمت الترسية" : "مقارنة العروض جارية"}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface mt-1">{rfq.title}</h3>
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  آخر موعد لتلقي العروض: <strong>{rfq.dueDate}</strong>
                </div>
              </div>

              {/* Comparison Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                    <tr>
                      <th className="py-2.5 px-3">المورد المقترح</th>
                      <th className="py-2.5 px-3">سعر الوحدة</th>
                      <th className="py-2.5 px-3">مدة التوريد</th>
                      <th className="py-2.5 px-3">درجة التقييم الفني</th>
                      <th className="py-2.5 px-3 text-center">التوصية</th>
                      <th className="py-2.5 px-3 text-center">إجراء الاعتماد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {rfq.quotes.map((q, idx) => (
                      <tr key={idx} className={q.selected ? "bg-emerald-50/40" : "hover:bg-surface-container-low/50"}>
                        <td className="py-3 px-3 font-bold text-on-surface flex items-center gap-2">
                          {q.selected && <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>}
                          <span>{q.supplier}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-primary">{q.pricePerMeter}</td>
                        <td className="py-3 px-3">{q.deliveryDays}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-700">{q.score} / 100</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {q.selected ? (
                            <Badge variant="success">العرض الأفضل فنياً وسعرياً</Badge>
                          ) : (
                            <span className="text-[11px] text-on-surface-variant">احتياطي</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleAwardPO(rfq.id, q.supplier)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              q.selected
                                ? "bg-primary text-on-primary hover:bg-primary-container"
                                : "border border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            إصدار أمر الشراء PO
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
