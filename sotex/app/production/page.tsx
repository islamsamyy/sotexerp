"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useERP } from "@/lib/erp-context";
import { supabase } from "@/lib/supabase";

export default function production_ordersPage() {
  const { openModal, showToast, workOrders, isLoading, refreshData } = useERP();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [lines, setLines] = useState<any[]>([]);
  const [bomList, setBomList] = useState<any[]>([]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      showToast("success", "تم تحديث بيانات الإنتاج والتشغيل بنجاح");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [linesRes, bomRes] = await Promise.all([
          supabase.from("production_lines").select("*").order("line_code"),
          supabase.from("bom_items").select("*").limit(6),
        ]);
        if (linesRes.data) setLines(linesRes.data);
        if (bomRes.data) setBomList(bomRes.data);
      } catch (e) {
        // fallback
      }
    }
    loadData();
  }, []);

  const activeOrdersCount = workOrders.filter((w) => w.status !== "completed").length || 18;
  const plannedWeekly = workOrders.reduce((acc, w) => acc + (Number(w.targetQty) || 0), 0) || 45000;
  const completedWeekly = workOrders.reduce((acc, w) => acc + (Number(w.completedQty) || 0), 0) || 38250;
  const completionPct = plannedWeekly > 0 ? ((completedWeekly / plannedWeekly) * 100).toFixed(1) : "85.0";
  const oeeAvg = lines.length > 0
    ? (lines.reduce((acc, l) => acc + Number(l.overall_oee || 85), 0) / lines.length).toFixed(1) + "%"
    : "89.2%";
  const defectRate = "1.2%";
  const budgetCommitment = "98.4%";

  const filteredOrders = workOrders.filter((wo) => {
    const code = wo.code || wo.id || "";
    const name = wo.productNameAr || wo.productName || "";
    const sku = wo.sku || "";
    const line = wo.lineNameAr || wo.line || "";

    const matchSearch =
      !searchTerm ||
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.includes(searchTerm) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter =
      selectedFilter === "all" || line.includes(selectedFilter);
    return matchSearch && matchFilter;
  });

  return (
    <main className="relative pt-4 bg-surface min-h-screen">
<div className="flex flex-col w-full">
<div className="p-margin-desktop space-y-space-xl">
{/*  Header Section  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
<div className="flex items-start gap-3.5">
  <div className="w-12 h-12 rounded-xl bg-white p-1 border-2 border-brand-gold/50 shadow-sm flex items-center justify-center shrink-0">
    <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain" />
  </div>
  <div className="space-y-space-xs">
    <div className="flex items-center gap-space-xs">
      <span className="px-2 py-0.5 bg-brand-gold/15 text-brand-bronze border border-brand-gold/30 rounded font-bold text-xs">
        سوتكس • وحدة تصنيع العاشر من رمضان
      </span>
      <span className="text-on-surface-variant font-label-sm text-label-sm">
        • المجمع الصناعي رقم 4
      </span>
    </div>
    <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight flex items-center gap-2">
      <span>إدارة أوامر وتشغيل خطوط الإنتاج</span>
      <span className="text-brand-gold font-serif text-2xl">SOTEX</span>
    </h1>
    <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
      متابعة خطوط الخياطة، القص، التجميع، واستهلاك الخامات وقوائم المواد BOM الفورية للدفعة الحالية
    </p>
  </div>
</div>
<div className="flex flex-wrap items-center gap-space-sm">
<button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="h-10 px-space-sm bg-surface-container-lowest text-primary rounded-lg font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container shadow-sm transition-all cursor-pointer"
  title="تحديث البيانات"
  type="button"
>
  <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? "animate-spin text-brand-gold" : ""}`}>
    refresh
  </span>
  <span className="hidden sm:inline">تحديث</span>
</button>
<button 
  onClick={() => openModal({
    type: "shift_redirect",
    title: "جدولة ورديات العمل وتوزيع الفنيين",
    description: "إعادة توزيع العمالة بين خطوط القص والخياطة والكي"
  })}
  className="h-10 px-space-md bg-surface-container-lowest text-primary rounded-lg font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container shadow-sm transition-all" 
  type="button"
>
<span className="material-symbols-outlined text-[18px]">
calendar_today
</span>
<span>
جدولة ورديات العمل
</span>
</button>
<Link 
  href="/production/planning"
  className="h-10 px-space-md bg-surface-container-lowest text-primary rounded-lg font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container shadow-sm transition-all" 
>
<span className="material-symbols-outlined text-[18px]">
view_timeline
</span>
<span>
تخطيط Gantt
</span>
</Link>
<button 
  onClick={() => openModal({
    type: "export_report",
    title: "تقرير تكلفة الإنتاج الفعلي والتشغيل",
    description: "استخراج تفصيلي لتكلفة الخامات والأجور المباشرة والتشغيل غير المباشر"
  })}
  className="h-10 px-space-md bg-surface-container-lowest text-primary rounded-lg font-label-md text-label-md flex items-center gap-space-xs hover:bg-surface-container shadow-sm transition-all" 
  type="button"
>
<span className="material-symbols-outlined text-[18px]">
receipt_long
</span>
<span>
تكلفة الإنتاج الفعلي
</span>
</button>
<button 
  onClick={() => openModal({
    type: "new_work_order",
    title: "إصدار أمر إنتاج وتشغيل جديد",
    description: "تحديد خط التشغيل والموديل والكمية المستهدفة"
  })}
  className="h-10 px-space-lg bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border border-brand-gold/40 hover:border-brand-gold rounded-lg font-label-md text-label-md flex items-center gap-space-xs shadow-md transition-all cursor-pointer" 
  type="button"
>
<span className="material-symbols-outlined text-[20px] text-brand-gold">
add_circle
</span>
<span>
+ أمر إنتاج جديد
</span>
</button>
</div>
</div>
{/*  KPI Statistics Deck  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-space-md">
{/*  KPI 1  */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
أوامر الإنتاج النشطة
</span>
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[18px]">
precision_manufacturing
</span>
</span>
</div>
<div className="mt-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold">
{activeOrdersCount}
</div>
<div className="mt-space-xs flex items-center gap-space-xs text-[11px] font-label-sm text-secondary">
<span>
تشغيل فوري في 4 خطوط
</span>
</div>
</div>
</div>
{/*  KPI 2  */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
القطع المخططة أسبوعياً
</span>
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">
assignment
</span>
</span>
</div>
<div className="mt-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold">
{plannedWeekly.toLocaleString()}
</div>
<div className="mt-space-xs flex items-center gap-space-xs text-[11px] font-label-sm text-on-surface-variant">
<span>
الهدف المجدول (W42)
</span>
</div>
</div>
</div>
{/*  KPI 3  */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
القطع المنجزة فعلياً
</span>
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[18px]">
inventory
</span>
</span>
</div>
<div className="mt-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold">
{completedWeekly.toLocaleString()}
</div>
<div className="mt-space-xs flex items-center gap-space-xs text-[11px] font-label-sm text-secondary">
<span className="material-symbols-outlined text-[14px]">
trending_up
</span>
<span className="font-semibold">
{completionPct}% من الإجمالي
</span>
</div>
</div>
</div>
{/*  KPI 4  */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
كفاءة التشغيل OEE
</span>
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">
speed
</span>
</span>
</div>
<div className="mt-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold">
{oeeAvg}
</div>
<div className="mt-space-xs flex items-center gap-space-xs text-[11px] font-label-sm text-secondary">
<span>
+3.1% عن الأسبوع الماضي
</span>
</div>
</div>
</div>
{/*  KPI 5  */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
نسبة الهالك والعيوب
</span>
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[18px]">
verified
</span>
</span>
</div>
<div className="mt-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold">
{defectRate}
</div>
<div className="mt-space-xs flex items-center gap-space-xs text-[11px] font-label-sm text-secondary">
<span>
الحد الأقصى المسموح 2.5%
</span>
</div>
</div>
</div>
{/*  KPI 6  */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface-variant">
الالتزام بالموازنة
</span>
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">
price_check
</span>
</span>
</div>
<div className="mt-space-md">
<div className="font-headline-xl text-headline-xl text-primary font-bold">
{budgetCommitment}
</div>
<div className="mt-space-xs flex items-center gap-space-xs text-[11px] font-label-sm text-on-surface-variant">
<span>
التكلفة الفعلية vs التقديرية
</span>
</div>
</div>
</div>
</div>
{/*  Live Line Monitor & Production Status  */}
<div className="space-y-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
<h2 className="font-headline-md text-headline-md text-primary font-semibold">
حالة خطوط الإنتاج المباشرة (Live Line Monitor)
</h2>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">
تحديث تلقائي كل 15 ثانية (Supabase Live)
</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
{lines.length > 0 ? (
  lines.slice(0, 4).map((line) => {
    const target = Number(line.target_daily || 400);
    const actual = Number(line.actual_daily || 350);
    const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 80;
    return (
      <div key={line.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-xs">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
            </div>
            <div>
              <span className="font-label-lg text-label-lg text-primary block leading-tight">
                {line.line_name}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                مشرف: {line.supervisor}
              </span>
            </div>
          </div>
          <span className="px-space-xs py-[2px] bg-surface-container text-primary font-label-sm text-label-sm rounded font-medium">
            {line.overall_oee}% كفاءة
          </span>
        </div>
        <div className="space-y-space-xs bg-surface-container-low p-space-sm rounded-lg">
          <div className="flex items-center justify-between text-body-sm font-body-sm">
            <span className="text-on-surface-variant">أمر التشغيل:</span>
            <span className="font-semibold text-primary font-data-tabular">#{line.active_order_code}</span>
          </div>
          <div className="flex items-center justify-between text-body-sm font-body-sm">
            <span className="text-on-surface-variant">الصنف:</span>
            <span className="text-primary truncate max-w-[150px]">{line.current_product}</span>
          </div>
          <div className="flex items-center justify-between text-body-sm font-body-sm">
            <span className="text-on-surface-variant">القوة العاملة:</span>
            <span className="text-primary">{line.workers_count} عاملاً</span>
          </div>
        </div>
        <div className="space-y-space-xs">
          <div className="flex items-center justify-between text-label-sm font-label-sm">
            <span className="text-on-surface-variant">المنجز: {actual} / {target} قطعة</span>
            <span className="font-bold text-primary">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
          </div>
        </div>
      </div>
    );
  })
) : (
  <div className="col-span-4 p-8 text-center text-xs text-on-surface-variant bg-surface-container-lowest rounded-xl">
    جاري استدعاء بيانات خطوط الإنتاج والـ OEE...
  </div>
)}
</div>
</div>
{/*  Active Production Order Showcase & BOM Availability split  */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
{/*  Showcase Product Highlight Card (Inspired by User Mockup)  */}
<div className="xl:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between space-y-space-md">
<div>
<div className="flex items-center justify-between mb-space-sm">
<span className="px-space-xs py-[2px] bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm">
أمر التصنيع ذو الأولوية القصوى
</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">
تسليم: 28 أكتوبر 2024
</span>
</div>
<h3 className="font-headline-md text-headline-md text-primary font-bold">
تيشيرت سوِتكس كاجوال بشعار ذهبي فاخر
</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
موديل رقبة دائرية مخصص للتصدير الأوروبي - كود SKU: STX-TSH-NVY-01
</p>
</div>
<div className="relative w-full h-72 rounded-lg overflow-hidden bg-surface-container-low flex items-center justify-center">
<img className="w-full h-full object-cover" data-alt="Editorial catalog shot of a handsome male model wearing a sleek dark navy short-sleeve crewneck cotton t-shirt with a metallic golden logo emblem centered on the chest, studio photography, clean white background, soft natural daylight with crisp shadows, industrial apparel production standard." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQBi2xUWgSjAa-UubJYQBRTeApRoAsJ3T2DpSzQ8O45qLykC5EWtmRj4ZWJ8v51LjtXwLHG1V6KCi6J9CMy4eCiMvLpjfGcnrpuW_Nsz8fx1j-TqbDuk7VGK24Y9vWaNnimVC_BxLczC1lPAHtTCFqvXr3z04sX4ZzdEUTyTJ6m_xubbiTJfegguCGYgiOGGvaCeeq2q87U5V8Lgm_FPTAPmW-2_abw-EkMbu3o7U" />
<div className="absolute bottom-2 right-2 bg-primary/90 text-on-primary backdrop-blur-md px-space-sm py-1 rounded text-label-sm font-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">
palette
</span>
<span>
كحلي داكن (Navy Blue #0E1829)
</span>
</div>
</div>
<div className="space-y-space-xs bg-surface-container-low p-space-sm rounded-lg text-body-sm font-body-sm">
<div className="flex items-center justify-between">
<span className="text-on-surface-variant">
حجم الدفعة التشغيلية:
</span>
<span className="font-semibold text-primary font-data-tabular">
5,000 قطعة
</span>
</div>
<div className="flex items-center justify-between">
<span className="text-on-surface-variant">
الوزن المقدر للمتر المربع:
</span>
<span className="font-data-tabular text-primary">
190 GSM - قطن 100%
</span>
</div>
<div className="flex items-center justify-between">
<span className="text-on-surface-variant">
العميل والمستورد:
</span>
<span className="font-medium text-primary">
مجموعة الفطيم للتجزئة - دبي
</span>
</div>
</div>
</div>
{/*  Bill of Materials (BOM) & Material Stocks  */}
<div className="xl:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-xs">
<div className="flex items-center gap-space-xs">
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">
schema
</span>
</span>
<div>
<h3 className="font-headline-md text-headline-md text-primary font-semibold">
قائمة شجرة المواد وجاهزية المخزون (BOM - Bill of Materials)
</h3>
<span className="font-body-sm text-body-sm text-on-surface-variant">
احتياجات أمر التشغيل النشط #PRD-2024-1042
</span>
</div>
</div>
<button className="px-space-md py-1.5 bg-surface-container text-primary rounded-lg font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-1 self-start sm:self-auto" type="button">
<span className="material-symbols-outlined text-[18px]">
inventory_2
</span>
<span>
طلب صرف خامات إضافي
</span>
</button>
</div>
{/*  Materials Grid  */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md mt-space-md">
{bomList.length > 0 ? (
  bomList.slice(0, 4).map((b) => {
    const avail = Number(b.availability_pct || 100);
    const isWarning = avail < 90;
    return (
      <div key={b.id} className="p-space-md bg-surface-container-low rounded-lg space-y-space-xs">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-lg text-label-lg text-primary block">
              {b.name}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              كود الخامة: {b.product_code || b.id} • {b.item_type_ar || b.item_type}
            </span>
          </div>
          <span className={`px-space-xs py-[2px] rounded font-label-sm text-label-sm ${
            isWarning ? "bg-secondary-container text-on-secondary-container font-medium" : "bg-surface-container text-primary"
          }`}>
            {b.status_label || (avail === 100 ? "متوفر 100%" : `عجز جزئي ${avail}%`)}
          </span>
        </div>
        <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
          <span>الاحتياج: {b.required_qty_str || b.total_for_1000_pieces || "1,250 وحدة"}</span>
          <span className={`font-semibold font-data-tabular ${isWarning ? "text-error" : "text-primary"}`}>
            الرصيد بالمخزن: {b.stock_qty_str || "4,800 وحدة"}
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full ${isWarning ? "bg-secondary" : "bg-primary"} rounded-full`}
            style={{ width: `${avail}%` }}
          ></div>
        </div>
      </div>
    );
  })
) : (
  <div className="col-span-2 p-6 text-center text-xs text-on-surface-variant">
    جاري استدعاء شجرة المواد وجاهزية الخامات...
  </div>
)}
</div>
</div>
<div className="mt-space-md p-space-sm bg-surface-container rounded-lg flex items-center justify-between">
<div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">
local_shipping
</span>
<span>
إذن شراء كراتين التعبئة رقم #PO-MAT-4029 في مرحلة التسليم من مصنع الأهرام للكرتون.
</span>
</div>
<button className="font-label-sm text-label-sm text-primary underline hover:text-secondary-fixed-variant">
متابعة إذن الشراء
</button>
</div>
</div>
</div>
{/*  Production Orders Data Table Module  */}
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden space-y-space-md p-space-lg">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div>
<h3 className="font-headline-md text-headline-md text-primary font-semibold">
سجل أوامر الإنتاج الجارية (Manufacturing Work Orders)
</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">
متابعة دقيقة لمراحل التدفق من تفصيل القماش إلى فحص الجودة النهائي والتعبئة
</p>
</div>
{/*  Filters and Search Bar  */}
<div className="flex flex-wrap items-center gap-space-sm">
<div className="relative">
<span className="material-symbols-outlined absolute right-space-sm top-2.5 text-on-surface-variant text-[18px]">
search
</span>
<input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="h-9 pr-9 pl-4 bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface focus:outline-none focus:bg-surface-container transition-all"
  placeholder="تصفية حسب الكود أو الموديل..."
  type="text"
/>
</div>
<select
  value={selectedFilter}
  onChange={(e) => setSelectedFilter(e.target.value)}
  className="h-9 px-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface focus:outline-none"
>
<option value="all">
جميع الخطوط
</option>
<option value="خط A">
خط A (تيشيرتات)
</option>
<option value="خط B">
خط B (قمصان)
</option>
<option value="خط C">
خط C (جينز)
</option>
<option value="خط D">
خط D (تشطيب)
</option>
</select>
<select className="h-9 px-space-sm bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface focus:outline-none">
<option>
الحالة: قيد التشغيل
</option>
<option>
مكتمل وجاهز للتوريد
</option>
<option>
بانتظار موافقة QC
</option>
<option>
متوقف مؤقتاً
</option>
</select>
<button className="h-9 px-space-md bg-surface-container text-primary rounded-lg font-label-md text-label-md flex items-center gap-1 hover:bg-surface-variant transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">
tune
</span>
<span>
تخصيص الأعمدة
</span>
</button>
</div>
</div>
{/*  Tabular Grid  */}
<div className="overflow-x-auto">
<table className="w-full text-right">
<thead>
<tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
<th className="py-space-sm px-space-md font-semibold">
رقم أمر الإنتاج
</th>
<th className="py-space-sm px-space-md font-semibold">
الصنف والموديل
</th>
<th className="py-space-sm px-space-md font-semibold text-center">
الكمية المستهدفة
</th>
<th className="py-space-sm px-space-md font-semibold text-center">
المنجز فعلياً
</th>
<th className="py-space-sm px-space-md font-semibold">
نسبة الإنجاز
</th>
<th className="py-space-sm px-space-md font-semibold">
المرحلة الحالية
</th>
<th className="py-space-sm px-space-md font-semibold">
الخط / الوردية
</th>
<th className="py-space-sm px-space-md font-semibold">
فحص الجودة QC
</th>
<th className="py-space-sm px-space-md font-semibold text-center">
الحالة التشغيلية
</th>
<th className="py-space-sm px-space-md font-semibold text-left">
إجراءات
</th>
</tr>
</thead>
<tbody className="divide-y divide-transparent font-body-sm text-body-sm">
{isLoading && (
  <tr>
    <td colSpan={10} className="py-8 text-center text-on-surface-variant">
      جاري تحميل أوامر التشغيل من قاعدة البيانات...
    </td>
  </tr>
)}
{!isLoading && filteredOrders.map((wo) => {
  const pct = wo.targetQty > 0 ? Math.min(100, Math.round((wo.completedQty / wo.targetQty) * 100)) : 0;
  const remaining = Math.max(0, wo.targetQty - wo.completedQty);
  return (
    <tr key={wo.code || wo.id} className="hover:bg-surface-container-low transition-colors">
      <td className="py-space-md px-space-md">
        <Link href={`/production/${wo.code || wo.id}`} className="font-data-tabular font-bold text-primary block hover:text-secondary hover:underline">
          {wo.code || wo.id}
        </Link>
        <span className="font-label-sm text-[11px] text-on-surface-variant">
          تاريخ التسليم: {wo.dueDate}
        </span>
      </td>
      <td className="py-space-md px-space-md">
        <div className="flex items-center gap-space-xs">
          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">
              styler
            </span>
          </div>
          <div className="min-w-0">
            <Link href={`/production/${wo.code || wo.id}`} className="font-semibold text-primary block truncate hover:text-secondary hover:underline">
              {wo.productNameAr || wo.productName}
            </Link>
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              SKU: {wo.sku || "STX-TSH-NVY-01"}
            </span>
          </div>
        </div>
      </td>
      <td className="py-space-md px-space-md text-center font-data-tabular text-primary font-medium">
        {wo.targetQty.toLocaleString()}
      </td>
      <td className="py-space-md px-space-md text-center font-data-tabular font-bold text-primary">
        {wo.completedQty.toLocaleString()}
      </td>
      <td className="py-space-md px-space-md w-44">
        <div className="space-y-1">
          <div className="flex items-center justify-between font-label-sm text-[11px]">
            <span className="text-on-surface-variant">
              {pct}%
            </span>
            <span className="text-secondary font-medium">
              {remaining > 0 ? `متبقي ${remaining.toLocaleString()}` : "مكتمل بالكامل"}
            </span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }}></div>
          </div>
        </div>
      </td>
      <td className="py-space-md px-space-md">
        <div className="flex items-center gap-1">
          <span className="px-space-xs py-[2px] bg-surface-container text-primary rounded font-label-sm text-label-sm">
            {wo.stage || "الخياطة والتجميع"}
          </span>
        </div>
      </td>
      <td className="py-space-md px-space-md">
        <span className="text-primary font-medium block">
          {wo.lineNameAr || wo.line}
        </span>
        <span className="font-label-sm text-[11px] text-on-surface-variant">
          {wo.facility || "مجمع ومصانع سوتكس المركزي - المحلة الكبرى"}
        </span>
      </td>
      <td className="py-space-md px-space-md">
        <span className="px-space-xs py-[2px] bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm flex items-center gap-1 w-max">
          <span className="material-symbols-outlined text-[14px]">
            done_all
          </span>
          <span>
            فحص AQL 1.5 ({pct}%)
          </span>
        </span>
      </td>
      <td className="py-space-md px-space-md text-center">
        <span className="px-space-xs py-1 bg-surface-container text-primary font-label-sm text-label-sm rounded-lg font-medium inline-block">
          {wo.status === "completed"
            ? "جاهز للتوريد"
            : (wo.status as string) === "delayed"
            ? "متأخر / متوقف"
            : "قيد التشغيل"}
        </span>
      </td>
      <td className="py-space-md px-space-md text-left">
        <div className="flex items-center justify-end gap-1">
          <Link href={`/production/${wo.code || wo.id}`} className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" title="عرض تفاصيل أمر التشغيل وتسجيل إنجاز الوردية">
            <span className="material-symbols-outlined text-[18px]">
              visibility
            </span>
          </Link>
          <Link href="/production/bom" className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant transition-colors" title="تفاصيل المواد BOM">
            <span className="material-symbols-outlined text-[18px]">
              schema
            </span>
          </Link>
          <button
            onClick={() =>
              openModal({
                type: "new_stock_movement",
                title: `صرف وتسجيل استهلاك خامات لأمر #${wo.code || wo.id}`,
                description: "تحديد كمية الأقمشة والأزرار المستهلكة في مرحلة الخياطة",
              })
            }
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
            title="تسجيل استهلاك خامات"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              app_registration
            </span>
          </button>
          <button
            onClick={() =>
              openModal({
                type: "new_stock_transfer",
                title: `ترحيل دفعة إنتاج #${wo.code || wo.id} إلى مستودع التوزيع المركزي`,
                description: `إصدار إذن نقل وتخزين لـ ${wo.completedQty.toLocaleString()} قطعة جاهزة`,
              })
            }
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
            title="ترحيل للمخزن النهائي"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              output
            </span>
          </button>
          <button
            onClick={() => showToast("success", "تم إرسال أمر الشغل والباركود للطباعة", `جاري طباعة بطاقة التتبع لأمر ${wo.code || wo.id}.`)}
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
            title="طباعة باركود وأمر شغل"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              print
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
})}
</tbody>
</table>
</div>
{/*  Footer Pagination & Summary  */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between pt-space-sm gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
<span>
عرض 4 من أصل 18 أمر تشغيل نشط في مجمع العاشر من رمضان
</span>
<div className="flex items-center gap-space-xs">
<button className="w-8 h-8 rounded bg-surface-container flex items-center justify-center hover:bg-surface-variant transition-colors text-primary" type="button">
<span className="material-symbols-outlined text-[18px]">
chevron_right
</span>
</button>
<span className="px-3 py-1 bg-primary text-on-primary rounded font-label-sm text-label-sm">
1
</span>
<button className="px-3 py-1 bg-surface-container text-primary rounded font-label-sm text-label-sm hover:bg-surface-variant transition-colors" type="button">
2
</button>
<button className="px-3 py-1 bg-surface-container text-primary rounded font-label-sm text-label-sm hover:bg-surface-variant transition-colors" type="button">
3
</button>
<button className="w-8 h-8 rounded bg-surface-container flex items-center justify-center hover:bg-surface-variant transition-colors text-primary" type="button">
<span className="material-symbols-outlined text-[18px]">
chevron_left
</span>
</button>
</div>
</div>
</div>
</div>
</div>
</main>
  );
}
