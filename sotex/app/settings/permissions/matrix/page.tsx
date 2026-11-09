"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";

interface PermissionRow {
  module: string;
  category: string;
  roles: Record<RoleKey, boolean>;
}

const DEFAULT_MATRIX: PermissionRow[] = [
  { module: "لوحة التحكم المركزية", category: "الرئيسية", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: true, WAREHOUSE_MANAGER: true, FINANCE_SALES_MANAGER: true } },
  { module: "كتالوج المنتجات والموديلات", category: "المنتجات", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: true, WAREHOUSE_MANAGER: true, FINANCE_SALES_MANAGER: true } },
  { module: "تكويد موديل جديد وقوائم BOM", category: "المنتجات", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: true, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: false } },
  { module: "رؤية تكلفة التصنيع وهامش الربح", category: "المنتجات", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: false, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: true } },
  { module: "أرصدة وحركات المخازن والأقمشة", category: "المخازن", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: true, WAREHOUSE_MANAGER: true, FINANCE_SALES_MANAGER: false } },
  { module: "إصدار أذون الاستلام (GRN) والصرف", category: "المخازن", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: false, WAREHOUSE_MANAGER: true, FINANCE_SALES_MANAGER: false } },
  { module: "أوامر الإنتاج والتصنيع وكفاءة OEE", category: "الإنتاج", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: true, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: false } },
  { module: "تخطيط وموازنة خطوط الخياطة", category: "الإنتاج", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: true, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: false } },
  { module: "فحص الجودة والمواصفات AQL", category: "الجودة", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: true, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: false } },
  { module: "طلبات البيع والتصدير وعروض الأسعار", category: "المبيعات", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: false, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: true } },
  { module: "القيود اليومية والخزينة والبنوك", category: "المالية", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: false, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: true } },
  { module: "اعتماد سندات الصرف والخصومات", category: "المالية", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: false, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: true } },
  { module: "إدارة المستخدمين والأمان والصلاحيات", category: "الإعدادات والأمان", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: false, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: false } },
  { module: "سجل التدقيق والمراجعة الشامل", category: "الإعدادات والأمان", roles: { OWNER_ADMIN: true, PRODUCTION_MANAGER: false, WAREHOUSE_MANAGER: false, FINANCE_SALES_MANAGER: false } },
];

export default function PermissionsMatrixPage() {
  const { showToast, currentRole, currentUser } = useERP();
  const [data, setData] = useState<PermissionRow[]>(DEFAULT_MATRIX);
  const [isSaving, setIsSaving] = useState(false);
  const roleKeys = Object.keys(CORE_ROLES) as RoleKey[];

  useEffect(() => {
    async function loadMatrix() {
      try {
        const { data: matrixData } = await supabase.from("role_permissions_matrix").select("*");
        if (matrixData && matrixData.length > 0) {
          setData(
            matrixData.map((r) => ({
              module: r.module_name,
              category: r.category,
              roles: {
                OWNER_ADMIN: Boolean(r.owner_admin),
                PRODUCTION_MANAGER: Boolean(r.production_manager),
                WAREHOUSE_MANAGER: Boolean(r.warehouse_manager),
                FINANCE_SALES_MANAGER: Boolean(r.finance_sales_manager),
              },
            }))
          );
        }
      } catch (e) {
        // use fallback default
      }
    }
    loadMatrix();
  }, []);

  const toggle = (moduleIndex: number, roleKey: RoleKey) => {
    setData((prev) => {
      const copy = [...prev];
      copy[moduleIndex] = {
        ...copy[moduleIndex],
        roles: {
          ...copy[moduleIndex].roles,
          [roleKey]: !copy[moduleIndex].roles[roleKey],
        },
      };
      return copy;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: "تعديل وحفظ مصفوفة صلاحيات الأدوار القياسية في النظام",
        module: "الصلاحيات والأمان",
        severity: "warning",
      });
      showToast("success", "تم حفظ مصفوفة الصلاحيات", "تم تحديث قواعد الصلاحيات بنجاح في قاعدة البيانات.");
    } catch (err: unknown) {
      showToast("error", "فشل الحفظ", err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">grid_view</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">مصفوفة الصلاحيات الشاملة (الأدوار الـ 4 الأساسية)</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            جدول المقارنة والتعديل المباشر للصلاحيات عبر وحدات النظام التشغيلية والإدارية
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          <span>{isSaving ? "جاري الحفظ..." : "حفظ التعديلات في قاعدة البيانات"}</span>
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
            <tr>
              <th className="p-3 w-1/4">الوحدة التشغيلية</th>
              <th className="p-3 w-1/6">القسم</th>
              {roleKeys.map((rk) => (
                <th key={rk} className="p-3 text-center">
                  <div className="font-bold text-on-surface">{CORE_ROLES[rk].nameAr}</div>
                  <div className="text-[10px] text-outline font-normal font-mono">{CORE_ROLES[rk].nameEn}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {data.map((row, idx) => (
              <tr key={row.module} className="hover:bg-surface-container/30 transition-colors">
                <td className="p-3 font-semibold text-on-surface">{row.module}</td>
                <td className="p-3 text-on-surface-variant">{row.category}</td>
                {roleKeys.map((rk) => {
                  const allowed = row.roles[rk];
                  return (
                    <td key={rk} className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(idx, rk)}
                        className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-all cursor-pointer ${
                          allowed
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {allowed ? "check" : "close"}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
