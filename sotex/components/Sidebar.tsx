"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { roleConfig, pendingApprovalsCount, unreadNotificationsCount } = useERP();
  const [menuFilter, setMenuFilter] = useState("");

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    main: true,
    products: true,
    inventory: true,
    production: true,
    sales: true,
    quality: true,
    procurement: true,
    finance: true,
    hr: true,
    settings: true,
  });

  // Automatically close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  const filteredSections = sections
    .map(({ key, section }) => {
      if (!menuFilter.trim()) return { key, section };
      const q = menuFilter.trim().toLowerCase();
      const matchedItems = section.items.filter((i) => i.name.toLowerCase().includes(q));
      if (section.title.toLowerCase().includes(q)) return { key, section };
      return { key, section: { ...section, items: matchedItems } };
    })
    .filter(({ section }) => section.items.length > 0);

  return (
    <>
      {/* Mobile & Tablet Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        aria-label="الشريط الجانبي للتنقل"
        className={`fixed right-0 top-0 h-screen bg-surface-container-lowest border-l border-outline-variant/40 z-50 lg:z-40 flex flex-col shadow-2xl lg:shadow-lg transition-all duration-300 ease-in-out ${
          collapsed ? "lg:w-20" : "lg:w-72"
        } w-[85vw] max-w-[300px] ${
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header — SOTEX Brand Poster (#181C1E Charcoal + #C8B276 Gold Emblem) */}
        <div className="h-16 px-3.5 border-b border-[#C8B276]/25 flex items-center justify-between bg-[#181C1E] text-white shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-95 transition-opacity overflow-hidden"
          >
            <div className="w-10 h-10 rounded-lg bg-[#C8B276] flex items-center justify-center p-1.5 shadow-md shadow-[#C8B276]/20 border border-[#9E7A3F] shrink-0">
              <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            {!collapsed && (
              <div className="flex flex-col text-right truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-lg text-[16px] tracking-wider text-white font-extrabold">
                    SOTEX
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#C8B276]/20 text-[#C8B276] border border-[#C8B276]/40">
                    COLLECTION
                  </span>
                </div>
                <span className="font-label-sm text-[11px] text-[#A3ACB2] truncate">
                  منظومة إدارة وتصنيع الملابس
                </span>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {/* Desktop Collapse Toggle */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={collapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
                className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center text-[#A3ACB2] hover:text-[#C8B276] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {collapsed ? "keyboard_double_arrow_left" : "keyboard_double_arrow_right"}
                </span>
              </button>
            )}

            {/* Mobile Close Drawer Button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="إغلاق القائمة"
                className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center bg-[#262C30] text-[#C8B276] hover:bg-[#32393F] border border-[#C8B276]/30 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Role Indicator & Quick Filter in Sidebar (hidden when collapsed on desktop) */}
        {!collapsed && (
          <div className="p-2.5 bg-surface-container-low border-b border-outline-variant/30 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-right px-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[#C8B276] text-[16px] shrink-0">badge</span>
                <span className="text-[11px] font-bold text-on-surface truncate">{roleConfig.nameAr}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C8B276]/15 text-[#C8B276] border border-[#C8B276]/30 font-semibold shrink-0">
                نشط
              </span>
            </div>

            {/* Quick In-Menu Filter */}
            <div className="relative">
              <input
                type="text"
                value={menuFilter}
                onChange={(e) => setMenuFilter(e.target.value)}
                placeholder="تصفية أقسام القائمة..."
                className="w-full h-8 pr-8 pl-2.5 rounded-lg bg-surface-container text-on-surface text-[11px] border border-outline-variant/40 focus:outline-none focus:border-[#C8B276] transition-colors"
              />
              <span className="material-symbols-outlined text-[15px] text-outline absolute right-2.5 top-1.5 pointer-events-none">
                filter_list
              </span>
              {menuFilter && (
                <button
                  type="button"
                  onClick={() => setMenuFilter("")}
                  className="absolute left-2 top-1.5 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1.5 text-right">
          {filteredSections.map(({ key, section }) => {
            const isExpanded = expandedSections[key] ?? true;

            if (collapsed) {
              // Collapsed icon-only mode for desktop
              const firstHref = section.items[0]?.href || "/";
              const sectionActive = section.items.some((i) => isCurrent(i.href));
              return (
                <Link
                  key={key}
                  href={firstHref}
                  title={section.title}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all ${
                    sectionActive
                      ? "bg-[#C8B276] text-[#181C1E] font-bold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-[#C8B276]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                  <span className="text-[9px] mt-1 font-semibold truncate max-w-[60px]">
                    {section.title.split(" ")[0]}
                  </span>
                </Link>
              );
            }

            return (
              <div key={key} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  className="w-full px-2.5 py-1.5 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider flex items-center justify-between hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
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

                {(isExpanded || menuFilter.trim() !== "") && (
                  <div className="space-y-0.5 pr-2 border-r border-[#C8B276]/25 mr-2.5">
                    {section.items.map((item) => {
                      const active = isCurrent(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-all text-xs ${
                            active
                              ? "bg-gradient-to-l from-[#C8B276] to-[#B59D60] text-[#181C1E] font-extrabold shadow-sm border-r-4 border-[#9E7A3F]"
                              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.badge !== undefined && Number(item.badge) > 0 && (
                              <span
                                className={`px-1.5 py-[1px] rounded-full text-[10px] font-bold ${
                                  item.badgeType === "error"
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

        {/* Footer System Status */}
        <div className="p-2.5 border-t border-outline-variant/30 bg-surface-container-low shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A] animate-pulse shrink-0" />
            {!collapsed && (
              <span className="font-label-sm text-[11px] text-on-surface-variant truncate">
                سوتكس: متصل ومؤمن
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="font-label-sm text-[10px] text-[#C8B276] font-mono font-bold">
              WWW.SOTEX.COM
            </span>
          )}
        </div>
      </aside>
    </>
  );
}
