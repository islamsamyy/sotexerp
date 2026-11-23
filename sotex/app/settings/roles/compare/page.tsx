"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface RoleSummary {
  key: RoleKey;
  nameAr: string;
  canViewCost: boolean;
  canViewMargins: boolean;
  canApproveFinancial: boolean;
  canManageUsers: boolean;
}

interface MatrixRow {
  id: string;
  module_name: string;
  owner_admin: boolean;
  production_manager: boolean;
  warehouse_manager: boolean;
  finance_sales_manager: boolean;
}

function getMatrixVal(row: MatrixRow, roleKey: RoleKey): boolean {
  if (roleKey === "OWNER_ADMIN") return row.owner_admin;
  if (roleKey === "PRODUCTION_MANAGER") return row.production_manager;
  if (roleKey === "WAREHOUSE_MANAGER") return row.warehouse_manager;
  return row.finance_sales_manager;
}

export default function RoleComparePage() {
  const roleKeys = Object.keys(CORE_ROLES) as RoleKey[];
  const [roleA, setRoleA] = useState<RoleKey>("OWNER_ADMIN");
  const [roleB, setRoleB] = useState<RoleKey>("PRODUCTION_MANAGER");
  const [rolesMap, setRolesMap] = useState<Record<RoleKey, RoleSummary>>(() => {
    const initial = {} as Record<RoleKey, RoleSummary>;
    for (const k of roleKeys) {
      initial[k] = {
        key: k,
        nameAr: CORE_ROLES[k].nameAr,
        canViewCost: CORE_ROLES[k].canViewCost,
        canViewMargins: CORE_ROLES[k].canViewMargins,
        canApproveFinancial: CORE_ROLES[k].canApproveFinancial,
        canManageUsers: CORE_ROLES[k].canManageUsers,
      };
    }
    return initial;
  });
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLiveRoles() {
      setIsLoading(true);
      try {
        const [rolesRes, matrixRes] = await Promise.all([
          supabase.from("roles").select("*").order("key"),
          supabase.from("role_permissions_matrix").select("*").order("sort_order", { ascending: true }),
        ]);
        if (rolesRes.data && rolesRes.data.length > 0) {
          setRolesMap((prev) => {
            const next = { ...prev };
            for (const r of rolesRes.data) {
              const rk = r.key as RoleKey;
              if (next[rk]) {
                next[rk] = {
                  key: rk,
                  nameAr: r.name_ar,
                  canViewCost: Boolean(r.can_view_cost),
                  canViewMargins: Boolean(r.can_view_margins),
                  canApproveFinancial: Boolean(r.can_approve_financial),
                  canManageUsers: Boolean(r.can_manage_users),
                };
              }
            }
            return next;
          });
        }
        if (matrixRes.data) {
          setMatrixRows(matrixRes.data as MatrixRow[]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadLiveRoles();
  }, []);

  const a = rolesMap[roleA];
  const b = rolesMap[roleB];

  const corePermissions = [
    { name: "الاطلاع على أسعار التكلفة للموديلات", valA: a.canViewCost, valB: b.canViewCost },
    { name: "الاطلاع على هوامش الربح والربحية", valA: a.canViewMargins, valB: b.canViewMargins },
    { name: "الاعتماد المالي وإقرار الخصومات", valA: a.canApproveFinancial, valB: b.canApproveFinancial },
    { name: "إدارة المستخدمين وتعديل الصلاحيات", valA: a.canManageUsers, valB: b.canManageUsers },
  ];

  const matrixPermissions = matrixRows.map((row) => ({
    name: row.module_name,
    valA: getMatrixVal(row, roleA),
    valB: getMatrixVal(row, roleB),
  }));

  const permissionsList = [...corePermissions, ...matrixPermissions];

  return (
    <div className="p-gutter space-y-space-md text-right max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">مقارنة الأدوار الوظيفية جنباً إلى جنب</h1>
          <p className="font-body-sm text-sm text-on-surface-variant">مقارنة مباشرة من قاعدة بيانات Supabase لكشف الفروقات في الصلاحيات وحدود الاعتماد</p>
        </div>
        <Link href="/settings/roles" className="text-xs text-primary font-bold hover:underline">
          العودة لدليل الأدوار
        </Link>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-2">
          <label className="text-xs font-bold text-on-surface block">الدور الأول للمقارنة:</label>
          <select
            value={roleA}
            onChange={(e) => setRoleA(e.target.value as RoleKey)}
            className="w-full p-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right font-bold focus:outline-none"
          >
            {roleKeys.map((k) => (
              <option key={k} value={k}>
                {rolesMap[k].nameAr}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-2">
          <label className="text-xs font-bold text-on-surface block">الدور الثاني للمقارنة:</label>
          <select
            value={roleB}
            onChange={(e) => setRoleB(e.target.value as RoleKey)}
            className="w-full p-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right font-bold focus:outline-none"
          >
            {roleKeys.map((k) => (
              <option key={k} value={k}>
                {rolesMap[k].nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            <span>جاري تحميل مصفوفة الصلاحيات للمقارنة...</span>
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3 w-1/2">الصلاحية أو الإجراء</th>
                <th className="p-3 text-center">{a.nameAr}</th>
                <th className="p-3 text-center">{b.nameAr}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {permissionsList.map((p, idx) => {
                const isDifferent = p.valA !== p.valB;

                return (
                  <tr
                    key={idx}
                    className={
                      isDifferent
                        ? "bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                        : "hover:bg-surface-container/20 transition-colors"
                    }
                  >
                    <td className="p-3 font-semibold text-on-surface flex items-center justify-between">
                      <span>{p.name}</span>
                      {isDifferent && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">
                          فارق في الصلاحية
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.valA ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {p.valA ? "ممنوحة" : "محجوبة"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.valB ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {p.valB ? "ممنوحة" : "محجوبة"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
