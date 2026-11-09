"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";

export default function RolePreviewBar() {
  const router = useRouter();
  const { activeRole, setActiveRole, roleConfig, canViewCost, getRoleDefaultPath, theme, toggleTheme } = useERP();

  const roleKeys: RoleKey[] = [
    "OWNER_ADMIN",
    "PRODUCTION_MANAGER",
    "WAREHOUSE_MANAGER",
    "FINANCE_SALES_MANAGER",
  ];

  const handleRoleSelect = (key: RoleKey) => {
    setActiveRole(key);
    const targetPath = CORE_ROLES[key].defaultPath;
    router.push(targetPath);
  };

  return (
    <aside
      aria-label="شريط معاينة الدور"
      className="w-full bg-[#181C1E] text-[#F3F4F6] border-b border-[#C8B276]/25 px-gutter py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-30 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-[#C8B276] p-1 border border-[#9E7A3F] flex items-center justify-center shrink-0 shadow-xs">
          <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain brightness-0 invert" />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#202528] text-[#C8B276] font-medium border border-[#C8B276]/30">
          <span className="material-symbols-outlined text-[15px]">visibility</span>
          <span>الحساب والدور النشط:</span>
        </div>
        <span className="font-bold text-white text-sm">{roleConfig.nameAr}</span>
        <span className="hidden md:inline text-[#A3ACB2]">({roleConfig.categoryAr})</span>

        <button
          onClick={() => router.push(getRoleDefaultPath())}
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C8B276]/15 text-[#C8B276] border border-[#C8B276]/40 hover:bg-[#C8B276]/25 font-semibold text-[11px] transition-colors cursor-pointer"
        >
          <span>اللوحة: {roleConfig.defaultPath}</span>
          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
        </button>

        <div className="hidden lg:flex items-center gap-2 mr-1">
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
              canViewCost
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                : "bg-rose-950/80 text-rose-300 border border-rose-700/50"
            }`}
          >
            {canViewCost ? "بيانات التكلفة: مرئية" : "بيانات التكلفة: محجوبة بحكم الدور"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[#A3ACB2] text-[11px] ml-1">تبديل الحساب:</span>
          {roleKeys.map((key) => {
            const role = CORE_ROLES[key];
            const isActive = activeRole === key;
            return (
              <button
                key={key}
                onClick={() => handleRoleSelect(key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#C8B276] text-[#181C1E] font-extrabold shadow-sm ring-1 ring-[#C8B276]"
                    : "bg-[#202528] text-[#D1D5DB] hover:bg-[#2C3338] hover:text-white border border-[#363E44]"
                }`}
                title={`التحويل إلى ${role.nameAr} والتوجه إلى ${role.defaultPath}`}
              >
                {role.nameAr.split(" ")[0]} {role.nameAr.split(" ")[1] || ""}
              </button>
            );
          })}
        </div>

        <button
          onClick={toggleTheme}
          className="px-2.5 py-1 rounded-md bg-[#202528] hover:bg-[#2C3338] text-[#C8B276] border border-[#C8B276]/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="تبديل المظهر (الوضع الداكن / الفاتح)"
        >
          <span className="material-symbols-outlined text-[14px]">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span className="hidden sm:inline">{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
        </button>

        <Link
          href="/login"
          className="px-2.5 py-1 rounded-md bg-[#202528] hover:bg-[#2C3338] text-[#F3F4F6] border border-[#363E44] text-[11px] font-bold flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px] text-[#C8B276]">logout</span>
          <span>شاشة الدخول</span>
        </Link>
      </div>
    </aside>
  );
}
