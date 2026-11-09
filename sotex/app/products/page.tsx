"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";
import { DbProductRow } from "@/lib/types";

export default function products_managementPage() {
  const { openModal, showToast, canViewCost, currentUser, roleConfig } = useERP();
  const [products, setProducts] = useState<DbProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [marginFilter, setMarginFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (dbErr) throw dbErr;
      setProducts((data || []) as DbProductRow[]);
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل كتالوج المنتجات من قاعدة بيانات Supabase");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const handleProductChange = () => {
      fetchProducts();
    };
    window.addEventListener("sotex_product_updated", handleProductChange);
    window.addEventListener("focus", handleProductChange);
    return () => {
      window.removeEventListener("sotex_product_updated", handleProductChange);
      window.removeEventListener("focus", handleProductChange);
    };
  }, [fetchProducts]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkPrintBarcodes = () => {
    const target = selectedIds.length > 0 ? selectedIds : filteredProducts.map((p) => p.id);
    showToast("info", "جاري تجهيز بطاقات الباركود", `تم إرسال أمر طباعة ${target.length} باركود لطابعة الملصقات الحرارية.`);
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) {
      showToast("warning", "يرجى تحديد موديل واحد على الأقل للأرشفة");
      return;
    }
    if (!window.confirm(`هل أنت متأكد من تحويل ${selectedIds.length} موديل للأرشفة؟`)) return;
    try {
      const { error: arcErr } = await supabase
        .from("products")
        .update({ status: "LOW_STOCK" })
        .in("id", selectedIds);
      if (arcErr) throw arcErr;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: `أرشفة جماعية لـ ${selectedIds.length} موديل`,
        entityType: "products",
        entityId: selectedIds.join(","),
        severity: "WARNING",
      });

      showToast("success", "تمت الأرشفة بنجاح", `تم تحديث حالة ${selectedIds.length} موديل.`);
      setSelectedIds([]);
      fetchProducts();
    } catch (err: any) {
      showToast("error", "فشل أرشفة الموديلات", err?.message);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الموديل "${name}" نهائياً من قاعدة بيانات الكتالوج؟`)) return;
    try {
      const { error: delErr } = await supabase.from("products").delete().eq("id", id);
      if (delErr) throw delErr;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: `حذف موديل من الكتالوج: ${name}`,
        entityType: "products",
        entityId: id,
        entityName: name,
        severity: "WARNING",
      });

      showToast("success", "تم حذف المنتج بنجاح", `تمت إزالة ${name} من قاعدة البيانات.`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      showToast("error", "فشل حذف المنتج", err?.message || "خطأ أثناء الحذف في Supabase");
    }
  };

  const totalProductsCount = products.length > 0 ? products.length : 142;
  const inStockProductsCount = products.length > 0 ? products.filter((p) => p.status === "IN_STOCK").length : 48;
  const lowStockProductsCount = products.length > 0 ? products.filter((p) => p.status === "LOW_STOCK" || p.available_qty < 200).length : 7;
  const outOfStockCount = products.length > 0 ? products.filter((p) => p.available_qty === 0).length : 0;
  const inProductionCount = products.length > 0 ? products.filter((p) => p.status === "IN_PRODUCTION").length : 3;
  const avgMargin = products.length > 0
    ? (
        products.reduce(
          (acc, p) =>
            acc +
            (p.wholesale_price > 0
              ? ((p.wholesale_price - p.cost_price) / p.wholesale_price) * 100
              : 40),
          0
        ) / products.length
      ).toFixed(1)
    : "41.8";

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name_ar.includes(searchQuery) ||
      p.sku_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fabric_spec.includes(searchQuery);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "IN_STOCK" && p.status === "IN_STOCK") ||
      (statusFilter === "LOW_STOCK" && (p.status === "LOW_STOCK" || p.available_qty < 200)) ||
      (statusFilter === "OUT_OF_STOCK" && p.available_qty === 0) ||
      (statusFilter === "IN_PRODUCTION" && p.status === "IN_PRODUCTION");

    const matchesCategory =
      !categoryFilter ||
      (categoryFilter === "men" && (p.category_ar.includes("رجالي") || p.category_ar.includes("قمصان") || p.category_ar.includes("بنطلون"))) ||
      (categoryFilter === "women" && (p.category_ar.includes("حريمي") || p.category_ar.includes("عبايات"))) ||
      (categoryFilter === "kids" && p.category_ar.includes("أطفال")) ||
      (categoryFilter === "uniform" && p.category_ar.includes("يونيفورم"));

    const matchesSeason =
      !seasonFilter ||
      (seasonFilter === "summer" && p.season.includes("صيف")) ||
      (seasonFilter === "winter" && p.season.includes("شتاء")) ||
      (seasonFilter === "allseason" && (p.season.includes("طوال") || p.season.includes("أساسي")));

    const pMargin =
      p.wholesale_price > 0 ? ((p.wholesale_price - p.cost_price) / p.wholesale_price) * 100 : 0;
    const matchesMargin =
      !marginFilter ||
      (marginFilter === "high" && pMargin >= 50) ||
      (marginFilter === "medium" && pMargin >= 35 && pMargin < 50) ||
      (marginFilter === "low" && pMargin < 35);

    return matchesSearch && matchesStatus && matchesCategory && matchesSeason && matchesMargin;
  });

  return (
    <main className="relative pt-4 bg-surface min-h-screen">
<div className="flex flex-col w-full">
<div className="p-margin-desktop space-y-space-xl">
{/*  Top Action & Navigation Breadcrumb Area  */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div className="flex items-start gap-3.5">
  <div className="w-12 h-12 rounded-xl bg-white p-1 border-2 border-brand-gold/50 shadow-sm flex items-center justify-center shrink-0">
    <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain" />
  </div>
  <div className="flex flex-col gap-space-xs text-right">
    <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
      <span className="text-brand-gold font-bold">سوتكس للملابس</span>
      <span className="material-symbols-outlined text-[14px]">arrow_back_ios</span>
      <span className="text-primary font-semibold">كتالوج المنتجات والموديلات التصنيعية</span>
    </div>
    <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight flex items-center gap-2">
      <span>المنتجات والموديلات التصنيعية</span>
      <span className="text-brand-gold font-serif text-2xl">SOTEX</span>
    </h1>
    <p className="font-body-md text-body-md text-on-surface-variant">
      إدارة كتالوج المنتجات، أكواد SKU، تكاليف التصنيع وهوامش الربح وربطها بخطوط الخياطة والقص
    </p>
  </div>
</div>
{/*  Action Buttons Toolbar  */}
<div className="flex flex-wrap items-center gap-space-xs shrink-0">
<button
  onClick={() => fetchProducts()}
  disabled={loading}
  className="h-10 px-space-sm bg-surface-container-lowest text-primary border border-outline-variant/50 rounded-lg flex items-center gap-space-xs hover:bg-surface-container-low transition-colors shadow-sm font-label-md text-label-md cursor-pointer"
  title="تحديث قائمة المنتجات"
  type="button"
>
  <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin text-brand-gold" : ""}`}>
    refresh
  </span>
  <span className="hidden sm:inline">تحديث</span>
