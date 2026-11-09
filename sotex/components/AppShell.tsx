"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RolePreviewBar from "@/components/RolePreviewBar";
import { useERP } from "@/lib/erp-context";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "لوحة التحكم التنفيذية",
  alerts: "التنبيهات العاجلة",
  tasks: "المهام التشغيلية",
  approvals: "مركز الموافقات الإدارية",
  calendar: "تقويم الورديات والتسليم",
  reports: "التقارير والتحليلات",
  products: "المنتجات والتصاميم",
  new: "إضافة وتكويد جديد",
  skus: "الألوان والمقاسات (SKUs)",
  pricing: "مصفوفة الأسعار والتكلفة",
  inventory: "المخازن والمستودعات",
  fabrics: "أرصدة الأقمشة والإكسسوارات",
  transactions: "إذون الصرف والإضافة (GRN)",
  transfers: "تحويلات الفروع والمخازن",
  "stock-count": "الجرد الدوري والباركود",
  production: "خطوط الإنتاج والتشغيل",
  oee: "كفاءة المعدات والخطوط OEE",
  planning: "تخطيط وموازنة الخطوط",
  bom: "قوائم شجرة المواد (BOM)",
  stages: "محطات ومراحل التشغيل",
  sales: "المبيعات والتصدير",
  quotations: "عروض الأسعار والمناقصات",
  customers: "حسابات العملاء والتوكيلات",
  quality: "مراقبة وضمان الجودة",
  inline: "الفحص المرحلي للخطوط In-Line",
  defects: "سجل العيوب ومخطط باريتو",
  inspections: "تقارير الفحص النهائي",
  procurement: "المشتريات والتوريد",
  invoices: "الفواتير والمطابقة الثلاثية",
  suppliers: "سجل الموردين المعتمدين",
  finance: "الإدارة المالية والتكاليف",
  accounts: "شجرة الحسابات (COA)",
  ledgers: "أعمار الديون والمديونيات",
  treasury: "الخزينة والشيكات والبنوك",
  pnl: "قائمة الأرباح والخسائر (P&L)",
  hr: "الموارد البشرية والورش",
  employees: "سجل الفنيين والعمالة",
  attendance: "حضور وانصراف الورديات",
  payroll: "مسير الأجور وحوافز القطعة",
  settings: "الأمان والصلاحيات (RBAC)",
  users: "إدارة المستخدمين",
  roles: "الأدوار الوظيفية",
  compare: "مقارنة الأدوار",
  permissions: "الصلاحيات",
  matrix: "مصفوفة الصلاحيات",
  "data-scope": "نطاق الوصول للبيانات",
  workflows: "مسارات الاعتماد",
  limits: "حدود الاعتماد المالي",
  delegation: "تفويض الصلاحيات",
  "audit-log": "سجل التدقيق الشامل",
  security: "الأمان والجلسات",
  sessions: "الجلسات النشطة",
  edit: "تعديل البيانات",
  activity: "سجل النشاط",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeFacility, roleConfig, openModal } = useERP();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Fullscreen chrome-free mode for Login page
  if (pathname === "/login") {
    return <main className="min-h-screen w-full bg-[#202528]">{children}</main>;
  }

  const segments = (pathname || "/").split("/").filter(Boolean);

  const mobileNavItems = [
    { label: "الرئيسية", href: "/dashboard", icon: "dashboard", match: (p: string) => p === "/" || p === "/dashboard" },
    { label: "الإنتاج", href: "/production", icon: "precision_manufacturing", match: (p: string) => p.startsWith("/production") },
    { label: "المخازن", href: "/inventory", icon: "warehouse", match: (p: string) => p.startsWith("/inventory") },
    { label: "المالية", href: "/finance", icon: "account_balance", match: (p: string) => p.startsWith("/finance") },
  ];

  return (
    <>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={`pr-0 ${
          sidebarCollapsed ? "lg:pr-20" : "lg:pr-72"
        } min-h-screen flex flex-col bg-surface transition-all duration-300 ease-in-out`}
      >
        <RolePreviewBar />
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        {/* Contextual Breadcrumb & Live Factory Status Sub-Bar */}
        <div className="bg-surface-container-low/80 border-b border-outline-variant/30 px-3 sm:px-gutter py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Breadcrumbs */}
          <nav aria-label="مسار التنقل" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-on-surface-variant hover:text-[#C8B276] transition-colors font-medium shrink-0"
            >
              <span className="material-symbols-outlined text-[15px] text-[#C8B276]">home</span>
              <span>الرئيسية</span>
            </Link>
            {segments.map((seg, idx) => {
              const href = "/" + segments.slice(0, idx + 1).join("/");
              const label = ROUTE_LABELS[seg] || decodeURIComponent(seg);
              const isLast = idx === segments.length - 1;
              return (
                <React.Fragment key={href}>
                  <span className="text-outline text-[11px]">/</span>
                  {isLast ? (
                    <span className="font-bold text-[#C8B276] whitespace-nowrap">{label}</span>
                  ) : (
                    <Link
                      href={href}
                      className="text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
                    >
                      {label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          {/* Live Operational Status & Quick Shortcuts */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-on-surface-variant">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/40">
              <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse" />
              <span>الوردية الصباحية • {activeFacility.city}</span>
            </div>
            <span className="text-outline">|</span>
            <button
              type="button"
              onClick={() =>
                openModal({
                  type: "export_report",
                  title: "تصدير ملخص الشاشة الحالية",
                  description: `استخراج تقرير فوري بصيغة PDF / Excel لدور ${roleConfig.nameAr}`,
                })
              }
              className="flex items-center gap-1 text-[#C8B276] hover:underline font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>تصدير سريع</span>
            </button>
          </div>
        </div>

        {/* Main Page Content Container */}
        <main className="flex-1 pb-20 lg:pb-12 w-full max-w-[100vw] overflow-x-hidden">
          {children}
        </main>

        {/* Mobile & Tablet Fixed Bottom Navigation Bar */}
        <nav
          aria-label="شريط التنقل السفلي للموبايل"
          className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-[#181C1E]/95 backdrop-blur-md border-t border-[#C8B276]/30 z-30 px-2 flex items-center justify-around shadow-2xl"
        >
          {mobileNavItems.map((item) => {
            const active = item.match(pathname || "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  active
                    ? "text-[#C8B276] font-extrabold scale-105"
                    : "text-[#A3ACB2] hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {active && <span className="w-4 h-0.5 rounded-full bg-[#C8B276] mt-0.5" />}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              mobileMenuOpen ? "text-[#C8B276] font-extrabold" : "text-[#A3ACB2] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[21px]">widgets</span>
            <span className="text-[10px] mt-0.5">كل الأقسام</span>
          </button>
        </nav>
      </div>
    </>
  );
}
