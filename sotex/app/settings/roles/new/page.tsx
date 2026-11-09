"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

export default function NewRolePage() {
  const router = useRouter();
  const { showToast, currentUser, roleConfig } = useERP();
  const [roleNameAr, setRoleNameAr] = useState("");
  const [roleNameEn, setRoleNameEn] = useState("");
  const [baseRole, setBaseRole] = useState<RoleKey>("PRODUCTION_MANAGER");
  const [canCost, setCanCost] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameAr) {
      showToast("error", "يرجى إدخال اسم الدور بالعربية");
      return;
    }

    setSubmitting(true);
    try {
      const roleKey = `ROLE_${Date.now().toString().slice(-4)}`;
      const base = CORE_ROLES[baseRole];

      const { error } = await supabase.from("roles").insert({
        key: roleKey,
        name_ar: roleNameAr,
        name_en: roleNameEn || roleNameAr,
        category_ar: base.categoryAr,
        description_ar: `دور مخصص مستند إلى ${base.nameAr}`,
        default_path: base.defaultPath,
        can_view_cost: canCost,
        can_view_margins: canCost,
        can_approve_financial: canApprove,
        can_manage_users: false,
        badge_color: base.badgeColor,
        icon: base.icon,
        allowed_nav_prefixes: base.allowedNavPrefixes,
      });

      if (error) throw error;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "إنشاء دور وظيفي مخصص جديد في Supabase",
        entityType: "roles",
        entityId: roleKey,
        entityName: roleNameAr,
        details: { baseRole, canCost, canApprove },
        severity: "WARNING",
      });

      showToast("success", "تم حفظ الدور الوظيفي في Supabase بنجاح", `تم إنشاء الدور (${roleNameAr}) وتفعيل صلاحيات RLS.`);
      setTimeout(() => {
        router.push("/settings/roles");
      }, 500);
    } catch (err: any) {
      showToast("error", "فشل حفظ الدور", err?.message || "خطأ أثناء الحفظ في قاعدة البيانات");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-gutter max-w-2xl mx-auto space-y-space-md">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 text-right">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">إنشاء دور وظيفي مخصص جديد</h1>
          <p className="font-body-sm text-sm text-on-surface-variant">تخصيص صلاحيات محددة عبر نسخ قالب من الأدوار الـ 4 الأساسية</p>
        </div>
        <Link href="/settings/roles" className="text-xs text-outline hover:text-on-surface">إلغاء</Link>
      </div>

      <form onSubmit={handleSubmit} className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right space-y-4 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">اسم الدور بالعربية *</label>
          <input
            type="text"
            required
            placeholder="مثال: مشرف صالة القص والفرز"
            value={roleNameAr}
            onChange={(e) => setRoleNameAr(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">اسم الدور بالإنجليزية</label>
          <input
            type="text"
            placeholder="Cutting Room Supervisor"
            value={roleNameEn}
            onChange={(e) => setRoleNameEn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">نسخ قالب الصلاحيات الأساسي من دور:</label>
          <select
            value={baseRole}
            onChange={(e) => setBaseRole(e.target.value as RoleKey)}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none"
          >
            {Object.keys(CORE_ROLES).map((rk) => (
              <option key={rk} value={rk}>{CORE_ROLES[rk as RoleKey].nameAr}</option>
            ))}
          </select>
        </div>

        <div className="pt-2 border-t border-outline-variant/20 space-y-2">
          <span className="text-xs font-bold text-on-surface">صلاحيات الحقول الحساسة:</span>
          <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={canCost}
              onChange={(e) => setCanCost(e.target.checked)}
              className="rounded accent-primary"
            />
            <span>السماح برؤية أسعار تكلفة المنتجات والخامات</span>
          </label>
          <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={canApprove}
              onChange={(e) => setCanApprove(e.target.checked)}
              className="rounded accent-primary"
            />
            <span>السماح بالاعتماد المالي وإقرار الخصومات</span>
          </label>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex justify-end gap-2">
          <Link
            href="/settings/roles"
            className="px-4 py-2 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs"
          >
            حفظ الدور في Supabase
          </button>
        </div>
      </form>
    </div>
  );
}