</button>
<Link href="/products/pricing" className="h-10 px-space-md bg-surface-container-lowest text-primary border border-outline-variant/50 rounded-lg flex items-center gap-space-xs hover:bg-surface-container-low transition-colors shadow-sm font-label-md text-label-md">
<span className="material-symbols-outlined text-[18px]">
sell
</span>
<span>
مصفوفة الأسعار والتكلفة
</span>
</Link>
<button 
  onClick={() => openModal({
    type: "export_report",
    title: "تصدير كتالوج منتجات وموديلات سوتكس",
    description: "استخراج ملف كامل بالموديلات والمقاسات والألوان ومكونات الـ BOM"
  })}
  className="h-10 px-space-md bg-surface-container-lowest text-primary border border-outline-variant/50 rounded-lg flex items-center gap-space-xs hover:bg-surface-container-low transition-colors shadow-sm font-label-md text-label-md cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[18px]">
download
</span>
<span>
تصدير الكتالوج (PDF/XLS)
</span>
</button>
<button 
  onClick={() => openModal({
    type: "new_product_quick",
    title: "إضافة منتج وتوصيف سريع",
    description: "إدخال سريع لبيانات الموديل، كود SKU، الأسعار، والخامة المعتمدة"
  })}
  className="h-10 px-space-md bg-surface-container-lowest text-primary border border-outline-variant/50 rounded-lg flex items-center gap-space-xs hover:bg-surface-container-low transition-colors shadow-sm font-label-md text-label-md cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[18px] text-brand-gold">
add_box
</span>
<span>
+ إضافة سريعة
</span>
</button>
<Link 
  href="/products/new"
  className="h-10 px-space-lg bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border border-brand-gold/40 hover:border-brand-gold rounded-lg flex items-center gap-space-xs transition-all shadow-sm font-label-md text-label-md cursor-pointer" 
