"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";

interface SearchEntry {
  title: string;
  category: string;
  href: string;
  icon: string;
  shortcut?: string;
}

const SEARCH_ITEMS: SearchEntry[] = [
  // Dashboard & Operations
  { title: "لوحة التحكم المركزية", category: "الرئيسية", href: "/", icon: "dashboard" },
  { title: "التنبيهات العاجلة ونواقص الخامات", category: "الرئيسية", href: "/alerts", icon: "warning" },
  { title: "المهام التشغيلية وصالات التشغيل", category: "الرئيسية", href: "/tasks", icon: "assignment" },
  { title: "مركز الموافقات الإدارية والمالية", category: "الرئيسية", href: "/approvals", icon: "rule" },
  { title: "تقويم الورديات ومواعيد التسليم", category: "الرئيسية", href: "/calendar", icon: "calendar_month" },

  // Products & SKUs
  { title: "كتالوج المنتجات والموديلات", category: "المنتجات", href: "/products", icon: "checkroom" },
  { title: "معالج تكويد موديل جديد", category: "المنتجات", href: "/products/new", icon: "add_box" },
  { title: "مصفوفة الألوان والمقاسات (SKUs)", category: "المنتجات", href: "/products/skus", icon: "style" },
  { title: "مصفوفة أسعار البيع والتكلفة", category: "المنتجات", href: "/products/pricing", icon: "price_change" },

  // Warehouses & Materials
  { title: "أرصدة وحركات المخازن", category: "المخازن", href: "/inventory", icon: "warehouse" },
  { title: "أرصدة الأقمشة والإكسسوارات والرولات", category: "المخازن", href: "/inventory/fabrics", icon: "texture" },
  { title: "إذون الصرف والإضافة (GRN)", category: "المخازن", href: "/inventory/transactions", icon: "sync_alt" },
  { title: "تحويلات الفروع والمخازن", category: "المخازن", href: "/inventory/transfers", icon: "local_shipping" },
  { title: "الجرد الدوري والباركود", category: "المخازن", href: "/inventory/stock-count", icon: "qr_code_scanner" },

  // Production
  { title: "أوامر الإنتاج والتصنيع", category: "الإنتاج", href: "/production", icon: "precision_manufacturing" },
  { title: "لوحة كفاءة الخطوط OEE", category: "الإنتاج", href: "/production/oee", icon: "speed" },
  { title: "تخطيط وموازنة خطوط الخياطة", category: "الإنتاج", href: "/production/planning", icon: "view_timeline" },
  { title: "قوائم شجرة المواد (BOM)", category: "الإنتاج", href: "/production/bom", icon: "account_tree" },
  { title: "محطات ومراحل التشغيل (قص / خياطة / تشطيب)", category: "الإنتاج", href: "/production/stages", icon: "conveyor_belt" },

  // Sales & Customers
  { title: "طلبات البيع والتصدير", category: "المبيعات", href: "/sales", icon: "point_of_sale" },
  { title: "عروض الأسعار والتوكيلات", category: "المبيعات", href: "/sales/quotations", icon: "request_quote" },
  { title: "سجل حسابات العملاء وتوكيلات التوزيع", category: "المبيعات", href: "/sales/customers", icon: "group" },

  // Quality
  { title: "لوحة مؤشرات الجودة AQL", category: "الجودة", href: "/quality", icon: "verified" },
  { title: "فحص مراحل الخياطة المرحلي In-Line", category: "الجودة", href: "/quality/inline", icon: "traffic" },
  { title: "سجل العيوب ومخطط باريتو CAPA", category: "الجودة", href: "/quality/defects", icon: "bug_report" },
  { title: "فحص الأقمشة والخياطة والمنتج النهائي", category: "الجودة", href: "/quality/inspections", icon: "fact_check" },

  // Procurement & Finance & HR
  { title: "إدارة المشتريات والتوريد", category: "المشتريات", href: "/procurement", icon: "shopping_cart" },
  { title: "مناقصات وعروض أسعار الموردين RFQ", category: "المشتريات", href: "/procurement/quotations", icon: "request_quote" },
  { title: "فواتير المشتريات والمطابقة الثلاثية 3-Way", category: "المشتريات", href: "/procurement/invoices", icon: "receipt_long" },
  { title: "سجل ودليل الموردين المعتمدين", category: "المشتريات", href: "/procurement/suppliers", icon: "corporate_fare" },
  { title: "الإدارة المالية والقيود والخزينة", category: "المالية", href: "/finance", icon: "account_balance" },
  { title: "شجرة ودليل الحسابات COA", category: "المالية", href: "/finance/accounts", icon: "account_tree" },
  { title: "أرصدة ومديونيات العملاء والموردين Aging", category: "المالية", href: "/finance/ledgers", icon: "contacts" },
  { title: "الخزينة وحسابات البنوك والشيكات", category: "المالية", href: "/finance/treasury", icon: "payments" },
  { title: "قائمة الدخل والأرباح والخسائر P&L", category: "المالية", href: "/finance/pnl", icon: "analytics" },
  { title: "سجل الفنيين والعمالة ومشرفي الخطوط", category: "الموارد البشرية", href: "/hr/employees", icon: "group" },
  { title: "حضور وانصراف الورديات والبصمة", category: "الموارد البشرية", href: "/hr/attendance", icon: "schedule" },
  { title: "مسير الأجور وحوافز الإنتاج بالقطعة", category: "الموارد البشرية", href: "/hr/payroll", icon: "payments" },
  { title: "مركز التقارير والتحليلات المجمعة", category: "التقارير", href: "/reports", icon: "analytics" },

  // Settings & Security
  { title: "إدارة المستخدمين وحسابات الموظفين", category: "الإعدادات والأمان", href: "/settings/users", icon: "manage_accounts" },
  { title: "إضافة مستخدم جديد", category: "الإعدادات والأمان", href: "/settings/users/new", icon: "person_add" },
  { title: "الأدوار الوظيفية والصلاحيات", category: "الإعدادات والأمان", href: "/settings/roles", icon: "badge" },
  { title: "مقارنة الأدوار جنباً إلى جنب", category: "الإعدادات والأمان", href: "/settings/roles/compare", icon: "compare_arrows" },
  { title: "مصفوفة الصلاحيات الشاملة", category: "الإعدادات والأمان", href: "/settings/permissions/matrix", icon: "grid_view" },
  { title: "إدارة نطاق الوصول للبيانات (Data Scopes)", category: "الإعدادات والأمان", href: "/settings/permissions/data-scope", icon: "security" },
  { title: "مسارات الموافقات وفصل المهام", category: "الإعدادات والأمان", href: "/settings/approvals/workflows", icon: "alt_route" },
  { title: "حدود وصلاحيات الاعتماد المالي والكمي", category: "الإعدادات والأمان", href: "/settings/approvals/limits", icon: "price_change" },
  { title: "تفويض الصلاحيات المؤقت", category: "الإعدادات والأمان", href: "/settings/approvals/delegation", icon: "assignment_ind" },
  { title: "سجل التدقيق والمراجعة الشامل (Audit Log)", category: "الإعدادات والأمان", href: "/settings/audit-log", icon: "history_toggle_off" },
  { title: "لوحة تحكم الأمان والمخاطر", category: "الإعدادات والأمان", href: "/settings/security", icon: "shield" },
  { title: "إدارة الجلسات والأجهزة النشطة", category: "الإعدادات والأمان", href: "/settings/security/sessions", icon: "devices" },
];

