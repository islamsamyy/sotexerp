"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

interface MatrixPermissionRow {
  id: string;
  module_name: string;
  category: string;
  owner_admin: boolean;
  production_manager: boolean;
  warehouse_manager: boolean;
  finance_sales_manager: boolean;
  sort_order: number;
}

const ROLE_COL_MAP: Record<RoleKey, keyof Pick<MatrixPermissionRow, "owner_admin" | "production_manager" | "warehouse_manager" | "finance_sales_manager">> = {
  OWNER_ADMIN: "owner_admin",
  PRODUCTION_MANAGER: "production_manager",
  WAREHOUSE_MANAGER: "warehouse_manager",
  FINANCE_SALES_MANAGER: "finance_sales_manager",
};

export default function RoleDetailPage() {
  const params = useParams();
  const { showToast, currentUser, roleConfig } = useERP();
  const roleId = (params?.id as RoleKey) || "OWNER_ADMIN";
  const role = CORE_ROLES[roleId] || CORE_ROLES["OWNER_ADMIN"];
  const roleCol = ROLE_COL_MAP[roleId] || "owner_admin";

  const [rows, setRows] = useState<MatrixPermissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMatrix = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("role_permissions_matrix")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      if (data) setRows(data as MatrixPermissionRow[]);
    } catch (err: unknown) {
      showToast("error", "تعذر تحميل صلاحيات الدور", err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const toggle = (id: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [roleCol]: !row[roleCol] } : row))
    );
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const updates = rows.map((row) =>
        supabase
          .from("role_permissions_matrix")
          .update({ [roleCol]: row[roleCol] })
          .eq("id", row.id)
      );
      const results = await Promise.all(updates);
      const firstErr = results.find((r) => r.error)?.error;
      if (firstErr) throw firstErr;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "تعديل وحفظ مصفوفة صلاحيات الدور الوظيفي",
        entityType: "roles",
        entityId: roleId,
        entityName: role.nameAr,
        details: Object.fromEntries(rows.map((r) => [r.id, r[roleCol]])),
        severity: "WARNING",
      });

      showToast("success", "تم حفظ صلاحيات الدور في Supabase", `تم تحديث مصفوفة الصلاحيات لدور: ${role.nameAr}`);
    } catch (err: unknown) {
      showToast("error", "فشل الحفظ", err instanceof Error ? err.message : "خطأ أثناء الحفظ");
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
          محرر صلاحيات الوحدات التشغيلية (مباشر من Supabase)
        </h3>

        {isLoading ? (
          <div className="p-6 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            <span>جاري تحميل الصلاحيات من قاعدة البيانات...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((item) => (
              <label
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-on-surface">{item.module_name}</span>
                  <span className="text-[10px] text-on-surface-variant">{item.category}</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(item[roleCol])}
                  onChange={() => toggle(item.id)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
              </label>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={handleSavePermissions}
            disabled={saving || isLoading}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
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
