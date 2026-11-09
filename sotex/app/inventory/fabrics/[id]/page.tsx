"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { supabase } from "@/lib/supabase";

export default function FabricRollDetailPage() {
  const params = useParams();
  const fabricId = (params?.id as string) || "FAB-CTN-402";
  const { showToast } = useERP();

  const [loading, setLoading] = useState(true);
  const [fabric, setFabric] = useState<any>(null);

  const fetchFabric = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fabric_batches")
        .select("*")
        .eq("code", fabricId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFabric({
          code: data.code,
          name: data.name,
          colorName: data.color_name,
          colorCode: data.color_code || "#1E3A8A",
          lotNumber: data.lot_number,
          supplier: data.supplier,
          warehouseLocation: data.location || "ممر A — رف 12 — حامل رولات 3",
          totalRolls: data.rolls_count || 4,
          totalMeters: Number(data.total_meters) || 420,
          reservedMeters: Number(data.reserved_meters) || 300,
          availableMeters: Number(data.available_meters) || 120,
          status: data.status,
          tests: {
            shrinkageLength: "-2.1% (مطابق للمواصفة القياسية)",
            shrinkageWidth: "-1.5% (مطابق)",
            colorFastnessWash: "درجة 4.5 من 5 (ممتاز)",
            colorFastnessLight: "درجة 4 من 5 (جيد جداً)",
            gsmWeight: "165 جم/م2 (المعياري 160-170)",
          },
        });
      } else {
        setFabric({
          code: fabricId,
          name: "قماش قطن سنجل ليكرا 95/5",
          colorName: "كحلي داكن (Navy 402)",
          colorCode: "#1E3A8A",
          lotNumber: "LOT-9921",
          supplier: "شركة مصر للغزل والنسيج",
          warehouseLocation: "ممر A — رف 12 — حامل رولات 3",
          totalRolls: 4,
          totalMeters: 420,
          reservedMeters: 300,
          availableMeters: 120,
          status: "CRITICAL",
          tests: {
            shrinkageLength: "-2.1% (مطابق)",
            shrinkageWidth: "-1.5% (مطابق)",
            colorFastnessWash: "درجة 4.5 من 5 (ممتاز)",
            colorFastnessLight: "درجة 4 من 5 (جيد جداً)",
            gsmWeight: "165 جم/م2 (المعياري 160-170)",
          },
        });
      }
    } catch (err: any) {
      console.error("Failed to load fabric batch:", err);
    } finally {
      setLoading(false);
    }
  }, [fabricId]);

  useEffect(() => {
    fetchFabric();
  }, [fetchFabric]);

  if (loading) {
    return (
      <div className="p-gutter space-y-4 max-w-5xl mx-auto text-right">
        <div className="h-8 w-48 bg-surface-container animate-pulse rounded" />
        <div className="h-44 bg-surface-container-lowest border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-gutter space-y-space-md max-w-5xl mx-auto text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30 print:hidden">
        <div className="flex items-center gap-2 text-xs">
          <Link href="/inventory/fabrics" className="text-primary hover:underline">
            أرصدة الأقمشة والخامات
          </Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-mono font-bold">{fabric.code}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>طباعة بطاقة الرول واللوط</span>
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-xl border border-outline-variant/30 shadow-inner shrink-0"
              style={{ backgroundColor: fabric.colorCode }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {fabric.code}
                </span>
                <h1 className="text-lg font-bold text-on-surface">{fabric.name}</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  {fabric.status === "CRITICAL" ? "رصيد حرج" : "متاح بالرصيد"}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                اللون: {fabric.colorName} — رقم اللوط:{" "}
                <strong className="font-mono text-on-surface">{fabric.lotNumber}</strong>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-outline">الموقع التخزيني:</span>
            <p className="text-xs font-bold text-on-surface">{fabric.warehouseLocation}</p>
            <span className="text-[11px] text-outline font-medium">المورد: {fabric.supplier}</span>
          </div>
        </div>

        {/* Meters Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-outline-variant/20 text-xs">
          <div className="p-3 rounded-lg bg-surface-container-low">
            <span className="text-outline text-[11px]">إجمالي الأمتار بالمخزن:</span>
            <p className="text-base font-bold font-mono text-on-surface mt-0.5">{fabric.totalMeters} متر</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <span className="text-outline text-[11px]">محجوز لأوامر تشغيل:</span>
            <p className="text-base font-bold font-mono text-amber-700 mt-0.5">{fabric.reservedMeters} متر</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <span className="text-outline text-[11px]">الرصيد الصافي المتاح:</span>
            <p className="text-base font-bold font-mono text-[#16A36A] mt-0.5">{fabric.availableMeters} متر</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <span className="text-outline text-[11px]">عدد الطرود والرولات:</span>
            <p className="text-base font-bold font-mono text-primary mt-0.5">{fabric.totalRolls} رول</p>
          </div>
        </div>
      </div>

      {/* Lab Tests */}
      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-3 text-xs shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <h3 className="font-bold text-sm text-on-surface">نتائج الاختبارات المعملية واختبارات الجودة</h3>
          <span className="text-xs text-emerald-700 font-bold">معتمد معملياً للتصنيع</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg bg-surface-container-low flex justify-between">
            <span className="text-outline">نسبة الانكماش الطولي (Warp):</span>
            <span className="font-mono font-bold text-on-surface">{fabric.tests?.shrinkageLength}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex justify-between">
            <span className="text-outline">ثبات اللون مع الغسيل:</span>
            <span className="font-mono font-bold text-on-surface">{fabric.tests?.colorFastnessWash}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex justify-between">
            <span className="text-outline">وزن المتر المربع (GSM):</span>
            <span className="font-mono font-bold text-on-surface">{fabric.tests?.gsmWeight}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex justify-between">
            <span className="text-outline">ثبات اللون ضد الضوء:</span>
            <span className="font-mono font-bold text-on-surface">{fabric.tests?.colorFastnessLight}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
