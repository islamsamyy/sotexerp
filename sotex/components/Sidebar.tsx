"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";

interface NavItem {
  name: string;
  href: string;
  badge?: number | string;
  badgeType?: "error" | "secondary" | "info";
  costRestricted?: boolean;
}

interface NavSection {
  title: string;
  icon: string;
  prefix: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { roleConfig, pendingApprovalsCount, unreadNotificationsCount, currentUser, showToast } = useERP();

  const handleLogout = () => {
    localStorage.removeItem("sotex_auth");
    showToast("info", "تم تسجيل الخروج", "تم إنهاء الجلسة والعودة لشاشة الدخول.");
    router.push("/login");
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    main: true,
    products: true,
    inventory: true,
    production: true,
    sales: true,
    quality: true,
    procurement: true,
    finance: true,
    settings: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isCurrent = (path: string) => {
    if (path === "/" && (pathname === "/" || pathname === "/dashboard")) return true;
    if (path !== "/" && (pathname === path || pathname?.startsWith(path + "/"))) return true;
    return false;
  };

  const sections: { key: string; section: NavSection }[] = [
    {
      key: "main",
      section: {
        title: "الرئيسية والتشغيل",
        icon: "dashboard",
        prefix: "/",
        items: [
          { name: "لوحة التحكم المركزية", href: "/" },
          { name: "التنبيهات العاجلة", href: "/alerts", badge: unreadNotificationsCount, badgeType: "error" },
          { name: "المهام التشغيلية", href: "/tasks" },
          { name: "الموافقات الإدارية", href: "/approvals", badge: pendingApprovalsCount, badgeType: "secondary" },
          { name: "تقويم الوردية والتسليم", href: "/calendar" },
          { name: "مركز التقارير والتحليلات", href: "/reports" },
        ],
      },
    },
    {
      key: "products",
      section: {
        title: "المنتجات والتصاميم",
        icon: "checkroom",
        prefix: "/products",
        items: [
          { name: "كتالوج المنتجات", href: "/products" },
          { name: "تكويد موديل جديد", href: "/products/new" },
          { name: "الألوان والمقاسات (SKUs)", href: "/products/skus" },
          { name: "مصفوفة أسعار البيع والتكلفة", href: "/products/pricing" },
        ],
      },
    },
    {
      key: "inventory",
      section: {
        title: "المخازن والمستودعات",
        icon: "warehouse",
        prefix: "/inventory",
        items: [
          { name: "أرصدة وحركات المخازن", href: "/inventory" },
          { name: "أرصدة الأقمشة والإكسسوارات", href: "/inventory/fabrics" },
          { name: "إذون الصرف والإضافة (GRN)", href: "/inventory/transactions" },
          { name: "تحويلات الفروع والمخازن", href: "/inventory/transfers" },
          { name: "الجرد الدوري والباركود", href: "/inventory/stock-count" },
        ],
      },
    },
    {
      key: "production",
      section: {
        title: "خطوط الإنتاج والتشغيل",
        icon: "precision_manufacturing",
        prefix: "/production",
        items: [
          { name: "أوامر الإنتاج والتصنيع", href: "/production" },
          { name: "لوحة كفاءة الخطوط OEE", href: "/production/oee" },
          { name: "تخطيط وموازنة الخطوط", href: "/production/planning" },
          { name: "قوائم شجرة المواد (BOM)", href: "/production/bom" },
          { name: "محطات ومراحل التشغيل", href: "/production/stages" },
        ],
      },
    },
    {
      key: "sales",
      section: {
        title: "المبيعات والتصدير",
        icon: "point_of_sale",
        prefix: "/sales",
        items: [
          { name: "طلبات البيع والتصدير", href: "/sales" },
          { name: "عروض الأسعار والتوكيلات", href: "/sales/quotations" },
          { name: "حسابات العملاء والتوكيلات", href: "/sales/customers" },
        ],
      },
    },
    {
      key: "quality",
      section: {
        title: "مراقبة وضمان الجودة",
        icon: "verified",
        prefix: "/quality",
        items: [
          { name: "لوحة مؤشرات الجودة AQL", href: "/quality" },
          { name: "فحص الخطوط المرحلي In-Line", href: "/quality/inline" },
          { name: "سجل العيوب ومخطط باريتو", href: "/quality/defects" },
          { name: "تقارير الفحص النهائي", href: "/quality/inspections" },
        ],
      },
    },
    {
      key: "procurement",
      section: {
        title: "المشتريات والتوريد",
        icon: "shopping_cart",
        prefix: "/procurement",
        items: [
          { name: "أوامر الشراء والتوريد", href: "/procurement" },
          { name: "مناقصات وعروض الموردين RFQ", href: "/procurement/quotations" },
          { name: "الفواتير والمطابقة الثلاثية", href: "/procurement/invoices" },
          { name: "سجل الموردين المعتمدين", href: "/procurement/suppliers" },
        ],
      },
    },
    {
      key: "finance",
      section: {
        title: "الإدارة المالية والتكاليف",
        icon: "account_balance",
        prefix: "/finance",
        items: [
          { name: "المركز المالي والقيود", href: "/finance" },
          { name: "شجرة الحسابات (COA)", href: "/finance/accounts" },
          { name: "أعمار الديون والمديونيات", href: "/finance/ledgers" },
          { name: "الخزينة والشيكات والبنوك", href: "/finance/treasury" },
          { name: "الأرباح والخسائر (P&L)", href: "/finance/pnl" },
        ],
      },
    },
    {
      key: "hr",
      section: {
        title: "الموارد البشرية والورش",
        icon: "groups",
        prefix: "/hr",
        items: [
          { name: "سجل الفنيين والعمالة", href: "/hr/employees" },
          { name: "حضور وانصراف الورديات", href: "/hr/attendance" },
          { name: "مسير الأجور وحوافز القطعة", href: "/hr/payroll" },
        ],
      },
    },
    {
      key: "settings",
      section: {
        title: "الأمان والصلاحيات (RBAC)",
        icon: "admin_panel_settings",
        prefix: "/settings",
        items: [
          { name: "إدارة المستخدمين", href: "/settings/users" },
          { name: "الأدوار الوظيفية", href: "/settings/roles" },
          { name: "مقارنة الأدوار", href: "/settings/roles/compare" },
          { name: "مصفوفة الصلاحيات", href: "/settings/permissions/matrix" },
          { name: "نطاق الوصول للبيانات", href: "/settings/permissions/data-scope" },
          { name: "مسارات الاعتماد والموافقات", href: "/settings/approvals/workflows" },
          { name: "حدود الصلاحيات المالية", href: "/settings/approvals/limits" },
          { name: "تفويض الصلاحيات المؤقت", href: "/settings/approvals/delegation" },
          { name: "سجل التدقيق الشامل (Audit)", href: "/settings/audit-log" },
          { name: "الأمان والجلسات النشطة", href: "/settings/security" },
        ],
      },
    },
  ];

  return (
    <aside
      aria-label="الشريط الجانبي للتنقل"
      className="fixed right-0 top-0 h-screen w-72 bg-surface-container-lowest border-l border-outline-variant/40 z-40 flex flex-col shadow-lg transition-colors duration-200"
    >
      {/* Enhanced Brand Header — Inspired by SOTEX Brand Poster (#202528 Charcoal + #C8B276 Gold Emblem) */}
      <div className="p-3.5 border-b border-[#C8B276]/30 bg-[#181C1E] text-white shrink-0 space-y-2.5">
        <Link href="/" className="flex items-center justify-between hover:opacity-95 transition-opacity">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8B276] flex items-center justify-center p-2 shadow-lg shadow-[#C8B276]/25 border border-[#9E7A3F] shrink-0">
              <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="font-label-lg text-[16px] tracking-wider text-white font-black">
                  SOTEX
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#C8B276]/25 text-[#C8B276] border border-[#C8B276]/40">
                  ERP
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#C8B276]">
                سوتكس للملابس والمنسوجات
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[#C8B276] text-[20px]" title="هوية سوتكس المعتمدة">
            verified
          </span>
        </Link>

        {/* Central Facility & Operational Status Card */}
        <div className="px-2.5 py-2 rounded-lg bg-[#202528] border border-[#C8B276]/25 flex items-center justify-between text-right">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C8B276] text-[16px]">location_on</span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-white leading-tight">المحلة الكبرى</span>
              <span className="text-[9px] text-[#A3ACB2]">المقر والمصانع المركزية</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>متصل</span>
          </div>
        </div>

        {/* Active Role and User Card with Direct Role Badge */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#282E32] border border-[#C8B276]/15 text-right">
          <div className="flex items-center gap-2 truncate">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.nameAr}
              className="w-7 h-7 rounded-full object-cover border border-[#C8B276]/60 shrink-0"
            />
            <div className="flex flex-col truncate">
              <span className="text-[11px] font-bold text-white truncate">{currentUser.nameAr}</span>
              <span className="text-[9px] text-[#C8B276] font-medium truncate">{roleConfig.nameAr}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="تسجيل الخروج والعودة لشاشة الدخول"
            className="p-1 rounded hover:bg-rose-950/40 text-on-surface-variant hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-space-sm py-space-sm space-y-1 text-right">
        {sections.map(({ key, section }) => {
          const isExpanded = expandedSections[key] ?? true;

          return (
            <div key={key} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleSection(key)}
                className="w-full px-space-sm py-1.5 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider flex items-center justify-between hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 font-bold text-on-surface">
                  <span className="material-symbols-outlined text-[17px] text-[#C8B276]">{section.icon}</span>
                  <span>{section.title}</span>
                </span>
                <span
                  className="material-symbols-outlined text-[14px] text-outline transition-transform duration-200"
                  style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(90deg)" }}
                >
                  expand_more
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-0.5 pr-2 border-r border-[#C8B276]/25 mr-2.5">
                  {section.items.map((item) => {
                    const active = isCurrent(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-all text-xs ${active
                            ? "bg-gradient-to-l from-[#C8B276] to-[#B59D60] text-[#181C1E] font-extrabold shadow-sm border-r-4 border-[#9E7A3F]"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                          }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.badge !== undefined && Number(item.badge) > 0 && (
                            <span
                              className={`px-1.5 py-[1px] rounded-full text-[10px] font-bold ${item.badgeType === "error"
                                  ? "bg-error text-on-error"
                                  : active
                                    ? "bg-[#181C1E] text-[#C8B276]"
                                    : "bg-surface-container-high text-on-surface"
                                }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {active && (
                            <span className="material-symbols-outlined text-[12px] text-[#181C1E]">
                              arrow_back_ios
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer System Status & Quick Logout */}
      <div className="p-2.5 border-t border-outline-variant/30 bg-surface-container-low shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-label-sm text-[10px] text-on-surface-variant">
            المحلة الكبرى — مصر
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-[11px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
          title="تسجيل الخروج والعودة لشاشة الدخول"
        >
          <span className="material-symbols-outlined text-[14px]">logout</span>
          <span>تسجيل خروج</span>
        </button>
      </div>
    </aside>
  );
}
