"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { FACILITIES, CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export default function Header({
  onOpenMobileMenu,
  sidebarCollapsed = false,
  onToggleSidebarCollapse,
}: HeaderProps) {
  const router = useRouter();
  const {
    activeFacility,
    setActiveFacility,
    setSearchOpen,
    unreadNotificationsCount,
    notifications,
    markNotificationAsRead,
    pendingApprovalsCount,
    activeRole,
    setActiveRole,
    currentUser,
    roleConfig,
    openModal,
    theme,
    toggleTheme,
  } = useERP();

  const [facilityOpen, setFacilityOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const facilityRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (facilityRef.current && !facilityRef.current.contains(e.target as Node)) {
        setFacilityOpen(false);
      }
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

  return (
    <header className="sticky top-0 right-0 left-0 h-14 sm:h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/40 z-30 px-3 sm:px-gutter flex items-center justify-between gap-2 sm:gap-space-md transition-colors duration-200">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile & Tablet Hamburger Drawer Trigger */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="فتح القائمة الجانبية"
            className="lg:hidden w-9 h-9 rounded-lg border border-[#C8B276]/40 bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-[#C8B276] shrink-0 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
        )}

        {/* Desktop Sidebar Collapse Button */}
        {onToggleSidebarCollapse && (
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            title={sidebarCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية لعرض أوسع"}
            className="hidden lg:flex w-9 h-9 rounded-lg border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container hover:border-[#C8B276]/50 items-center justify-center text-on-surface-variant hover:text-[#C8B276] shrink-0 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">
              {sidebarCollapsed ? "menu_open" : "dock_to_right"}
            </span>
          </button>
        )}

        {/* Brand Square Gold Logo Emblem */}
        <Link
          href="/"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#C8B276] border border-[#9E7A3F] p-1.5 shadow-sm flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
          title="SOTEX Garment ERP"
        >
          <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain brightness-0 invert" />
        </Link>

        {/* Facility Switcher */}
        <div className="relative min-w-0" ref={facilityRef}>
          <button
            onClick={() => setFacilityOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors text-right max-w-[155px] sm:max-w-[230px]"
          >
            <span className="material-symbols-outlined text-[#C8B276] text-[17px] sm:text-[18px] shrink-0">
              corporate_fare
            </span>
            <div className="flex flex-col min-w-0">
              <span className="hidden sm:block font-label-sm text-[10px] text-on-surface-variant leading-none">
                المنشأة الحالية
              </span>
              <span className="font-label-md text-[11px] sm:text-xs text-on-surface font-bold leading-tight truncate">
                {activeFacility.nameAr}
              </span>
            </div>
            <span className="material-symbols-outlined text-outline text-[15px] shrink-0">
              unfold_more
            </span>
          </button>

          {facilityOpen && (
            <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/50 p-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#C8B276] border-b border-outline-variant/30 mb-1">
                اختر الفرع أو المنشأة التشغيلية
              </div>
              {FACILITIES.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => {
                    setActiveFacility(fac);
                    setFacilityOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-right text-xs transition-colors cursor-pointer ${
                    activeFacility.id === fac.id
                      ? "bg-[#C8B276] text-[#181C1E] font-bold"
                      : "hover:bg-surface-container text-on-surface"
                  }`}
                >
                  <span className="truncate">{fac.nameAr}</span>
                  {activeFacility.id === fac.id && (
                    <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Quick Search (Ctrl + K) — Adaptive on Mobile vs Desktop */}
      <div className="flex-1 max-w-xl hidden md:block">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full h-10 px-3.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-right font-body-sm text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover:border-[#C8B276]/60 flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#C8B276] text-[20px] shrink-0">
              search
            </span>
            <span className="truncate">بحث سريع في الأصناف، الأوامر، الحسابات، الصلاحيات...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-surface-container-high border border-outline-variant/60 rounded-md text-[#C8B276] font-bold shrink-0 mr-2">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search Icon Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden w-9 h-9 rounded-lg border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-[#C8B276] cursor-pointer"
          title="بحث سريع (Ctrl + K)"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>

        {/* Quick Create Action Button */}
        <button
          onClick={() =>
            openModal({
              type: "new_work_order",
              title: "إنشاء وتشغيل أمر سريع",
              description: "إصدار أمر تصنيع وتشغيل سريع لخطوط المصنع",
            })
          }
          className="h-9 px-2.5 sm:px-3.5 bg-gradient-to-r from-[#C8B276] to-[#9E7A3F] text-[#181C1E] rounded-lg flex items-center gap-1.5 hover:brightness-110 transition-all shadow-sm shadow-[#C8B276]/20 font-label-md text-xs font-extrabold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-[#181C1E]">add_circle</span>
          <span className="hidden sm:inline">إنشاء سريع</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="h-9 px-2 sm:px-2.5 rounded-lg border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container hover:border-[#C8B276]/50 text-on-surface flex items-center gap-1.5 transition-all cursor-pointer"
          title={theme === "dark" ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن الفاخر"}
        >
          <span className="material-symbols-outlined text-[19px] text-[#C8B276]">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span className="hidden xl:inline text-[11px] font-bold">
            {theme === "dark" ? "نهاري" : "داكن"}
          </span>
        </button>

        <div className="hidden sm:block h-6 w-px bg-outline-variant/40 mx-0.5" />

        {/* Approvals Quick Link */}
        <Link
          href="/approvals"
          className="relative cursor-pointer p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-[#C8B276] flex items-center"
          title="مركز الموافقات والاعتمادات"
        >
          <span className="material-symbols-outlined text-[21px] sm:text-[22px]">rule</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-0.5 left-0.5 min-w-[16px] h-4 px-1 bg-[#C8B276] text-[#181C1E] font-extrabold rounded-full flex items-center justify-center font-label-sm text-[10px]">
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
            <span className="material-symbols-outlined text-[21px] sm:text-[22px]">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-0.5 left-0.5 min-w-[16px] h-4 px-1 bg-error text-on-error font-bold rounded-full flex items-center justify-center font-label-sm text-[10px]">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute left-0 mt-2 w-80 max-w-[92vw] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/50 overflow-hidden z-50">
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

        <div className="hidden sm:block h-6 w-px bg-outline-variant/40 mx-0.5" />

        {/* User Profile & Role Switcher Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-1 py-1 rounded-lg hover:bg-surface-container cursor-pointer transition-colors text-right"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-[#C8B276]/60 shrink-0"
              src={currentUser.avatarUrl}
            />
            <div className="hidden sm:flex flex-col text-right max-w-[130px]">
              <span className="font-label-md text-xs text-on-surface font-bold leading-tight truncate">
                {currentUser.nameAr}
              </span>
              <span className="font-label-sm text-[10px] text-[#C8B276] font-medium leading-none mt-0.5 truncate">
                {roleConfig.nameAr}
              </span>
            </div>
            <span className="hidden sm:inline material-symbols-outlined text-outline text-[16px]">
              expand_more
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 max-w-[92vw] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/50 p-2 z-50">
              <div className="p-3 border-b border-outline-variant/30 flex items-center gap-3 bg-surface-container-low rounded-lg mb-2">
                <img
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#C8B276]"
                  src={currentUser.avatarUrl}
                />
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-label-md font-bold text-on-surface text-sm truncate">
                    {currentUser.nameAr}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono truncate">{currentUser.email}</span>
                  <span className="text-[10px] font-bold text-[#C8B276] mt-0.5 truncate">{roleConfig.nameAr}</span>
                </div>
              </div>

              <div className="px-2 py-1 text-[11px] font-bold text-on-surface-variant">
                تبديل الدور النشط (الأدوار الـ 4 الأساسية):
              </div>
              <div className="space-y-1 mb-2">
                {roleKeys.map((key) => {
                  const role = CORE_ROLES[key];
                  const isSelected = activeRole === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveRole(key);
                        setUserMenuOpen(false);
                        router.push(role.defaultPath);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-right text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#C8B276] text-[#181C1E] font-extrabold"
                          : "hover:bg-surface-container text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[16px] shrink-0">{role.icon}</span>
                        <span className="truncate">{role.nameAr}</span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
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
                <Link
                  href="/login"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container text-xs text-error font-semibold"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>تسجيل الخروج</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
