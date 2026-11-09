"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface ScopeItem {
  id: string;
  title: string;
  desc: string;
  rolesAssigned: string;
}

interface FacilityItem {
  id: string;
  nameAr: string;
  city: string;
}

export default function DataScopesPage() {
  const [scopes, setScopes] = useState<ScopeItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [scRes, facRes] = await Promise.all([
          supabase.from("data_scopes").select("*"),
          supabase.from("facilities").select("*"),
        ]);
        if (scRes.data && scRes.data.length > 0) {
          setScopes(
            scRes.data.map((r) => ({
              id: r.id,
              title: r.title,
              desc: r.description,
              rolesAssigned: r.roles_assigned,
            }))
          );
        } else {
          setScopes([
            { id: "1", title: "نطاق كامل الشركة والمصنع (COMPANY_WIDE)", desc: "وصول غير مقيد لكافة الفروع والمخازن وخطوط الإنتاج وحسابات البنوك.", rolesAssigned: "مالك المصنع / مدير النظام" },
            { id: "2", title: "نطاق الفرع والمصنع الرئيسي (BRANCH)", desc: "وصول مقيد لمنشأة محددة (مجمع مصانع المحلة الكبرى) بجميع مخازنها.", rolesAssigned: "مدير الإنتاج والجودة" },
            { id: "3", title: "نطاق المخزن المخصص (WAREHOUSE)", desc: "وصول مقيد لمستودع محدد فقط (أرصدة، أذون صرف وإضافة، وجرد).", rolesAssigned: "مدير المخازن والمستودعات" },
            { id: "4", title: "نطاق الحسابات والعملاء (FINANCE_SCOPE)", desc: "وصول مقيد لبيانات التسعير، عروض الأسعار، القيود اليومية والخزينة.", rolesAssigned: "المدير المالي والمبيعات" },
          ]);
        }

        if (facRes.data && facRes.data.length > 0) {
          setFacilities(
            facRes.data.map((f) => ({
              id: f.id,
              nameAr: f.name_ar,
              city: f.city || "المحلة الكبرى",
            }))
          );
        }
      } catch (e) {
        // use fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">security</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إدارة نطاق الوصول للبيانات (Data Access Scopes)</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            الطبقة الرابعة من نظام الصلاحيات: عزل وتحديد وصول الموظفين جغرافياً حسب المصنع والمخزن في Supabase
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل نطاقات الوصول من قاعدة البيانات...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scopes.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-2 shadow-xs">
                <h3 className="font-bold text-sm text-on-surface">{s.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{s.desc}</p>
                <div className="pt-2 border-t border-outline-variant/20 text-xs">
                  <span className="text-outline">الدور المسند إليه: </span>
                  <strong className="text-primary">{s.rolesAssigned}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-3 shadow-xs">
            <h3 className="font-bold text-sm text-on-surface">الفروع والمستودعات المعرفة بالنظام</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {facilities.map((f) => (
                <div key={f.id} className="p-3 rounded-lg bg-surface-container-low text-xs space-y-1">
                  <span className="font-bold text-on-surface block">{f.nameAr}</span>
                  <span className="text-outline block">المدينة: {f.city}</span>
                  <span className="text-emerald-700 font-semibold block">الحالة: مفعل ومربوط بنظام Supabase</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
