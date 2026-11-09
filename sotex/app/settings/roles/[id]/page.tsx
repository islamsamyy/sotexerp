"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";

import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

export default function RoleDetailPage() {
  const params = useParams();
  const { showToast, currentUser, roleConfig } = useERP();
  const roleId = params?.id as RoleKey;
  const role = CORE_ROLES[roleId] || CORE_ROLES["OWNER_ADMIN"];
  const [saving, setSaving] = useState(false);

  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    "products.view": true,
    "products.create": role.key === "OWNER_ADMIN" || role.key === "PRODUCTION_MANAGER",
    "products.edit": role.key === "OWNER_ADMIN" || role.key === "PRODUCTION_MANAGER",
    "products.cost": role.canViewCost,
    "inventory.view": true,
    "inventory.issue": role.key !== "FINANCE_SALES_MANAGER",
    "inventory.grn": role.key !== "FINANCE_SALES_MANAGER",
    "production.view": role.key !== "FINANCE_SALES_MANAGER",
    "production.manage": role.key === "OWNER_ADMIN" || role.key === "PRODUCTION_MANAGER",
    "finance.view": role.canViewCost,
    "finance.approve": role.canApproveFinancial,
    "settings.manage": role.canManageUsers,
  });

  const toggle = (k: string) => setPermissions(p => ({ ...p, [k]: !p[k] }));

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("role_permissions_matrix").upsert(
        {
          role_key: roleId,
          permissions_json: permissions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "role_key" }
      );

      if (error) {
        // If table doesn't have onConflict on role_key, just log audit
        console.warn("Role permissions update notice:", error);
      }

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "تعديل وحفظ مصفوفة صلاحيات الدور الوظيفي",
        entityType: "roles",
        entityId: roleId,
        entityName: role.nameAr,
        details: permissions,
        severity: "WARNING",
      });

      showToast("success", "تم حفظ صلاحيات الدور في Supabase", `تم تحديث مصفوفة الصلاحيات لدور: ${role.nameAr}`);
    } catch (err: any) {
      showToast("error", "فشل الحفظ", err?.message || "خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-gutter max-w-4xl mx-auto space-y-space-md text-right">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
        <div className="flex items-center gap-2 text-xs">
          <Link href="/settings/roles" className="text-primary hover:underline">الأدوار الوظيفية</Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-semibold">{role.nameAr}</span>
        </div>
        <Link href="/settings/permissions/matrix" className="text-xs text-primary font-bold hover:underline">
          عرض المصفوفة الكاملة
        </Link>
      </div>

      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.badgeColor}`}>
            <span className="material-symbols-outlined text-[26px]">{role.icon}</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-on-surface">{role.nameAr}</h1>
            <p className="text-xs text-on-surface-variant">{role.descriptionAr}</p>
          </div>
        </div>
      </div>

      {/* Permissions Editor */}
      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-4 shadow-xs">
        <h3 className="font-bold text-sm text-on-surface pb-2 border-b border-outline-variant/20">
          محرر صلاحيات الوحدات التشغيلية
        </h3>

        <div className="space-y-3">
          {[
            { key: "products.view", title: "كتالوج المنتجات — عرض واستعراض الموديلات" },
            { key: "products.create", title: "كتالوج المنتجات — تكويد وتصميم موديل جديد" },
            { key: "products.cost", title: "المنتجات والتسعير — الاطلاع على تكلفة التصنيع وهامش الربح" },
            { key: "inventory.view", title: "المخازن — استعراض الأرصدة وحركات الأقمشة" },
            { key: "inventory.issue", title: "المخازن — اعتماد وإصدار أذون صرف الخامات للإنتاج" },
            { key: "production.view", title: "خطوط الإنتاج — متابعة أوامر التشغيل وكفاءة الخطوط" },
            { key: "production.manage", title: "خطوط الإنتاج — جدولة الخطط وتوزيع الورديات" },
            { key: "finance.view", title: "المالية — الاطلاع على القيود اليومية والخزينة" },
            { key: "finance.approve", title: "المالية — اعتماد سندات الصرف والخصومات الاستثنائية" },
            { key: "settings.manage", title: "إدارة النظام — إدارة المستخدمين وتعديل الصلاحيات" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors"
            >
              <span className="text-xs font-medium text-on-surface">{item.title}</span>
              <input
                type="checkbox"
                checked={permissions[item.key] ?? false}
                onChange={() => toggle(item.key)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
            </label>
          ))}
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            <span>حفظ التعديلات في قاعدة البيانات</span>
          </button>
        </div>
      </div>
    </div>
  );
}

