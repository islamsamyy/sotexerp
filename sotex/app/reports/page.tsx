"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useERP } from "@/lib/erp-context";
import { supabase } from "@/lib/supabase";

export default function ReportsPage() {
  const { canViewCost, showToast } = useERP();
  const [selectedReport, setSelectedReport] = useState("production");
  const [loading, setLoading] = useState(true);

  // Real data state
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    try {
      const [woRes, bomRes, invRes, prodRes] = await Promise.all([
        supabase.from("work_orders").select("*").limit(10),
        supabase.from("bom_items").select("*").limit(10),
        supabase.from("inventory_items").select("*").limit(10),
        supabase.from("products").select("*").limit(10),
      ]);

      if (woRes.data) setWorkOrders(woRes.data);
      if (bomRes.data) setBomItems(bomRes.data);
      if (invRes.data) setInventoryItems(invRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    } catch (err) {
      console.error("Failed to fetch reports data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handleExportCSV = (filename: string, rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) {
      showToast("warning", "لا توجد بيانات متاحة للتصدير حالياً");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((header) => {
              const val = row[header];
              const stringified = typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
              return `"${stringified.replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("success", "تم تصدير التقرير بنجاح", `تم تنزيل ملف (${filename}.csv).`);
  };

  const reports = [
    { key: "production", title: "تقرير الإنتاج اليومي وكفاءة الخطوط", desc: "ملخص القطع المنجزة لكل خط خياطة وقص ومعدلات الأداء" },
    { key: "wastage", title: "تحليل نسب هالك الأقمشة والخامات", desc: "مقارنة نسب هالك القص المعيارية (BOM) مقابل الفعلي" },
    { key: "inventory", title: "تقرير الجرد والتقييم المخزني", desc: "أرصدة الأقمشة والإكسسوارات والمنتج التام مع مواقع التخزين" },
    { key: "profitability", title: "تقرير ربحية الموديلات وهوامش المساهمة", desc: "تحليل ربحية كل موديل مقارنة بتكاليف التشغيل (خاص بالإدارة والمالية)" },
  ];

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">analytics</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">
              مركز التقارير والتحليلات التشغيلية والمالية
            </h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            استخراج التقارير الرقابية، تحليل نسب الهالك، ومؤشرات الأداء من قاعدة بيانات Supabase
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedReport === "production") handleExportCSV("SOTEX_Production_Report", workOrders);
              else if (selectedReport === "wastage") handleExportCSV("SOTEX_Wastage_BOM_Report", bomItems);
              else if (selectedReport === "inventory") handleExportCSV("SOTEX_Inventory_Report", inventoryItems);
              else handleExportCSV("SOTEX_Profitability_Report", products);
            }}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>تصدير ملف Excel (CSV)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {reports.map((rep) => (
          <div
            key={rep.key}
            onClick={() => setSelectedReport(rep.key)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedReport === rep.key
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-outline-variant/40 hover:bg-surface-container"
            }`}
          >
            <h4 className="font-bold text-xs text-on-surface">{rep.title}</h4>
            <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">{rep.desc}</p>
          </div>
        ))}
      </div>

      {/* Render Selected Report View */}
      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-4 shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">
            جاري استرجاع السجلات من Supabase...
          </div>
        ) : (
          <>
            {selectedReport === "production" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <h3 className="font-bold text-sm text-on-surface">تقرير أوامر الإنتاج والتشغيل</h3>
                  <span className="text-xs text-outline font-mono">سجلات حية من work_orders</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
                      <tr>
                        <th className="p-2.5">كود الأمر</th>
                        <th className="p-2.5">الموديل والمنتج</th>
                        <th className="p-2.5">خط التشغيل</th>
                        <th className="p-2.5">المستهدف</th>
                        <th className="p-2.5">المنجز الفعلي</th>
                        <th className="p-2.5">الحالة</th>
                        <th className="p-2.5">الكفاءة %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-mono">
                      {workOrders.map((wo) => (
                        <tr key={wo.id || wo.code}>
                          <td className="p-2.5 font-bold text-primary">{wo.code}</td>
                          <td className="p-2.5 font-sans font-medium">{wo.product_name_ar}</td>
                          <td className="p-2.5 font-sans">{wo.line_name_ar}</td>
                          <td className="p-2.5 font-bold">{(wo.target_qty || 0).toLocaleString()} ق</td>
                          <td className="p-2.5 font-bold text-emerald-700">{(wo.completed_qty || 0).toLocaleString()} ق</td>
                          <td className="p-2.5 font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container">
                              {wo.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-primary">{wo.efficiency || 92}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReport === "wastage" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <h3 className="font-bold text-sm text-on-surface">تقرير تحليل نسب هالك القص المعياري (BOM)</h3>
                  <span className="text-xs text-outline font-mono">سجلات حية من bom_items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
                      <tr>
                        <th className="p-2.5">اسم الخامة</th>
                        <th className="p-2.5">المواصفة الفنية</th>
                        <th className="p-2.5">معدل الاستهلاك / قطعة</th>
                        <th className="p-2.5">نسبة الهالك المعيارية</th>
                        <th className="p-2.5">الحالة والجاهزية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-mono">
                      {bomItems.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-sans font-bold text-on-surface">{item.name}</td>
                          <td className="p-2.5 font-sans text-outline">{item.specification}</td>
                          <td className="p-2.5 font-bold text-primary">{item.consumption_per_piece}</td>
                          <td className="p-2.5 font-bold text-amber-700">{item.wastage_percent}%</td>
                          <td className="p-2.5 font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {item.status_label || "جاهز للتصنيع"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReport === "inventory" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <h3 className="font-bold text-sm text-on-surface">ملخص الجرد وتقييم المخزون المالي</h3>
                  <span className="text-xs text-outline font-mono">سجلات حية من inventory_items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
                      <tr>
                        <th className="p-2.5">كود الصنف</th>
                        <th className="p-2.5">اسم الخامة / المنتج</th>
                        <th className="p-2.5">المستودع والموقع</th>
                        <th className="p-2.5">الرصيد الفعلي</th>
                        <th className="p-2.5">تكلفة الوحدة</th>
                        <th className="p-2.5">القيمة الإجمالية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-mono">
                      {inventoryItems.map((inv) => (
                        <tr key={inv.code}>
                          <td className="p-2.5 font-bold text-primary">{inv.code}</td>
                          <td className="p-2.5 font-sans font-medium">{inv.name_ar}</td>
                          <td className="p-2.5 font-sans text-outline">{inv.warehouse_ar}</td>
                          <td className="p-2.5 font-bold">
                            {(Number(inv.actual_qty) || 0).toLocaleString()} {inv.unit}
                          </td>
                          <td className="p-2.5 text-on-surface">
                            {(Number(inv.unit_cost) || 0).toLocaleString()} ج.م
                          </td>
                          <td className="p-2.5 font-bold text-emerald-700">
                            {(Number(inv.total_value) || 0).toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReport === "profitability" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <h3 className="font-bold text-sm text-on-surface">تحليل ربحية الموديلات وهوامش المساهمة</h3>
                  <span className="text-xs text-outline font-mono">سجلات حية من products</span>
                </div>
                {canViewCost ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
                        <tr>
                          <th className="p-2.5">الموديل والمنتج</th>
                          <th className="p-2.5">كود SKU</th>
                          <th className="p-2.5">سعر الجملة</th>
                          <th className="p-2.5">تكلفة المصنع</th>
                          <th className="p-2.5">هامش الربح للقطعة</th>
                          <th className="p-2.5">نسبة الهامش %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 font-mono">
                        {products.map((p) => {
                          const wholesale = Number(p.wholesale_price || 0);
                          const cost = Number(p.cost_price || 0);
                          const marginAmt = wholesale - cost;
                          const marginPct = wholesale > 0 ? ((marginAmt / wholesale) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={p.id}>
                              <td className="p-2.5 font-sans font-bold text-on-surface">{p.name_ar}</td>
                              <td className="p-2.5 text-primary font-bold">{p.sku_code}</td>
                              <td className="p-2.5 font-bold">{wholesale.toLocaleString()} ج.م</td>
                              <td className="p-2.5 text-outline">{cost.toLocaleString()} ج.م</td>
                              <td className="p-2.5 font-bold text-emerald-700">+{marginAmt.toLocaleString()} ج.م</td>
                              <td className="p-2.5 font-bold text-emerald-700">{marginPct}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                    بيانات الربحية والتكلفة محجوبة عن دورك الحالي وفق سياسات RLS.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
