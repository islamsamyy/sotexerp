"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

export default function PnLPage() {
  const { openModal, showToast } = useERP();

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">analytics</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              قائمة الدخل والأرباح والخسائر وتحليل التكاليف (P&L Statement)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            تحليل إجمالي الإيرادات، تكلفة البضاعة المباعة (COGS)، ومصروفات التشغيل، وصافي الربح المحقق
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openModal({
                type: "export_report",
                title: "تصدير قائمة الدخل التفصيلية P&L (PDF/Excel)",
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>تصدير قائمة الدخل الرسمية</span>
          </button>
        </div>
      </div>

      {/* Financial Statement Breakdown Card */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
        <div className="border-b border-outline-variant/20 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-on-surface">بيان الدخل الشامل — شهر أكتوبر 2026</h2>
            <p className="text-xs text-on-surface-variant">عملة التقرير: الجنيه المصري (EGP) — متوافق مع معايير المحاسبة المصرية</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
            صافي هامش الربح: 23.1%
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Revenue */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low font-bold text-on-surface text-sm">
            <span>إجمالي إيرادات المبيعات والتصدير</span>
            <span className="font-mono text-primary text-base">4,850,200 ج.م</span>
          </div>

          {/* COGS Section */}
          <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-secondary text-xs">
              <span>تكلفة البضاعة المصنعة والمباعة (COGS)</span>
              <span className="font-mono text-error">- 2,840,000 ج.م</span>
            </div>
            <div className="pr-4 space-y-1.5 text-on-surface-variant text-[11px]">
              <div className="flex items-center justify-between">
                <span>• خامات الأقمشة المباشرة المستهلكة</span>
                <span className="font-mono">1,820,000 ج.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• أجور تشغيل مباشرة بالقطعة (صالة الخياطة والقص)</span>
                <span className="font-mono">720,000 ج.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• مستلزمات إنتاج وإكسسوارات (خيوط، أزرار، سحابات)</span>
                <span className="font-mono">300,000 ج.م</span>
              </div>
            </div>
          </div>

          {/* Gross Margin */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-sm">
            <span>مجمل الربح الصناعي (Gross Profit)</span>
            <span className="font-mono text-emerald-800 text-base">2,010,200 ج.م (41.4%)</span>
          </div>

          {/* OpEx */}
          <div className="p-4 rounded-xl border border-outline-variant/20 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-secondary text-xs">
              <span>المصروفات التشغيلية والبيعية والإدارية (OpEx)</span>
              <span className="font-mono text-error">- 890,800 ج.م</span>
            </div>
            <div className="pr-4 space-y-1.5 text-on-surface-variant text-[11px]">
              <div className="flex items-center justify-between">
                <span>• رواتب الإدارة والمشرفين والجودة والأمن</span>
                <span className="font-mono">420,000 ج.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• استهلاك الطاقة الكهربائية والمياه والوقود الصناعي</span>
                <span className="font-mono">240,800 ج.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• إهلاك آلات ومعدات القص والخياطة (Depreciation)</span>
                <span className="font-mono">130,000 ج.م</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• نولون شحن وتفريغ وتخليص جمركي لتصدير الموانئ</span>
                <span className="font-mono">100,000 ج.م</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary text-white font-bold text-base shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-emerald-400">verified</span>
              <span>صافي الأرباح التشغيلية قبل الضرائب (EBIT)</span>
            </div>
            <span className="font-mono text-xl text-emerald-400">+ 1,119,400 ج.م</span>
          </div>
        </div>
      </div>
    </div>
  );
}

