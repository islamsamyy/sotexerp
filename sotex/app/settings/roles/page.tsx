"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { RoleKey } from "@/lib/types";

interface RoleRecord {
  code: RoleKey;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  descriptionAr: string;
  canViewCost: boolean;
  canViewMargins: boolean;
  canApproveFinancial: boolean;
  icon: string;
  badgeColor: string;
}

export default function RolesManagementPage() {
  const { activeRole, setActiveRole } = useERP();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("roles")
        .select("*")
        .order("code");
      if (fetchErr) throw fetchErr;
      if (data) {
        setRoles(
          data.map((r) => ({
            code: r.code as RoleKey,
            nameAr: r.name_ar,
            nameEn: r.name_en,
            categoryAr: r.category_ar,
            descriptionAr: r.description_ar,
            canViewCost: Boolean(r.can_view_cost),
            canViewMargins: Boolean(r.can_view_margins),
            canApproveFinancial: Boolean(r.can_approve_financial),
            icon: r.icon || "badge",
            badgeColor: r.badge_color || "bg-primary/10 text-primary",
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل الأدوار الوظيفية");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">badge</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إدارة الأدوار الوظيفية والصلاحيات</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            نظام الصلاحيات رباعي الطبقات المربوط بـ PostgreSQL RLS في Supabase
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings/permissions/matrix"
            className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>مصفوفة الصلاحيات الشاملة</span>
          </Link>
          <Link
            href="/settings/roles/new"
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>إنشاء دور مخصص جديد</span>
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل الأدوار والصلاحيات من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchRoles} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* 4 Core Roles Cards Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const isCurrentActive = activeRole === role.code;

            return (
              <div
                key={role.code}
                className={`p-5 rounded-xl border bg-surface-container-lowest text-right space-y-4 transition-all shadow-xs ${
                  isCurrentActive ? "border-primary ring-1 ring-primary/20 shadow-md" : "border-outline-variant/30 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${role.badgeColor}`}>
                      <span className="material-symbols-outlined text-[24px]">{role.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-on-surface">{role.nameAr}</h3>
                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-on-primary">
                            الدور النشط حالياً
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-outline font-mono">{role.nameEn}</span>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-lg bg-surface-container font-medium text-on-surface">
                    {role.categoryAr}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {role.descriptionAr}
                </p>

                {/* Permission highlights */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20 text-center text-xs">
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline">بيانات التكلفة</span>
                    <p className={`font-bold mt-0.5 ${role.canViewCost ? "text-emerald-700" : "text-rose-700"}`}>
                      {role.canViewCost ? "مصرح" : "محجوب"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline">هوامش الربح</span>
                    <p className={`font-bold mt-0.5 ${role.canViewMargins ? "text-emerald-700" : "text-rose-700"}`}>
                      {role.canViewMargins ? "مصرح" : "محجوب"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <span className="text-[10px] text-outline">الاعتماد المالي</span>
                    <p className={`font-bold mt-0.5 ${role.canApproveFinancial ? "text-emerald-700" : "text-rose-700"}`}>
                      {role.canApproveFinancial ? "مصرح" : "محجوب"}
                    </p>
                  </div>
                </div>

                {/* Switch button */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                  <span className="text-on-surface-variant">
                    الكود: <strong className="font-mono">{role.code}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/settings/roles/${role.code}`}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-on-surface text-xs font-semibold"
                    >
                      تعديل الصلاحيات
                    </Link>
                    <button
                      onClick={() => setActiveRole(role.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isCurrentActive
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface"
                      }`}
                    >
                      {isCurrentActive ? "أنت تتصفح بهذا الدور" : "معاينة النظام بهذا الدور"}
                    </button>
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