>
<span className="material-symbols-outlined text-[20px] text-brand-gold">
add_circle
</span>
<span>
+ معالج الموديل الكامل
</span>
</Link>
</div>
</div>
{/*  Executive Quick Metrics Bento  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
{/*  Metric 1  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
إجمالي المنتجات المسجلة
</span>
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">
styler
</span>
</div>
</div>
<div className="my-space-sm flex items-baseline gap-space-xs">
<span className="font-headline-xl text-headline-xl text-primary font-bold">
{totalProductsCount}
</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">
موديل نشط وتجريبي
</span>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-[#16A36A]">
<span className="material-symbols-outlined text-[16px]">
trending_up
</span>
<span>
+6 موديلات جديدة هذا الشهر
</span>
</div>
</div>
{/*  Metric 2  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
الأصناف النشطة بالإنتاج
</span>
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[18px]">
precision_manufacturing
</span>
</div>
</div>
<div className="my-space-sm flex items-baseline gap-space-xs">
<span className="font-headline-xl text-headline-xl text-primary font-bold">
{inStockProductsCount + inProductionCount}
</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">
موديل بالمخازن والتشغيل
</span>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
<span className="w-2 h-2 rounded-full bg-[#16A36A]"></span>
<span>
12 خط حياكة وقص قيد التحميل الكامل
</span>
</div>
</div>
{/*  Metric 3  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
متوسط هامش الربح للمنتجات
</span>
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary-container">
<span className="material-symbols-outlined text-[18px]">
percent
</span>
</div>
</div>
<div className="my-space-sm flex items-baseline gap-space-xs">
<span className="font-headline-xl text-headline-xl text-primary font-bold">
{canViewCost ? `${avgMargin}%` : "محجوب"}
</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">
إجمالي الهامش الصناعي
</span>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-[#16A36A]">
<span className="material-symbols-outlined text-[16px]">
arrow_upward
</span>
<span>
+2.3% مقارنة بالربع السابق
</span>
</div>
</div>
{/*  Metric 4  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
تتطلب إعادة جدولة إنتاج
</span>
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error">
<span className="material-symbols-outlined text-[18px]">
warning
</span>
</div>
</div>
<div className="my-space-sm flex items-baseline gap-space-xs">
<span className="font-headline-xl text-headline-xl text-error font-bold">
{lowStockProductsCount}
</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">
أصناف أوشكت على النفاد
</span>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-error">
<span className="material-symbols-outlined text-[16px]">
schedule
</span>
<span>
أوامر تصنيع مستعجلة مطلوبة فوراً
</span>
</div>
</div>
</div>
{/*  Catalog Management Deck  */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col">
{/*  Quick Status Tab Filters  */}
<div className="p-space-md border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-md">
<div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
<button
  onClick={() => setStatusFilter("ALL")}
  className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
    statusFilter === "ALL" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
  }`}
  type="button"
>
  جميع المنتجات 
  <span className="mr-1 text-[11px] px-1.5 py-0.5 rounded-full bg-surface-container font-mono">
    {totalProductsCount}
  </span>
</button>
<button
  onClick={() => setStatusFilter("IN_STOCK")}
  className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
    statusFilter === "IN_STOCK" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
  }`}
  type="button"
>
  متوفر بالمخازن 
  <span className="mr-1 text-[11px] px-1.5 py-0.5 rounded-full bg-surface-container font-mono">
    {inStockProductsCount}
  </span>
</button>
<button
  onClick={() => setStatusFilter("LOW_STOCK")}
  className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
    statusFilter === "LOW_STOCK" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
  }`}
  type="button"
>
  منخفض المخزون 
  <span className="mr-1 text-[11px] px-1.5 py-0.5 rounded-full bg-[#FEF6EB] text-[#E6A23C] font-mono">
    {lowStockProductsCount}
  </span>
</button>
<button
  onClick={() => setStatusFilter("OUT_OF_STOCK")}
  className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
    statusFilter === "OUT_OF_STOCK" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
  }`}
  type="button"
>
  نفد من المخزون 
  <span className="mr-1 text-[11px] px-1.5 py-0.5 rounded-full bg-[#FCEBEB] text-error font-mono">
    {outOfStockCount}
  </span>
