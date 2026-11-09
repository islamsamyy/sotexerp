"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";

export default function Header() {
  const router = useRouter();
  const {
    activeFacility,
    setSearchOpen,
    unreadNotificationsCount,
    notifications,
    markNotificationAsRead,
    pendingApprovalsCount,
    activeRole,
    setActiveRole,
    currentUser,
    roleConfig,
    canViewCost,
    openModal,
    theme,
    toggleTheme,
    showToast,
  } = useERP();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleKeys: RoleKey[] = [
    "OWNER_ADMIN",
    "PRODUCTION_MANAGER",
    "WAREHOUSE_MANAGER",
    "FINANCE_SALES_MANAGER",
  ];

  const handleRoleSwitch = (key: RoleKey) => {
    setActiveRole(key);
    const targetPath = CORE_ROLES[key].defaultPath;
    router.push(targetPath);
  };

  const handleLogout = () => {
    localStorage.removeItem("sotex_auth");
    showToast("info", "تم تسجيل الخروج", "تم إنهاء الجلسة والعودة لشاشة الدخول.");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 right-0 left-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/40 z-30 px-gutter flex items-center justify-between gap-space-md transition-colors duration-200">
      {/* Right side: Brand & Single Facility (El-Mahalla El-Kubra Central Complex) */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 rounded-lg bg-[#C8B276] border border-[#9E7A3F] p-1.5 shadow-sm flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
          title="سوتكس — المحلة الكبرى"
        >
          <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain brightness-0 invert" />
        </Link>

        {/* Exclusive Central Branch Badge: El-Mahalla El-Kubra */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#C8B276]/35 bg-surface-container-low text-right shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-[#C8B276]/15 border border-[#C8B276]/40 flex items-center justify-center shrink-0 text-[#C8B276]">
            <span className="material-symbols-outlined text-[18px]">factory</span>
          </div>
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-[10px] text-on-surface-variant leading-none">
                المقر الرئيسي والمصانع
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="المنشأة متصلة لحظياً" />
            </div>
            <span className="font-label-md text-xs text-on-surface font-extrabold leading-tight mt-0.5 truncate max-w-[200px]">
              {activeFacility.nameAr || "مجمع ومصانع سوتكس المركزي - المحلة الكبرى"}
            </span>
          </div>
        </div>

        {/* Roles Quick Pill Bar (Desktop) */}
        <div className="hidden 2xl:flex items-center gap-1 p-1 bg-surface-container rounded-xl border border-outline-variant/40">
          {roleKeys.map((key) => {
            const role = CORE_ROLES[key];
            const isSelected = activeRole === key;
            return (
              <button
                key={key}
                onClick={() => handleRoleSwitch(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#C8B276] text-[#181C1E] shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
                title={`التحويل إلى دور ${role.nameAr}`}
              >
                <span className="material-symbols-outlined text-[14px]">{role.icon}</span>
                <span>{role.nameAr.split(" ")[0]} {role.nameAr.split(" ")[1] || ""}</span>
              </button>
            );
          })}
        </div>

        {/* Cost Visibility Indicator */}
        <div className="hidden xl:flex items-center">
          <span
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
              canViewCost
                ? "bg-emerald-950/20 text-emerald-600 border-emerald-600/30 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50"
                : "bg-rose-950/20 text-rose-600 border-rose-600/30 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/50"
            }`}
            title={canViewCost ? "بيانات التكلفة وهوامش الربح مرئية لهذا الحساب" : "بيانات التكلفة وهوامش الأرباح محجوبة بحكم الدور"}
          >
            <span className="material-symbols-outlined text-[13px]">
              {canViewCost ? "visibility" : "visibility_off"}
            </span>
            <span>{canViewCost ? "التكلفة: مرئية" : "التكلفة: محجوبة"}</span>
          </span>
        </div>
      </div>

      {/* Center: Global Quick Search (Ctrl + K) */}
      <div className="flex-1 max-w-lg mx-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full h-10 px-space-md bg-surface-container-low border border-outline-variant/50 rounded-xl text-right font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover:border-[#C8B276]/60 flex items-center justify-between transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-space-sm truncate">
            <span className="material-symbols-outlined text-[#C8B276] text-[19px]">
              search
            </span>
            <span className="truncate">بحث في الموديلات، الخامات، الأوامر، الحسابات...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-surface-container-high border border-outline-variant/60 rounded-md text-[#C8B276] font-bold shrink-0">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Left side actions: Quick Create, Theme, Approvals, Notifications, User Menu */}
      <div className="flex items-center gap-2">
        {/* Quick Action Button */}
        <button
          onClick={() =>
            openModal({
              type: "new_work_order",
              title: "إنشاء وتشغيل أمر سريع",
              description: "إصدار أمر تصنيع وتشغيل سريع لخطوط مجمع المحلة الكبرى",
            })
          }
          className="h-9 px-3.5 bg-gradient-to-r from-[#C8B276] to-[#9E7A3F] text-[#181C1E] rounded-lg flex items-center gap-1.5 hover:brightness-110 transition-all shadow-sm shadow-[#C8B276]/20 font-label-md text-xs font-extrabold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-[#181C1E]">add_circle</span>
          <span className="hidden sm:inline">إنشاء سريع</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="h-9 px-2.5 rounded-lg border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container hover:border-[#C8B276]/50 text-on-surface flex items-center gap-1.5 transition-all cursor-pointer"
          title={theme === "dark" ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن الفاخر"}
        >
          <span className="material-symbols-outlined text-[18px] text-[#C8B276]">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span className="hidden lg:inline text-[11px] font-bold">
            {theme === "dark" ? "نهاري" : "داكن"}
          </span>
        </button>

        <div className="h-6 w-px bg-outline-variant/40 mx-0.5" />

        {/* Approvals Quick Link */}
        <Link
          href="/approvals"
          className="relative cursor-pointer p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-[#C8B276] flex items-center"
          title="مركز الموافقات والاعتمادات"
        >
          <span className="material-symbols-outlined text-[21px]">rule</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-1 left-1 min-w-[16px] h-4 px-1 bg-[#C8B276] text-[#181C1E] font-extrabold rounded-full flex items-center justify-center font-label-sm text-[10px]">
              {pendingApprovalsCount}
            </span>
          )}
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative cursor-pointer p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-[#C8B276] flex items-center"
            title="التنبيهات"
          >
            <span className="material-symbols-outlined text-[21px]">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 left-1 min-w-[16px] h-4 px-1 bg-error text-on-error font-bold rounded-full flex items-center justify-center font-label-sm text-[10px]">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/50 overflow-hidden z-50">
              <div className="p-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
                <span className="font-label-md font-bold text-on-surface">التنبيهات والإشعارات</span>
                <Link
                  href="/alerts"
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] text-[#C8B276] font-bold hover:underline"
                >
                  عرض الكل
                </Link>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/20">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markNotificationAsRead(item.id)}
                    className={`p-3 text-right hover:bg-surface-container transition-colors cursor-pointer ${
                      item.read ? "opacity-75" : "bg-[#C8B276]/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-sm text-xs font-bold text-on-surface">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                    </div>
                    <p className="text-body-sm text-[11px] text-on-surface-variant leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-outline-variant/40 mx-0.5" />

        {/* User Profile & Role Switcher Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-space-sm pl-space-xs py-1 rounded-lg hover:bg-surface-container cursor-pointer transition-colors text-right"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-[#C8B276]/60"
              src={currentUser.avatarUrl}
            />
            <div className="flex flex-col text-right">
              <span className="font-label-md text-xs text-on-surface font-bold leading-tight">
                {currentUser.nameAr}
              </span>
              <span className="font-label-sm text-[10px] text-[#C8B276] font-medium leading-none mt-0.5">
                {roleConfig.nameAr}
              </span>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">
              expand_more
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/50 p-2 z-50">
              <div className="p-3 border-b border-outline-variant/30 flex items-center gap-3 bg-surface-container-low rounded-lg mb-2">
                <img
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#C8B276]"
                  src={currentUser.avatarUrl}
                />
                <div className="flex flex-col text-right">
                  <span className="font-label-md font-bold text-on-surface text-sm">
                    {currentUser.nameAr}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono">{currentUser.email}</span>
                  <span className="text-[10px] font-bold text-[#C8B276] mt-0.5">{roleConfig.nameAr}</span>
                </div>
              </div>

              {/* Role Switcher Inside Menu */}
              <div className="px-2 py-1 text-[11px] font-bold text-on-surface-variant">
                تبديل الدور النشط:
              </div>
              <div className="space-y-1 mb-2">
                {roleKeys.map((key) => {
                  const role = CORE_ROLES[key];
                  const isSelected = activeRole === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        handleRoleSwitch(key);
                        setUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-right text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#C8B276] text-[#181C1E] font-extrabold"
                          : "hover:bg-surface-container text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">{role.icon}</span>
                        <span>{role.nameAr}</span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-outline-variant/30 pt-1 space-y-1">
                <Link
                  href="/settings/users"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container text-xs text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#C8B276]">manage_accounts</span>
                  <span>إدارة المستخدمين والأدوار</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-error/10 text-xs text-error font-semibold cursor-pointer text-right"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>تسجيل الخروج والعودة لشاشة الدخول</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