export default function CommandPalette() {
  const { searchOpen, setSearchOpen } = useERP();
  const [query, setQuery] = useState("");
  const router = useRouter();

  if (!searchOpen) return null;

  const filtered = query.trim() === ""
    ? SEARCH_ITEMS.slice(0, 10)
    : SEARCH_ITEMS.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (href: string) => {
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-space-sm border-b border-brand-gold/30 flex items-center gap-space-sm bg-surface-container-low">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-brand-gold/50 flex items-center justify-center shrink-0 shadow-xs">
            <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain" />
          </div>
          <span className="material-symbols-outlined text-brand-gold text-[22px]">search</span>
          <input
            autoFocus
            type="text"
            className="flex-1 bg-transparent border-none text-right font-body-md text-on-surface placeholder:text-outline focus:outline-none"
            placeholder="ابحث عن أي شاشة، أمر إنتاج، خامة، أو مستخدم..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-space-sm space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-body-sm">
              لم يتم العثور على أي شاشات مطابقة لبحثك
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item.href)}
                className="w-full flex items-center justify-between p-space-sm rounded-lg hover:bg-surface-container text-right transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-label-md text-on-surface font-medium">{item.title}</span>
                    <span className="font-label-sm text-[11px] text-on-surface-variant">{item.category}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">
                  arrow_back_ios
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-space-xs px-space-md border-t border-outline-variant/30 bg-surface-container-low flex items-center justify-between text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span>للتنقل: <kbd className="px-1 py-0.5 rounded bg-surface-container border border-outline-variant/50">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-surface-container border border-outline-variant/50">↓</kbd></span>
            <span>للاختيار: <kbd className="px-1 py-0.5 rounded bg-surface-container border border-outline-variant/50">Enter</kbd></span>
          </div>
          <span>للإغلاق: <kbd className="px-1 py-0.5 rounded bg-surface-container border border-outline-variant/50">Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}

