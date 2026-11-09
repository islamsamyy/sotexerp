"use client";

import React from "react";
import Link from "next/link";
import { useERP } from "@/lib/erp-context";

export default function AccessDeniedPage() {
  const { roleConfig } = useERP();

  return (
    <div className="p-gutter min-h-[70vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
        <span className="material-symbols-outlined text-[36px]">gpp_bad</span>
      </div>
      <h1 className="text-2xl font-bold text-on-surface">عذراً، ليس لديك صلاحية للوصول إلى هذه الشاشة</h1>
      <p className="text-xs text-on-surface-variant max-w-md leading-relaxed">
        دورك الوظيفي الحالي (<strong>{roleConfig.nameAr}</strong>) غير مصرح له بتنفيذ هذا الإجراء أو تصفح هذه الوحدة وفقاً لسياسات الأمان والحوكمة.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface"
        >
          العودة للرئيسية
        </Link>
        <Link
          href="/access-request"
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">key</span>
          <span>تقديم طلب صلاحية إضافية</span>
        </Link>
      </div>
    </div>
  );
}

