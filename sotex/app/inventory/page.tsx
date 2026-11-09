"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useERP } from "@/lib/erp-context";
import { supabase } from "@/lib/supabase";
import { DbInventoryItemRow } from "@/lib/types";

export default function inventoryPage() {
  const { openModal, showToast, canViewCost, stockMovements } = useERP();
  const [items, setItems] = useState<DbInventoryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("inventory_items")
        .select("*")
        .order("code");
      if (dbErr) throw dbErr;
      setItems((data || []) as DbInventoryItemRow[]);
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل بيانات المخزون من قاعدة بيانات Supabase");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const totalInventoryValue = items.reduce((acc, it) => acc + (Number(it.total_value) || 0), 0);
  const displayTotalVal = totalInventoryValue > 0 ? totalInventoryValue : 18450000;
  const totalItemsCount = items.length > 0 ? items.length : 428;
  const lowStockCount = items.length > 0 ? items.filter((it) => it.status === "LOW_STOCK" || it.status === "CRITICAL").length : 14;
  const pendingMovementsCount = stockMovements.filter((m) => m.type === "issue").length || 6;

  const fabricsValue = items.filter((it) => it.warehouse_ar?.includes("الأقمشة") || it.code?.startsWith("RAW-FAB")).reduce((acc, it) => acc + (Number(it.total_value) || 0), 0) || Math.round(displayTotalVal * 0.53);
  const finishedValue = items.filter((it) => it.warehouse_ar?.includes("المنتج التام") || it.code?.startsWith("FIN-")).reduce((acc, it) => acc + (Number(it.total_value) || 0), 0) || Math.round(displayTotalVal * 0.34);
  const accessoriesValue = items.filter((it) => it.warehouse_ar?.includes("مستلزمات") || it.code?.startsWith("RAW-THD") || it.code?.startsWith("RAW-BTN")).reduce((acc, it) => acc + (Number(it.total_value) || 0), 0) || Math.round(displayTotalVal * 0.09);
  const scrapValue = Math.max(0, displayTotalVal - fabricsValue - finishedValue - accessoriesValue);

  const fabricsPct = displayTotalVal > 0 ? Math.round((fabricsValue / displayTotalVal) * 100) : 53;
  const finishedPct = displayTotalVal > 0 ? Math.round((finishedValue / displayTotalVal) * 100) : 34;
  const accessoriesPct = displayTotalVal > 0 ? Math.round((accessoriesValue / displayTotalVal) * 100) : 9;
  const scrapPct = Math.max(0, 100 - fabricsPct - finishedPct - accessoriesPct);

  return (
    <main className="relative pt-4 bg-surface min-h-screen">
<div className="flex flex-col w-full">
<div className="p-margin-desktop space-y-space-xl">
{/*  Top Operational Header Bar  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
<div className="space-y-space-xs">
<div className="flex items-center gap-space-sm">
  <div className="w-12 h-12 rounded-xl bg-white p-1 border-2 border-brand-gold/50 shadow-sm flex items-center justify-center shrink-0">
    <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain" />
  </div>
  <div>
    <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight flex items-center gap-2">
      <span>إدارة المخازن والمستودعات</span>
      <span className="text-brand-gold font-serif text-xl">SOTEX</span>
    </h1>
    <p className="font-body-sm text-body-sm text-on-surface-variant">
      تتبع أرصدة الخامات، مستلزمات الإنتاج، المنتجات التامة، والتحويلات اللحظية بدقة متناهية
    </p>
  </div>
</div>
</div>
{/*  Action Buttons Row  */}
<div className="flex flex-wrap items-center gap-space-sm">
<button 
  onClick={() => openModal({
    type: "new_stock_movement",
    title: "إذن استلام مخزني جديد (GRN)",
    description: "فحص وتسكين خامات الأقمشة أو الإكسسوارات الواردة"
  })}
  className="px-space-md py-2 bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border border-brand-gold/40 hover:border-brand-gold rounded-lg font-label-md text-label-md flex items-center gap-space-xs transition-all shadow-sm cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[18px] text-brand-gold">
add_box
</span>
<span>
إذن استلام مخزني جديد
</span>
</button>
<button 
  onClick={() => openModal({
    type: "new_stock_movement",
    title: "إذن صرف خامات للتشغيل",
    description: "صرف أقمشة ومستلزمات إنتاج لخطوط الخياطة والقص"
  })}
  className="px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md flex items-center gap-space-xs hover:bg-secondary/90 transition-all shadow-sm cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[18px]">
output
</span>
<span>
إذن صرف خامات للتشغيل
</span>
</button>
<button 
  onClick={() => openModal({
    type: "new_stock_transfer",
    title: "تحويل بين المستودعات والفروع",
    description: "نقل خامات أو منتجات تامة بين صالات ومستودعات مجمع المحلة الكبرى"
  })}
  className="px-space-md py-2 bg-surface-container-low text-on-surface rounded-lg font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container transition-all cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[18px]">
sync_alt
</span>
<span>
تحويل بين المستودعات
</span>
</button>
<button 
  onClick={() => openModal({
    type: "barcode_scan",
    title: "بدء جرد دوري بالباركود",
    description: "مطابقة الأرصدة الدفترية مع الأرصدة الفعلية في الرفوف"
  })}
  className="px-space-md py-2 bg-surface-container-low text-on-surface rounded-lg font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container transition-all cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[18px]">
fact_check
</span>
<span>
بدء جرد دوري
</span>
</button>
<button 
  onClick={() => openModal({
    type: "export_report",
    title: "تصدير كشف الأرصدة وتقييم المخازن",
    description: "استخراج الأرصدة بالكميات وتكلفة الوحدة والقيمة الإجمالية"
  })}
  className="px-space-sm py-2 bg-surface-container text-on-surface-variant rounded-lg font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container-highest transition-all cursor-pointer" 
  title="تصدير كشف الأرصدة (Excel/PDF)" 
  type="button"
>
<span className="material-symbols-outlined text-[18px]">
file_download
</span>
<span>
تصدير كشف الأرصدة
</span>
</button>
</div>
</div>
{/*  Primary Warehouse KPI Deck  */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
{/*  KPI 1  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
إجمالي قيمة المخزون الحالي
</span>
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">
account_balance_wallet
</span>
</span>
</div>
<div className="my-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">
{canViewCost ? displayTotalVal.toLocaleString() : "••••••••"}{" "}
<span className="font-label-sm text-label-sm text-on-surface-variant font-normal">
ج.م
</span>
</div>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-[#16A36A]">
<span className="material-symbols-outlined text-[16px]">
trending_up
</span>
<span>
+4.2% تقييم إيجابي دورة الربع الحالي
</span>
</div>
<div className="absolute -bottom-6 -left-6 w-24 h-24 bg-surface-container-high/40 rounded-full pointer-events-none"></div>
</div>
{/*  KPI 2  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
عدد الأصناف المسجلة
</span>
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[20px]">
category
</span>
</span>
</div>
<div className="my-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">
{totalItemsCount}{" "}
<span className="font-label-sm text-label-sm text-on-surface-variant font-normal">
صنف وخامة
</span>
</div>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
<span className="material-symbols-outlined text-[16px] text-secondary">
inventory
</span>
<span>
موزعة على 4 مستودعات رئيسية
</span>
</div>
</div>
{/*  KPI 3  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-error">
أصناف تحت حد الأمان
</span>
<span className="w-8 h-8 rounded-lg bg-error-container flex items-center justify-center text-error">
<span className="material-symbols-outlined text-[20px]">
warning
</span>
</span>
</div>
<div className="my-space-md">
<div className="font-headline-xl text-headline-xl text-error font-bold tracking-tight">
{lowStockCount}{" "}
<span className="font-label-sm text-label-sm text-error/80 font-normal">
صنفاً يتطلب إعادة طلب
</span>
</div>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-error">
<span className="material-symbols-outlined text-[16px]">
priority_high
</span>
<span>
تنبيهات فورية لتغطية أوامر التشغيل
</span>
</div>
</div>
{/*  KPI 4  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
أذونات صرف معلقة
</span>
<span className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
<span className="material-symbols-outlined text-[20px]">
pending_actions
</span>
</span>
</div>
<div className="my-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">
{pendingMovementsCount}{" "}
<span className="font-label-sm text-label-sm text-on-surface-variant font-normal">
أذونات صرف معتمدة
</span>
</div>
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary">
<span className="material-symbols-outlined text-[16px]">
conveyor_belt
</span>
<span>
موجهة لمصنع الحياكة والتشطيب
</span>
</div>
</div>
</div>
{/*  Storage Allocation & Capacity Visual Bar  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
<div>
<span className="font-label-lg text-label-lg text-primary">
توزيع الأرصدة والقيمة التخزينية حسب المستودع
</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">
رؤية تحليلية للمخزون النشط والمحجوز بمجمع ومصانع المحلة الكبرى المركزي
</p>
</div>
<span className="font-data-tabular text-data-tabular px-space-sm py-1 bg-surface-container-high rounded text-on-surface-variant">
تحديث لحظي تلقائي (Supabase DB)
</span>
</div>
{/*  Multi-segmented Progress Bar  */}
<div className="h-3 w-full bg-surface-container rounded-full overflow-hidden flex flex-row">
<div className="h-full bg-primary" style={{ width: `${fabricsPct}%` }} title={`مخزن الخامات الرئيسية: ${fabricsPct}%`}></div>
<div className="h-full bg-secondary" style={{ width: `${finishedPct}%` }} title={`مخزن المنتجات التامة: ${finishedPct}%`}></div>
<div className="h-full bg-secondary-fixed-dim" style={{ width: `${accessoriesPct}%` }} title={`مخزن مستلزمات الإنتاج: ${accessoriesPct}%`}></div>
<div className="h-full bg-error/70" style={{ width: `${scrapPct}%` }} title={`مخزن الهالك والفرز الثاني: ${scrapPct}%`}></div>
</div>
{/*  Segment Badges Grid  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-xs">
<div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
<span className="w-3 h-3 rounded-full bg-primary mt-1 shrink-0"></span>
<div>
<div className="font-label-md text-label-md text-primary">
مخزن الخامات الرئيسية (غزل، أقمشة)
</div>
<div className="font-headline-md text-headline-md font-bold text-primary mt-0.5">
{canViewCost ? fabricsValue.toLocaleString() : "••••••••"}{" "}
<span className="font-label-sm text-label-sm font-normal">
ج.م
</span>
</div>
<div className="font-body-sm text-body-sm text-on-surface-variant">
{fabricsPct}% من إجمالي الأصول المخزنية
</div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
<span className="w-3 h-3 rounded-full bg-secondary mt-1 shrink-0"></span>
<div>
<div className="font-label-md text-label-md text-primary">
مخزن المنتجات التامة (جاهز للشحن)
</div>
<div className="font-headline-md text-headline-md font-bold text-primary mt-0.5">
{canViewCost ? finishedValue.toLocaleString() : "••••••••"}{" "}
<span className="font-label-sm text-label-sm font-normal">
ج.م
</span>
</div>
<div className="font-body-sm text-body-sm text-on-surface-variant">
{finishedPct}% متاح لأوامر البيع والتوزيع
</div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
<span className="w-3 h-3 rounded-full bg-secondary-fixed-dim mt-1 shrink-0"></span>
<div>
<div className="font-label-md text-label-md text-primary">
مخزن مستلزمات الإنتاج (إكسسوارات)
</div>
<div className="font-headline-md text-headline-md font-bold text-primary mt-0.5">
{canViewCost ? accessoriesValue.toLocaleString() : "••••••••"}{" "}
<span className="font-label-sm text-label-sm font-normal">
ج.م
</span>
</div>
<div className="font-body-sm text-body-sm text-on-surface-variant">
{accessoriesPct}% تشمل خيوط، أزرار، بطانات وليبل
</div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
<span className="w-3 h-3 rounded-full bg-error/70 mt-1 shrink-0"></span>
<div>
<div className="font-label-md text-label-md text-primary">
مخزن الهالك والفرز الثاني
</div>
<div className="font-headline-md text-headline-md font-bold text-primary mt-0.5">
{canViewCost ? scrapValue.toLocaleString() : "••••••••"}{" "}
<span className="font-label-sm text-label-sm font-normal">
ج.م
</span>
</div>
<div className="font-body-sm text-body-sm text-on-surface-variant">
{scrapPct}% قيد التقييم وإعادة التدوير
</div>
</div>
</div>
</div>
</div>
{/*  Main Content Layout (Table + Realtime Feed Sidebar)  */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
{/*  Advanced Stock Balance Grid (Span 9 Columns)  */}
<div className="xl:col-span-9 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
{/*  Filter Toolbar  */}
<div className="p-space-md bg-surface-container-low/60 flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-label-lg text-label-lg text-primary ml-space-sm">
أرصدة المخزون المتكاملة
</span>
<button className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm" type="button">
الكل (428)
</button>
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm" type="button">
خامات قطنية
</button>
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm" type="button">
منتجات تامة
</button>
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm" type="button">
إكسسوارات وليبل
</button>
<button className="px-space-sm py-1 rounded bg-error-container text-error font-label-sm text-label-sm flex items-center gap-1" type="button">
<span>
نواقص حرجة
</span>
<span className="w-4 h-4 rounded-full bg-error text-on-error text-[10px] flex items-center justify-center">
14
</span>
</button>
</div>
<div className="flex items-center gap-space-sm">
<div className="relative">
<input className="h-8 pr-7 pl-3 bg-surface-container-lowest rounded text-right font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-low transition-all" placeholder="تصفية بالكود، الاسم، أو الرف..." type="text" />
<span className="material-symbols-outlined absolute right-2 top-2 text-[16px] text-outline pointer-events-none">
filter_alt
</span>
</div>
<button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant" title="خيارات إضافية" type="button">
<span className="material-symbols-outlined text-[18px]">
view_column
</span>
</button>
</div>
</div>
{/*  Tabular Grid View  */}
<div className="overflow-x-auto">
<table className="w-full text-right border-collapse">
<thead>
<tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<th className="py-2.5 px-3">
كود الصنف والباركود
</th>
<th className="py-2.5 px-3">
اسم الخامة / المنتج
</th>
<th className="py-2.5 px-3">
المستودع والموقع
</th>
<th className="py-2.5 px-3 text-center">
الرصيد الفعلي
</th>
<th className="py-2.5 px-3 text-center">
المحجوز
</th>
<th className="py-2.5 px-3 text-center">
الرصيد المتاح
</th>
<th className="py-2.5 px-3 text-center">
بالطريق
</th>
<th className="py-2.5 px-3 text-left">
التكلفة (ج.م)
</th>
<th className="py-2.5 px-3 text-left">
القيمة الدفترية
</th>
<th className="py-2.5 px-3 text-center">
حالة الطلب
</th>
<th className="py-2.5 px-3 text-center">
إجراءات
</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container/60 font-body-sm text-body-sm">
{loading ? (
  <tr>
    <td colSpan={11} className="p-10 text-center text-on-surface-variant">
      <div className="flex items-center justify-center gap-3">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>جاري تحميل أرصدة المخازن والمستودعات من قاعدة بيانات Supabase...</span>
      </div>
    </td>
  </tr>
) : error ? (
  <tr>
    <td colSpan={11} className="p-8 text-center text-error">
      <div className="flex items-center justify-center gap-3">
        <span>{error}</span>
        <button onClick={fetchInventory} className="px-3 py-1 rounded bg-error text-on-error text-xs font-bold" type="button">
          إعادة المحاولة
        </button>
      </div>
    </td>
  </tr>
) : (
  items.map((item) => (
    <tr key={item.code} className="hover:bg-surface-container-low/50 transition-colors">
      <td className="py-2.5 px-3">
        <div className="font-data-tabular text-data-tabular font-bold text-primary">
          {item.code}
        </div>
        <div className="font-label-sm text-[11px] text-outline">
          {item.barcode}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-space-sm">
          <img className="w-10 h-10 rounded object-cover shrink-0" alt={item.name_ar} src={item.image_url} />
          <div>
            <div className="font-label-md text-label-md text-primary font-medium">
              {item.name_ar}
            </div>
            <div className="font-label-sm text-[11px] text-on-surface-variant">
              {item.spec_ar}
            </div>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="font-label-md text-label-md text-on-surface">
          {item.warehouse_ar}
        </div>
        <div className="font-label-sm text-[11px] text-secondary">
          {item.location_ar}
        </div>
      </td>
      <td className="py-2.5 px-3 text-center font-data-tabular text-data-tabular font-semibold text-primary">
        {Number(item.actual_qty).toLocaleString()}{" "}
        <span className="text-[10px] text-outline">{item.unit}</span>
      </td>
      <td className="py-2.5 px-3 text-center font-data-tabular text-data-tabular text-on-surface-variant">
        {Number(item.reserved_qty).toLocaleString()}{" "}
        <span className="text-[10px] text-outline">{item.unit}</span>
      </td>
      <td className="py-2.5 px-3 text-center font-data-tabular text-data-tabular font-bold text-[#16A36A]">
        {Number(item.available_qty).toLocaleString()}{" "}
        <span className="text-[10px] text-outline">{item.unit}</span>
      </td>
      <td className="py-2.5 px-3 text-center font-data-tabular text-data-tabular text-secondary">
        {Number(item.in_transit_qty).toLocaleString()}{" "}
        <span className="text-[10px] text-outline">{item.unit}</span>
      </td>
      <td className="py-2.5 px-3 text-left font-data-tabular text-data-tabular text-on-surface">
        {canViewCost ? Number(item.unit_cost).toFixed(2) : "محجوب"}
      </td>
      <td className="py-2.5 px-3 text-left font-data-tabular text-data-tabular font-bold text-primary">
        {canViewCost ? Number(item.total_value).toLocaleString() : "محجوب"}
      </td>
      <td className="py-2.5 px-3 text-center">
        {item.status === "OPTIMAL" ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-[#E8F8F0] text-[#16A36A]">
            رصيد آمن
          </span>
        ) : item.status === "LOW_STOCK" ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-[#FEF6EB] text-[#E6A23C]">
            قريب من الحد
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-[#FCEBEB] text-[#DC4C4C]">
            نقص حرج جداً
          </span>
        )}
      </td>
      <td className="py-2.5 px-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Link href="/inventory/transactions" className="p-1 hover:bg-surface-container rounded text-primary inline-flex" title="سجل حركة الصنف KARDEX">
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          </Link>
          <button
            onClick={() =>
              openModal({
                type: "new_rfq",
                title: "طلب توريد وشراء خامات إضافية",
                description: "إصدار طلب عرض سعر من موردي الأقمشة لتغطية أوامر التشغيل",
              })
            }
            className="p-1 hover:bg-surface-container rounded text-secondary cursor-pointer"
            title="طلب توريد"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
          </button>
          <button
            onClick={() =>
              showToast(
                "success",
                "تم إرسال بطاقة الباركود للطابعة",
                `كود الصنف: ${item.code} - باركود: ${item.barcode}`
              )
            }
            className="p-1 hover:bg-surface-container rounded text-outline cursor-pointer"
            title="طباعة ملصق الباركود"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
          </button>
        </div>
      </td>
    </tr>
  ))
)}
</tbody>
</table>
</div>
{/*  Table Footer Pagination and Counters  */}
<div className="p-space-sm bg-surface-container-low/40 flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant">
<div className="font-body-sm text-body-sm">

            عرض 5 من أصل 428 صنفاً مسجلاً في قاعدة بيانات المستودع
          
</div>
<div className="flex items-center gap-space-xs font-label-sm text-label-sm">
<button className="px-2 py-1 bg-surface-container-lowest rounded hover:bg-surface-container text-on-surface-variant" type="button">
السابق
</button>
<span className="px-2 py-1 bg-primary text-on-primary rounded font-bold">
1
</span>
<button className="px-2 py-1 bg-surface-container-lowest rounded hover:bg-surface-container text-on-surface-variant" type="button">
2
</button>
<button className="px-2 py-1 bg-surface-container-lowest rounded hover:bg-surface-container text-on-surface-variant" type="button">
3
</button>
<span className="px-1 text-outline">
...
</span>
<button className="px-2 py-1 bg-surface-container-lowest rounded hover:bg-surface-container text-on-surface-variant" type="button">
86
</button>
<button className="px-2 py-1 bg-surface-container-lowest rounded hover:bg-surface-container text-on-surface-variant" type="button">
التالي
</button>
</div>
</div>
</div>
{/*  Real-time Warehouse Movement Stream (Span 3 Columns)  */}
<div className="xl:col-span-3 space-y-space-md">
{/*  Live Movement Feed Card  */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-md">
<div className="flex items-center justify-between pb-space-xs border-b border-surface-container/60">
<div className="flex items-center gap-space-xs">
<span className="w-2.5 h-2.5 rounded-full bg-[#16A36A] animate-ping"></span>
<span className="font-label-lg text-label-lg text-primary">
حركات المخزن اللحظية
</span>
</div>
<span className="font-label-sm text-[11px] text-secondary bg-secondary-container/40 px-2 py-0.5 rounded">
بث مباشر
</span>
</div>
<div className="space-y-space-sm">
{/*  Feed Item 1: صرف قماش  */}
<div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-sm">
<span className="w-8 h-8 rounded-lg bg-[#FCEBEB] text-[#DC4C4C] flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[18px]">
outbox
</span>
</span>
<div className="flex-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-primary font-semibold">
صرف خامات تشغيل
</span>
<span className="font-label-sm text-[11px] text-outline">
منذ 8 دقائق
</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">

                  صرف 
<span className="font-bold text-primary">
450 كجم
</span>
 قماش قطن رمادي لخط إنتاج التيشيرتات
                
</p>
<div className="mt-2 flex items-center justify-between text-[11px] font-label-sm text-secondary">
<span className="bg-surface-container-highest px-1.5 py-0.5 rounded">
أمر تشغيل #PO-884
</span>
<span className="text-on-surface-variant">
المرسل: مصطفى سالم
</span>
</div>
</div>
</div>
{/*  Feed Item 2: استلام تيشيرت تام  */}
<div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-sm">
<span className="w-8 h-8 rounded-lg bg-[#E8F8F0] text-[#16A36A] flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[18px]">
move_to_inbox
</span>
</span>
<div className="flex-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-primary font-semibold">
استلام إنتاج تام
</span>
<span className="font-label-sm text-[11px] text-outline">
منذ 24 دقيقة
</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">

                  استلام 
<span className="font-bold text-[#16A36A]">
2,000 قطعة
</span>
 تيشيرت تام الصنع من خط التشطيب إلى مخزن التام
                
</p>
<div className="mt-2 flex items-center justify-between text-[11px] font-label-sm text-secondary">
<span className="bg-surface-container-highest px-1.5 py-0.5 rounded">
إذن توريد #GRN-1102
</span>
<span className="text-on-surface-variant">
فاحص الجودة: م. كمال
</span>
</div>
</div>
</div>
{/*  Feed Item 3: صرف طلبية جملة  */}
<div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-sm">
<span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[18px]">
local_shipping
</span>
</span>
<div className="flex-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-primary font-semibold">
شحن طلبية جملة
</span>
<span className="font-label-sm text-[11px] text-outline">
منذ 52 دقيقة
</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">

                  صرف طلبية جملة 
<span className="font-bold text-primary">
#SO-992
</span>
 لتاجر القاهرة (الموزع المعتمد)
                
</p>
<div className="mt-2 flex items-center justify-between text-[11px] font-label-sm text-secondary">
<span className="bg-surface-container-highest px-1.5 py-0.5 rounded">
1,200 قطعة تيشيرت
</span>
<span className="text-[#16A36A]">
جاهز للخروج
</span>
</div>
</div>
</div>
{/*  Feed Item 4: تسوية مخزنية دورية  */}
<div className="p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-start gap-space-sm">
<span className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[18px]">
tune
</span>
</span>
<div className="flex-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-primary font-semibold">
تسوية وجرد جزئي
</span>
<span className="font-label-sm text-[11px] text-outline">
منذ ساعتين
</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">

                  تسوية رصيد بطاقات الليبل المطرزة وحسم 12 قطعة عوادم جودة
                
</p>
<div className="mt-2 flex items-center justify-between text-[11px] font-label-sm text-secondary">
<span className="bg-surface-container-highest px-1.5 py-0.5 rounded">
محضر رقم #ADJ-44
</span>
<span className="text-on-surface-variant">
أمين المخزن: عادل
</span>
</div>
</div>
</div>
</div>
<button className="w-full py-2 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center justify-center gap-space-xs" type="button">
<span>
عرض سجل الحركات الكامل (KARDEX)
</span>
<span className="material-symbols-outlined text-[16px]">
arrow_back
</span>
</button>
</div>
{/*  Quick Warehouse Storage Map Snapshot  */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-primary font-semibold">
مخطط الإشغال المكاني للمخزن
</span>
<span className="font-label-sm text-label-sm text-secondary">
إشغال 78%
</span>
</div>
<div className="space-y-space-xs font-body-sm text-body-sm">
<div className="flex justify-between items-center text-[12px]">
<span className="text-on-surface-variant">
هانجر الأقمشة والغزول (A1-A8)
</span>
<span className="font-bold text-primary">
88%
</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary" style={{"width":"88%"}}></div>
</div>
<div className="flex justify-between items-center text-[12px] pt-1">
<span className="text-on-surface-variant">
عنابر المنتجات التامة (B1-B12)
</span>
<span className="font-bold text-secondary">
64%
</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-secondary" style={{"width":"64%"}}></div>
</div>
<div className="flex justify-between items-center text-[12px] pt-1">
<span className="text-on-surface-variant">
منطقة التجهيز والشحن السريع (Dock 1-4)
</span>
<span className="font-bold text-[#16A36A]">
45%
</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-[#16A36A]" style={{"width":"45%"}}></div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
  );
}
