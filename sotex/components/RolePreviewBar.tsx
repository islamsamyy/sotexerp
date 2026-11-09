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
      className="w-full bg-[#181C1E] text-[#F3F4F6] border-b border-[#C8B276]/25 px-3 sm:px-gutter py-1.5 sm:py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs z-30 shadow-xs"
    >
      <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#C8B276] p-1 border border-[#9E7A3F] flex items-center justify-center shrink-0 shadow-xs">
            <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#202528] text-[#C8B276] font-medium border border-[#C8B276]/30 shrink-0">
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            <span>الدور النشط:</span>
          </div>
          <span className="font-bold text-white text-xs sm:text-sm truncate">{roleConfig.nameAr}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => router.push(getRoleDefaultPath())}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C8B276]/15 text-[#C8B276] border border-[#C8B276]/40 hover:bg-[#C8B276]/25 font-semibold text-[10px] sm:text-[11px] transition-colors cursor-pointer"
          >
            <span>{roleConfig.defaultPath}</span>
            <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
          </button>

          <span
            className={`hidden xl:inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
              canViewCost
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                : "bg-rose-950/80 text-rose-300 border border-rose-700/50"
            }`}
          >
            {canViewCost ? "بيانات التكلفة: مرئية" : "التكلفة: محجوبة"}
          </span>
        </div>
      </div>

      {/* Horizontally Scrollable Role Switcher on Mobile, Flex Row on Desktop */}
      <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto no-scrollbar pb-0.5 md:pb-0">
        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden lg:inline text-[#A3ACB2] text-[11px] ml-1">تبديل الحساب:</span>
          {roleKeys.map((key) => {
            const role = CORE_ROLES[key];
            const isActive = activeRole === key;
            return (
              <button
                key={key}
                onClick={() => handleRoleSelect(key)}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
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

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleTheme}
            className="hidden sm:flex px-2 py-1 rounded-md bg-[#202528] hover:bg-[#2C3338] text-[#C8B276] border border-[#C8B276]/30 text-[11px] font-bold items-center gap-1 transition-colors cursor-pointer"
            title="تبديل المظهر (الوضع الداكن / الفاتح)"
          >
            <span className="material-symbols-outlined text-[14px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          <Link
            href="/login"
            className="px-2 py-1 rounded-md bg-[#202528] hover:bg-[#2C3338] text-[#F3F4F6] border border-[#363E44] text-[10px] sm:text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors"
          >
            <span className="material-symbols-outlined text-[13px] text-[#C8B276]">logout</span>
            <span>دخول</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