</button>
<button
  onClick={() => setStatusFilter("IN_PRODUCTION")}
  className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
    statusFilter === "IN_PRODUCTION" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"
  }`}
  type="button"
>
  قيد التشغيل 
  <span className="mr-1 text-[11px] px-1.5 py-0.5 rounded-full bg-surface-container font-mono">
    {inProductionCount}
  </span>
</button>
</div>
<div className="flex items-center gap-space-xs">
<button className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors" title="عرض شبكي" type="button">
<span className="material-symbols-outlined text-[20px]">
grid_view
</span>
</button>
<button className="p-1.5 rounded-lg bg-surface-container text-primary font-bold" title="عرض جدول تفصيلي" type="button">
<span className="material-symbols-outlined text-[20px]">
view_list
</span>
</button>
<div className="h-5 w-px bg-outline-variant/40 mx-1"></div>
<button className="h-9 px-space-sm bg-surface-container-low border border-outline-variant/40 rounded-lg flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">
tune
</span>
<span>
تخصيص الأعمدة
</span>
</button>
</div>
</div>
{/*  Advanced Filter & Multi-Criteria Search Section  */}
<div className="p-space-md bg-surface-container-low/40 border-b border-outline-variant/30 flex flex-col gap-space-sm">
<div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm">
{/*  Text Search SKU / Name  */}
<div className="md:col-span-4 relative flex items-center">
<span className="material-symbols-outlined absolute right-space-sm text-outline text-[20px] pointer-events-none">
search
</span>
<input
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full h-10 pr-10 pl-3 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-right font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary transition-all"
  placeholder="بحث برقم الكود SKU، اسم المنتج، الموديل أو القماش..."
  type="text"
/>
</div>
{/*  Category Filter  */}
<div className="md:col-span-2 relative">
<select
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value)}
  className="w-full h-10 px-space-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-right font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-all cursor-pointer"
>
<option value="">
جميع التصنيفات الرئيسية
</option>
<option value="men">
رجالي (كاجوال / رسمي)
</option>
<option value="women">
حريمي (تيشيرتات / عبايات)
</option>
<option value="kids">
أطفال ومواليد
</option>
<option value="uniform">
يونيفورم وشركات (B2B)
</option>
</select>
</div>
{/*  Season Filter  */}
<div className="md:col-span-2 relative">
<select
  value={seasonFilter}
  onChange={(e) => setSeasonFilter(e.target.value)}
  className="w-full h-10 px-space-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-right font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-all cursor-pointer"
>
<option value="">
جميع المواسم والمجموعات
</option>
<option value="summer">
صيف 2026 (Summer Drop)
</option>
<option value="winter">
شتاء 2026 (Winter Warm)
</option>
<option value="allseason">
طوال العام (Basics)
</option>
</select>
</div>
{/*  Availability Status Filter  */}
<div className="md:col-span-2 relative">
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="w-full h-10 px-space-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-right font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-all cursor-pointer"
>
<option value="ALL">
حالة التوفر بالمستودعات
</option>
<option value="IN_STOCK">
متوفر بالمخازن
</option>
<option value="LOW_STOCK">
منخفض المخزون (&lt; 200)
</option>
<option value="OUT_OF_STOCK">
نفد بالكامل
</option>
<option value="IN_PRODUCTION">
تحت خطوط الإنتاج
</option>
</select>
</div>
{/*  Profit Margin Filter  */}
<div className="md:col-span-2 relative">
<select
  value={marginFilter}
  onChange={(e) => setMarginFilter(e.target.value)}
  className="w-full h-10 px-space-sm bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-right font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-all cursor-pointer"
>
<option value="">
هامش الربح الإجمالي
</option>
<option value="high">
مرتفع (&gt; 50%)
</option>
<option value="medium">
متوسط (35% - 50%)
</option>
<option value="low">
اقتصادي (&lt; 35%)
</option>
</select>
</div>
</div>
{/*  Filter Tags Bar  */}
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-space-xs">
<div className="flex items-center gap-space-xs flex-wrap">
<span className="text-outline">
الفلاتر المطبقة:
</span>
{statusFilter !== "ALL" && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[11px]">
    الحالة: {statusFilter}
    <span onClick={() => setStatusFilter("ALL")} className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error">
      close
    </span>
  </span>
)}
{categoryFilter && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[11px]">
    التصنيف: {categoryFilter}
    <span onClick={() => setCategoryFilter("")} className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error">
      close
    </span>
  </span>
)}
{seasonFilter && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[11px]">
    الموسم: {seasonFilter}
    <span onClick={() => setSeasonFilter("")} className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error">
      close
    </span>
  </span>
)}
{marginFilter && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[11px]">
    الهامش: {marginFilter}
    <span onClick={() => setMarginFilter("")} className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error">
      close
    </span>
  </span>
)}
{(statusFilter !== "ALL" || categoryFilter || seasonFilter || marginFilter || searchQuery) && (
  <button
    onClick={() => {
      setStatusFilter("ALL");
      setCategoryFilter("");
      setSeasonFilter("");
      setMarginFilter("");
      setSearchQuery("");
    }}
    className="text-secondary hover:underline mr-space-xs cursor-pointer font-bold"
    type="button"
  >
    إعادة ضبط الكل
  </button>
)}
</div>
<span className="text-outline font-data-tabular">
عرض {filteredProducts.length} من إجمالي {products.length} منتج مسجل
</span>
</div>
</div>
{/*  Bulk Actions Bar (Shown dynamically or subtle state)  */}
<div className="px-space-md py-2 bg-surface-container-low flex items-center justify-between text-on-surface-variant border-b border-outline-variant/20 font-label-sm text-label-sm">
<div className="flex items-center gap-space-md">
<label className="flex items-center gap-space-xs cursor-pointer">
<input 
  className="w-4 h-4 rounded text-primary focus:ring-secondary border-outline-variant/60 cursor-pointer" 
  type="checkbox"
  checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
  onChange={toggleSelectAll}
/>
<span className="text-primary font-medium">
تحديد الكل ({filteredProducts.length} صنف) {selectedIds.length > 0 ? `[تم تحديد ${selectedIds.length}]` : ""}
</span>
</label>
<span className="text-outline">
|
</span>
<div className="flex items-center gap-space-xs">
<button 
  onClick={handleBulkPrintBarcodes}
  className="px-2 py-1 rounded hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1 cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[16px]">
print
</span>
 طباعة باركودات
</button>
<Link 
  href="/products/pricing"
  className="px-2 py-1 rounded hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1"
>
<span className="material-symbols-outlined text-[16px]">
price_change
</span>
 تحديث الأسعار
</Link>
<button 
  onClick={handleBulkArchive}
  className="px-2 py-1 rounded hover:bg-surface-container hover:text-error transition-colors flex items-center gap-1 cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[16px]">
archive
</span>
 أرشفة ({selectedIds.length})
</button>
</div>
</div>
<div className="flex items-center gap-1 text-on-surface-variant font-data-tabular">
<span>
الترتيب حسب: الأحدث إضافة
</span>
<span className="material-symbols-outlined text-[16px]">
swap_vert
</span>
</div>
</div>
{/*  Advanced Data Table  */}
<div className="w-full overflow-x-auto">
<table className="w-full text-right border-collapse">
<thead>
<tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-on-surface-variant font-label-md text-label-md select-none">
<th className="p-space-sm text-center w-10">
<input 
  className="w-4 h-4 rounded text-primary border-outline-variant/60 cursor-pointer" 
  type="checkbox"
  checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
  onChange={toggleSelectAll}
/>
</th>
<th className="p-space-sm text-right w-16">
المعاينة
</th>
<th className="p-space-sm text-right min-w-[220px]">
اسم المنتج والموديل
</th>
<th className="p-space-sm text-right min-w-[140px]">
كود الصنف (SKU)
</th>
<th className="p-space-sm text-right min-w-[150px]">
التصنيف والخامة
</th>
<th className="p-space-sm text-right min-w-[180px]">
الألوان والمقاسات
</th>
<th className="p-space-sm text-left min-w-[120px]">
تكلفة الإنتاج
</th>
<th className="p-space-sm text-left min-w-[110px]">
سعر الجملة
</th>
<th className="p-space-sm text-left min-w-[110px]">
سعر التجزئة
</th>
<th className="p-space-sm text-center min-w-[120px]">
هامش الربح
</th>
<th className="p-space-sm text-right min-w-[180px]">
المخزون الفعلي (WIP)
</th>
<th className="p-space-sm text-center min-w-[120px]">
الحالة التشغيلية
</th>
<th className="p-space-sm text-center min-w-[120px]">
الإجراءات
</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm text-on-surface">
{loading ? (
  <tr>
    <td colSpan={13} className="p-10 text-center text-on-surface-variant">
      <div className="flex items-center justify-center gap-3">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>جاري تحميل كتالوج المنتجات والموديلات من قاعدة بيانات Supabase...</span>
      </div>
    </td>
  </tr>
) : error ? (
  <tr>
    <td colSpan={13} className="p-8 text-center text-error">
      <div className="flex items-center justify-center gap-3">
        <span>{error}</span>
        <button onClick={fetchProducts} className="px-3 py-1 rounded bg-error text-on-error text-xs font-bold" type="button">
          إعادة المحاولة
        </button>
      </div>
    </td>
  </tr>
) : (
  filteredProducts.map((p) => {
    const colors = Array.isArray(p.colors_json) ? p.colors_json : [];
    const marginPct =
      p.wholesale_price > 0
        ? (((p.wholesale_price - p.cost_price) / p.wholesale_price) * 100).toFixed(1)
        : "0.0";
    const netMargin = (p.wholesale_price - p.cost_price).toFixed(0);
    const totalUnits = Math.max(1, p.available_qty + p.wip_qty + p.reserved_qty);
    const availPct = Math.round((p.available_qty / totalUnits) * 100);
    const wipPct = Math.round((p.wip_qty / totalUnits) * 100);
    const resPct = Math.max(0, 100 - availPct - wipPct);

    return (
      <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors group">
        <td className="p-space-sm text-center">
          <input
            className="w-4 h-4 rounded text-primary border-outline-variant/60 cursor-pointer"
            type="checkbox"
            checked={selectedIds.includes(p.id)}
            onChange={() => toggleSelectOne(p.id)}
          />
        </td>
        <td className="p-space-sm">
          <div className="w-14 h-16 rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container relative shrink-0 shadow-sm">
            <img className="w-full h-full object-cover" alt={p.name_ar} src={p.image_url} />
          </div>
        </td>
        <td className="p-space-sm">
          <div className="flex flex-col text-right">
            <Link className="font-label-lg text-label-lg text-primary hover:text-secondary font-semibold transition-colors flex items-center gap-1" href={`/products/${p.id}`}>
              {p.name_ar}
              <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                open_in_new
              </span>
            </Link>
            <span className="text-on-surface-variant font-body-sm text-[12px]">
              {p.model_subtitle}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-outline">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {p.season}
            </div>
          </div>
        </td>
        <td className="p-space-sm">
          <div className="flex flex-col text-right">
            <span className="font-mono font-medium text-primary text-[12px] bg-surface-container px-2 py-0.5 rounded w-fit">
              {p.sku_code}
            </span>
            <span className="text-outline font-data-tabular text-[11px] mt-0.5">
              باركود: {p.barcode}
            </span>
          </div>
        </td>
        <td className="p-space-sm">
          <div className="flex flex-col text-right">
            <span className="font-medium text-on-surface">{p.category_ar}</span>
            <span className="text-on-surface-variant text-[11px]">{p.fabric_spec}</span>
          </div>
        </td>
        <td className="p-space-sm">
          <div className="flex flex-col gap-1 text-right">
            <div className="flex items-center gap-1">
              {colors.map((c, idx) => (
                <span
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-outline-variant/40"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              <span className="text-[11px] text-outline font-data-tabular">
                ({colors.length} ألوان)
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {(p.sizes || []).map((sz) => (
                <span
                  key={sz}
                  className="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] font-mono text-primary"
                >
                  {sz}
                </span>
              ))}
            </div>
          </div>
        </td>
        <td className="p-space-sm text-left font-data-tabular">
          {canViewCost ? (
            <div className="flex flex-col items-end">
              <span className="font-semibold text-primary">
                {Number(p.cost_price).toFixed(2)} ج.م
              </span>
              <span className="text-[10px] text-outline">
                خامات: {p.raw_cost} | تشغيل: {p.labor_cost}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-outline font-semibold">محجوب (RBAC)</span>
          )}
        </td>
        <td className="p-space-sm text-left font-data-tabular">
          <span className="font-medium text-on-surface">
            {Number(p.wholesale_price).toFixed(2)} ج.م
          </span>
        </td>
        <td className="p-space-sm text-left font-data-tabular">
          <span className="font-bold text-primary">
            {Number(p.retail_price).toFixed(2)} ج.م
          </span>
        </td>
        <td className="p-space-sm text-center">
          {canViewCost ? (
            <div className="flex flex-col items-center">
              <span className="font-semibold text-[#16A36A] font-data-tabular text-[13px] bg-[#E8F8F0] border border-[#B8E8D2] px-2 py-0.5 rounded-full">
                +{marginPct}%
              </span>
              <span className="text-[10px] text-outline mt-0.5">
                هامش صافي {netMargin} ج.م
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-outline">--</span>
          )}
        </td>
        <td className="p-space-sm">
          <div className="flex flex-col text-right gap-1">
            <div className="flex items-center justify-between text-[11px] font-data-tabular">
              <span className={p.status === "LOW_STOCK" ? "text-[#E6A23C] font-semibold" : "text-[#16A36A] font-semibold"}>
                متاح: {p.available_qty.toLocaleString()}
              </span>
              <span className="text-outline">
                WIP: {p.wip_qty.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden flex">
              <div className="bg-[#16A36A] h-full" style={{ width: `${availPct}%` }} title="جاهز ومتاح" />
              <div className="bg-secondary h-full" style={{ width: `${wipPct}%` }} title="تحت التشغيل WIP" />
              <div className="bg-[#E6A23C] h-full" style={{ width: `${resPct}%` }} title="محجوز للعملاء" />
            </div>
            <span className="text-[10px] text-on-surface-variant font-data-tabular">
              محجوز: {p.reserved_qty.toLocaleString()} قطعة
            </span>
          </div>
        </td>
        <td className="p-space-sm text-center">
          {p.status === "IN_STOCK" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-[#E8F8F0] text-[#16A36A] border border-[#B8E8D2]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
              نشط بالمبيعات
            </span>
          ) : p.status === "LOW_STOCK" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-[#FEF6EB] text-[#E6A23C] border border-[#FCDFB0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E6A23C]" />
              منخفض المخزون
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-secondary/10 text-secondary border border-secondary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              قيد الإنتاج المكثف
            </span>
          )}
        </td>
        <td className="p-space-sm text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() =>
                openModal({
                  type: "tech_pack_view",
                  title: `المواصفة الهندسية: ${p.name_ar} (${p.sku_code})`,
                  description: `${p.fabric_spec} — ${p.season}`,
                })
              }
              className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
              title="تفاصيل الصنف وشجرة المواد BOM"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </button>
            <Link
              href={`/products/${p.id}`}
              className="p-1 text-on-surface-variant hover:text-secondary hover:bg-surface-container rounded transition-colors"
              title="تعديل الموديل والتسعير"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </Link>
            <button
              onClick={() => showToast("info", `طباعة باركود ${p.sku_code}`, `الباركود الدولي: ${p.barcode}`)}
              className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
              title="طباعة كود التتبع والباركود"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
            </button>
            <button
              onClick={() => handleDeleteProduct(p.id, p.name_ar)}
              className="p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors"
              title="حذف الموديل من الكتالوج"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    );
  })
)}
</tbody>
</table>
</div>
{/*  Advanced Pagination and Summary Footer  */}
<div className="p-space-md bg-surface-container-low/50 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm">
<div className="flex items-center gap-space-xs">
<span>
عرض
</span>
<select defaultValue="25" className="h-8 px-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-right font-data-tabular">
<option value="15">
15
</option>
<option value="25">
25
</option>
<option value="50">
50
</option>
<option value="100">
100
</option>
</select>
<span>
عنصر لكل صفحة
</span>
</div>
<span className="text-outline">
|
</span>
<span className="font-data-tabular">
عرض 1 - {filteredProducts.length} من إجمالي {products.length} منتج مسجل
</span>
</div>
<div className="flex items-center gap-space-xs">
<button className="h-8 px-space-sm rounded bg-surface-container-lowest border border-outline-variant/30 text-outline cursor-not-allowed flex items-center justify-center font-label-sm" disabled={true} type="button">
<span className="material-symbols-outlined text-[16px]">
arrow_forward_ios
</span>
<span>
السابق
</span>
</button>
<button className="h-8 w-8 rounded bg-primary text-on-primary font-label-sm flex items-center justify-center font-data-tabular shadow-sm" type="button">
1
</button>
<button className="h-8 w-8 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container font-label-sm flex items-center justify-center font-data-tabular transition-colors" type="button">
2
</button>
<button className="h-8 w-8 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container font-label-sm flex items-center justify-center font-data-tabular transition-colors" type="button">
3
</button>
<span className="px-1 text-outline">
...
</span>
<button className="h-8 w-8 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container font-label-sm flex items-center justify-center font-data-tabular transition-colors" type="button">
6
</button>
<button className="h-8 px-space-sm rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container cursor-pointer flex items-center justify-center font-label-sm transition-colors" type="button">
<span>
التالي
</span>
<span className="material-symbols-outlined text-[16px]">
arrow_back_ios
</span>
</button>
</div>
</div>
</div>
{/*  Quick Production Insight & Color Matrix Secondary Card  */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
{/*  Matrix Helper 1: Category Distribution  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-sm">
<h2 className="font-headline-md text-headline-md text-primary">
توزيع الموديلات حسب الفئة
</h2>
<span className="material-symbols-outlined text-outline text-[20px]">
pie_chart
</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
نسب الأصناف المتوفرة داخل خطة تصنيع موسم 2024
</p>
<div className="space-y-space-sm">
<div>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface mb-1">
<span>
تيشيرتات وبولو قطن رجالي
</span>
<span className="font-data-tabular">
54 موديل (38%)
</span>
</div>
<div className="w-full h-2 rounded bg-surface-container overflow-hidden">
<div className="h-full bg-primary" style={{"width":"38%"}}></div>
</div>
</div>
<div>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface mb-1">
<span>
أزياء حريمي وتوب ليكرا
</span>
<span className="font-data-tabular">
42 موديل (30%)
</span>
</div>
<div className="w-full h-2 rounded bg-surface-container overflow-hidden">
<div className="h-full bg-secondary" style={{"width":"30%"}}></div>
</div>
</div>
<div>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface mb-1">
<span>
بناطيل وشورتات كاجوال
</span>
<span className="font-data-tabular">
28 موديل (20%)
</span>
</div>
<div className="w-full h-2 rounded bg-surface-container overflow-hidden">
<div className="h-full bg-secondary-fixed-variant" style={{"width":"20%"}}></div>
</div>
</div>
<div>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface mb-1">
<span>
يونيفورم وملابس شركات B2B
</span>
<span className="font-data-tabular">
18 موديل (12%)
</span>
</div>
<div className="w-full h-2 rounded bg-surface-container overflow-hidden">
<div className="h-full bg-outline" style={{"width":"12%"}}></div>
</div>
</div>
</div>
</div>
<div className="pt-space-md mt-space-md border-t border-outline-variant/30 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">
الكتالوجات المصدرة المعتمدة
</span>
<span className="font-label-md text-label-md text-primary font-semibold">
4 ملفات نشطة
</span>
</div>
</div>
{/*  Matrix Helper 2: Production Cost Structure Breakdown  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-sm">
<h2 className="font-headline-md text-headline-md text-primary">
هيكل تكلفة القطعة المعياري
</h2>
<span className="material-symbols-outlined text-outline text-[20px]">
account_balance_wallet
</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
المتوسط الموزون لتكلفة إنتاج التيشيرت الصيفي (70 ج.م)
</p>
<div className="space-y-space-sm">
<div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
<div className="flex items-center gap-space-xs">
<span className="w-3 h-3 rounded-full bg-primary"></span>
<span className="font-body-sm text-body-sm">
غزول وأقمشة خام (قطن ممشط)
</span>
</div>
<span className="font-data-tabular font-semibold text-primary">
38.50 ج.م (55%)
</span>
</div>
<div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
<div className="flex items-center gap-space-xs">
<span className="w-3 h-3 rounded-full bg-secondary"></span>
<span className="font-body-sm text-body-sm">
أجور حياكة وقص مباشرة
</span>
</div>
<span className="font-data-tabular font-semibold text-primary">
15.40 ج.م (22%)
</span>
</div>
<div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
<div className="flex items-center gap-space-xs">
<span className="w-3 h-3 rounded-full bg-[#E6A23C]"></span>
<span className="font-body-sm text-body-sm">
تطريز، طباعة الشعار، وإكسسوارات
</span>
</div>
<span className="font-data-tabular font-semibold text-primary">
9.10 ج.م (13%)
</span>
</div>
<div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
<div className="flex items-center gap-space-xs">
<span className="w-3 h-3 rounded-full bg-outline"></span>
<span className="font-body-sm text-body-sm">
هدر صناعي وتعبئة وتغليف
</span>
</div>
<span className="font-data-tabular font-semibold text-primary">
7.00 ج.م (10%)
</span>
</div>
</div>
</div>
<div className="pt-space-md mt-space-md border-t border-outline-variant/30 flex items-center justify-between">
<a className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1" href="#">
<span>
تعديل مصفوفة تكاليف BOM
</span>
<span className="material-symbols-outlined text-[14px]">
arrow_back
</span>
</a>
<span className="font-data-tabular text-label-sm text-[#16A36A]">
تحديث دوري: اليوم
</span>
</div>
</div>
{/*  Matrix Helper 3: Quick Inventory Replenishment Alert  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-sm">
<h2 className="font-headline-md text-headline-md text-primary">
تنبيهات نقطة إعادة الطلب
</h2>
<span className="material-symbols-outlined text-error text-[20px]">
notification_important
</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
موديلات تجاوزت حد الأمان وتتطلب إصدار إذن تشغيل
</p>
<div className="space-y-space-xs">
<div className="p-space-sm rounded-lg border border-[#FCDFB0] bg-[#FEF6EB] flex items-center justify-between">
<div className="flex flex-col text-right">
<span className="font-label-md text-label-md text-primary font-semibold">
تيشيرت حريمي رمادي (M)
</span>
<span className="text-[11px] text-on-surface-variant font-data-tabular">
المتبقي: 42 قطعة | حد الأمان: 200
</span>
</div>
<button className="px-space-sm py-1 bg-surface-container-lowest text-primary rounded font-label-sm text-label-sm border border-outline-variant/30 hover:bg-surface-container shadow-xs" type="button">

                أمر تشغيل
              
</button>
</div>
<div className="p-space-sm rounded-lg border border-[#FCDFB0] bg-[#FEF6EB] flex items-center justify-between">
<div className="flex flex-col text-right">
<span className="font-label-md text-label-md text-primary font-semibold">
بولو شيرت كحلي (L)
</span>
<span className="text-[11px] text-on-surface-variant font-data-tabular">
المتبقي: 15 قطعة | حد الأمان: 150
</span>
</div>
<button className="px-space-sm py-1 bg-surface-container-lowest text-primary rounded font-label-sm text-label-sm border border-outline-variant/30 hover:bg-surface-container shadow-xs" type="button">

                أمر تشغيل
              
</button>
</div>
</div>
</div>
<div className="pt-space-md mt-space-md border-t border-outline-variant/30 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">
جدولة التوريد الآلي
</span>
<span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-[#16A36A]">
<span className="w-2 h-2 rounded-full bg-[#16A36A]"></span>
 مفعل تلقائياً
          
</span>
</div>
</div>
</div>
</div>
</div>
</main>
  );
}
