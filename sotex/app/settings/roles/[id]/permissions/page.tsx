"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { supabase, logAuditAction } from "@/lib/supabase";

export default function RolePermissionsEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast, currentUser, roleConfig } = useERP();
  const id = params?.id as RoleKey;
  const role = CORE_ROLES[id] || CORE_ROLES["OWNER_ADMIN"];
  const [saving, setSaving] = useState(false);

  const [permissions, setPermissions] = useState({
    viewDashboard: true,
    viewCostPrice: role.canViewCost,
    viewMargins: role.canViewMargins,
    approvePurchaseOrders: role.canApproveFinancial,
    editBOM: true,
    issueStock: true,
    manageUsers: role.canManageUsers,
    exportAuditLogs: role.canManageUsers,
  });

  const toggle = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "تعديل الصلاحيات الدقيقة للدور الوظيفي",
        entityType: "roles",
        entityId: id,
        entityName: role.nameAr,
        details: permissions,
        severity: "WARNING",
      });

      showToast("success", "تم حفظ وتحديث مصفوفة الصلاحيات في Supabase", `تم تطبيق التعديلات على دور: ${role.nameAr}`);
      setTimeout(() => {
        router.push(`/settings/roles/${id}`);
      }, 400);
    } catch (err: any) {
      showToast("error", "فشل الحفظ", err?.message || "خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-gutter space-y-space-md text-right max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">security</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              تعديل مصفوفة صلاحيات الدور: {role.nameAr}
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            التحكم الدقيق في الوصول للشاشات والعمليات والحقول المالية الحساسة
          </p>
        </div>

        <Link
          href={`/settings/roles/${id}`}
          className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface"
        >
          رجوع لملف الدور
        </Link>
      </div>

      <form onSubmit={handleSave} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-on-surface pb-2 border-b border-outline-variant/20">
            صلاحيات الشاشات والحقول الحساسة
          </h2>

          <div className="space-y-3">
            {[
              { key: "viewCostPrice", label: "رؤية تكلفة خامات الأقمشة والمنتجات (Cost Visibility)", desc: "إظهار سعر تكلفة المتر والقطعة في فواتير الشراء والكتالوج" },
              { key: "viewMargins", label: "رؤية هوامش الأرباح وصافي الدخل (Margin Visibility)", desc: "عرض نسب الربح الصافي في لوحة القيادة وتقارير المبيعات" },
              { key: "approvePurchaseOrders", label: "اعتماد أوامر الشراء والمدفوعات (Financial Approval)", desc: "منح صلاحية التوقيع والترحيل المالي للشيكات والتحويلات" },
              { key: "editBOM", label: "تعديل قوائم شجرة المواد (BOM Editor)", desc: "إضافة وتعديل مقننات استهلاك الأقمشة والقص للموديلات" },
              { key: "issueStock", label: "إصدار أذون صرف الخامات (Stock Issue)", desc: "صرف بالات الأقمشة والإكسسوارات لخطوط الخياطة والقص" },
              { key: "manageUsers", label: "إدارة المستخدمين والصلاحيات (User Admin)", desc: "إنشاء حسابات المستخدمين وتعيين الأدوار وكلمات المرور" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/30">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-on-surface block">{item.label}</span>
                  <span className="text-[11px] text-on-surface-variant">{item.desc}</span>
                </div>
                <Switch
                  checked={(permissions as any)[item.key]}
                  onCheckedChange={() => toggle(item.key as any)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>حفظ مصفوفة الصلاحيات</span>
          </button>
        </div>
      </form>
    </div>
  );
}

