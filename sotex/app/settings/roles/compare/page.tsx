"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";

export default function RoleComparePage() {
  const roleKeys = Object.keys(CORE_ROLES) as RoleKey[];
  const [roleA, setRoleA] = useState<RoleKey>("OWNER_ADMIN");
  const [roleB, setRoleB] = useState<RoleKey>("PRODUCTION_MANAGER");

  const a = CORE_ROLES[roleA];
  const b = CORE_ROLES[roleB];

  const permissionsList = [
    { name: "الاطلاع على أسعار التكلفة للموديلات", valA: a.canViewCost, valB: b.canViewCost },
    { name: "الاطلاع على هوامش الربح والربحية", valA: a.canViewMargins, valB: b.canViewMargins },
    { name: "الاعتماد المالي وإقرار الخصومات", valA: a.canApproveFinancial, valB: b.canApproveFinancial },
    { name: "إدارة المستخدمين وتعديل الصلاحيات", valA: a.canManageUsers, valB: b.canManageUsers },
    { name: "إدارة خطوط الإنتاج والتشغيل", valA: true, valB: roleB === "PRODUCTION_MANAGER" || roleB === "OWNER_ADMIN" },
    { name: "إصدار أذون الاستلام والصرف بالمخازن", valA: true, valB: roleB === "WAREHOUSE_MANAGER" || roleB === "OWNER_ADMIN" },
    { name: "إصدار القيود اليومية والخزينة", valA: true, valB: roleB === "FINANCE_SALES_MANAGER" || roleB === "OWNER_ADMIN" },
  ];

  return (
    <div className="p-gutter space-y-space-md text-right max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">مقارنة الأدوار الوظيفية جنباً إلى جنب</h1>
          <p className="font-body-sm text-sm text-on-surface-variant">مقارنة سريعة لكشف الفروقات في الصلاحيات وحدود الاعتماد</p>
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
            {roleKeys.map(k => <option key={k} value={k}>{CORE_ROLES[k].nameAr}</option>)}
          </select>
        </div>

        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-2">
          <label className="text-xs font-bold text-on-surface block">الدور الثاني للمقارنة:</label>
          <select
            value={roleB}
            onChange={(e) => setRoleB(e.target.value as RoleKey)}
            className="w-full p-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right font-bold focus:outline-none"
          >
            {roleKeys.map(k => <option key={k} value={k}>{CORE_ROLES[k].nameAr}</option>)}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
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
                <tr key={idx} className={isDifferent ? "bg-amber-500/5 hover:bg-amber-500/10 transition-colors" : "hover:bg-surface-container/20 transition-colors"}>
                  <td className="p-3 font-semibold text-on-surface flex items-center justify-between">
                    <span>{p.name}</span>
                    {isDifferent && <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">فارق في الصلاحية</span>}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.valA ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {p.valA ? "ممنوحة" : "محجوبة"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.valB ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {p.valB ? "ممنوحة" : "محجوبة"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

