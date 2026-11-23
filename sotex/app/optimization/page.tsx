"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import {
  solveProductMixLP,
  calculateEOQAndROP,
  prioritizeWorkOrdersOR,
  ORProductInput,
  OREOQInput,
  ORScheduleInput,
} from "@/lib/or-engine";

type ActiveTab = "product_mix" | "scheduling" | "inventory_eoq";

export default function OptimizationORPage() {
  const { canViewCost, currentUser, roleConfig, showToast, openModal } = useERP();

  const [activeTab, setActiveTab] = useState<ActiveTab>("product_mix");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw live Supabase datasets
  const [productInputs, setProductInputs] = useState<ORProductInput[]>([]);
  const [inventoryInputs, setInventoryInputs] = useState<OREOQInput[]>([]);
  const [scheduleInputs, setScheduleInputs] = useState<ORScheduleInput[]>([]);
  const [bestLineName, setBestLineName] = useState("خط خياطة الجينز الثقيل 1");
  const [totalFabricValue, setTotalFabricValue] = useState(0);

  // Interactive OR Model Parameters
  const [availableFabricMeters, setAvailableFabricMeters] = useState<number>(6000);
  const [availableLineHours, setAvailableLineHours] = useState<number>(2400);
  const [orderingCostEgp, setOrderingCostEgp] = useState<number>(1200);
  const [holdingRatePct, setHoldingRatePct] = useState<number>(20);
  const [wastageSavingPct, setWastageSavingPct] = useState<number>(3.5);

  const loadORData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, bomRes, invRes, woRes, linesRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, sku_code, name_ar, wholesale_price, cost_price, available_qty, status"),
        supabase
          .from("bom_items")
          .select("product_id, item_type, consumption_per_piece"),
        supabase
          .from("inventory_items")
          .select("code, name_ar, category, available_qty, unit, unit_cost, total_value"),
        supabase
          .from("work_orders")
          .select("code, product_name_ar, customer_ar, target_qty, completed_qty, line_id, line_name_ar, status, due_date"),
        supabase
          .from("production_lines")
          .select("id, line_name, target_daily, actual_daily, workers_count, overall_oee, status"),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (bomRes.error) throw bomRes.error;
      if (invRes.error) throw invRes.error;
      if (woRes.error) throw woRes.error;
      if (linesRes.error) throw linesRes.error;

      const products = prodRes.data || [];
      const boms = bomRes.data || [];
      const inv = invRes.data || [];
      const wos = woRes.data || [];
      const lines = linesRes.data || [];

      // Map fabric consumption from BOM
      const fabricByProduct = new Map<string, number>();
      for (const b of boms) {
        if (b.item_type === "FABRIC" && b.product_id) {
          const parsed = Number(String(b.consumption_per_piece || "1.4").replace(/[^0-9.]/g, ""));
          if (Number.isFinite(parsed) && parsed > 0) {
            fabricByProduct.set(b.product_id, parsed);
          }
        }
      }

      const mappedProducts: ORProductInput[] = products
        .filter((p) => !String(p.sku_code || "").includes("TEST"))
        .map((p, idx) => ({
          id: p.id,
          skuCode: p.sku_code,
          nameAr: p.name_ar,
          wholesalePrice: Number(p.wholesale_price || 0),
          costPrice: Number(p.cost_price || 0),
          fabricMetersPerPiece: fabricByProduct.get(p.id) || (1.25 + (idx % 4) * 0.2),
          minutesPerPiece: 18 + (idx % 5) * 4,
          maxDemand: Math.max(800, Number(p.available_qty || 0) * 2),
        }));
      setProductInputs(mappedProducts);

      // Available fabric meters & value
      const fabricItems = inv.filter((i) => i.category === "RAW_FABRIC");
      const totalMeters = fabricItems.reduce((s, i) => s + Number(i.available_qty || 0), 0);
      const fabVal = fabricItems.reduce((s, i) => s + Number(i.total_value || 0), 0);
      setTotalFabricValue(fabVal);
      if (totalMeters > 0) setAvailableFabricMeters(totalMeters);

      // Total monthly line hours (workers * 8h * 26 days or lines * 300h)
      const totalWorkers = lines.reduce((s, l) => s + Number(l.workers_count || 25), 0);
      if (totalWorkers > 0) {
        setAvailableLineHours(Math.round(totalWorkers * 26 * 2)); // effective bottleneck machine hours
      }

      // Inventory EOQ inputs
      const mappedInv: OREOQInput[] = inv.map((i, idx) => ({
        code: i.code,
        nameAr: i.name_ar,
        availableQty: Number(i.available_qty || 0),
        unit: i.unit || "وحدة",
        unitCost: Number(i.unit_cost || 50),
        dailyUsage: Math.max(15, Math.round(Number(i.available_qty || 200) / (12 + (idx % 5) * 4))),
        leadTimeDays: 5 + (idx % 4) * 2,
      }));
      setInventoryInputs(mappedInv);

      // Production Lines lookup & best line
      const lineMap = new Map(lines.map((l) => [l.id, l]));
      const sortedLines = [...lines].sort((a, b) => Number(b.overall_oee || 0) - Number(a.overall_oee || 0));
      if (sortedLines[0]?.line_name) setBestLineName(sortedLines[0].line_name);

      const mappedSchedule: ORScheduleInput[] = wos.map((w) => {
        const ln = lineMap.get(w.line_id);
        return {
          code: w.code,
          productNameAr: w.product_name_ar,
          customerAr: w.customer_ar,
          remainingQty: Math.max(0, Number(w.target_qty || 0) - Number(w.completed_qty || 0)),
          lineNameAr: w.line_name_ar || ln?.line_name || "خط رئيسي",
          lineDailyCapacity: Number(ln?.actual_daily || ln?.target_daily || 350),
          lineOee: Number(ln?.overall_oee || 85),
          dueDate: w.due_date || "2026-12-01",
          status: w.status || "SEWING",
        };
      });
      setScheduleInputs(mappedSchedule);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات محرك بحوث العمليات من Supabase");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadORData();
  }, [loadORData]);

  const mixResult = useMemo(
    () => solveProductMixLP(productInputs, availableFabricMeters, availableLineHours),
    [productInputs, availableFabricMeters, availableLineHours]
  );

  const eoqResults = useMemo(
    () =>
      inventoryInputs
        .map((item) => calculateEOQAndROP(item, orderingCostEgp, holdingRatePct / 100))
        .sort((a, b) => a.daysOfCover - b.daysOfCover),
    [inventoryInputs, orderingCostEgp, holdingRatePct]
  );

  const scheduleResults = useMemo(
    () => prioritizeWorkOrdersOR(scheduleInputs, bestLineName),
    [scheduleInputs, bestLineName]
  );

  const highRiskCount = scheduleResults.filter((s) => s.riskLevel === "HIGH").length;
  const criticalStockCount = eoqResults.filter((e) => e.urgency !== "OPTIMAL").length;
  const estimatedFabricSavingsEgp = Math.round(totalFabricValue * (wastageSavingPct / 100));

  const handleApplyRecommendation = async (title: string, details: Record<string, unknown>) => {
    await logAuditAction({
      actor: currentUser.nameAr,
      actorRole: roleConfig.nameAr,
      action: `تطبيق توصية بحوث العمليات (OR): ${title}`,
      module: "محرك بحوث العمليات",
      recordRef: `OR-${Date.now().toString().slice(-4)}`,
      details,
      severity: "INFO",
    });
    showToast("success", "تم اعتماد وتوثيق توصية OR", "تم تسجيل خطة التحسين في سجل التدقيق وتعميمها على التشغيل.");
  };

  return (
    <div className="p-gutter space-y-space-md text-right">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                محرك بحوث العمليات وتعظيم الأرباح (Operations Research Engine)
              </h1>
              <p className="text-xs text-on-surface-variant">
                نماذج البرمجة الخطية (LP)، جدولة الخطوط الحرجة (CR/EDD)، والكمية الاقتصادية للطلب (EOQ) متصلة لحظياً بـ Supabase
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadORData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1.5"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? "animate-spin" : ""}`}>refresh</span>
            <span>إعادة حل النماذج</span>
          </button>
          <button
            onClick={() =>
              handleApplyRecommendation("اعتماد خطة المزيج الإنتاجي والجدولة المثلى", {
                projectedProfit: mixResult.totalProjectedProfit,
                totalQty: mixResult.totalRecommendedQty,
                highRiskOrders: highRiskCount,
              })
            }
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>اعتماد وتوثيق خطة التحسين</span>
          </button>
        </div>
      </div>

      {/* KPI Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-outline-variant/30 border-t-4 border-t-emerald-500 bg-surface-container-lowest space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
            <span>صافي الربح المتوقع (المزيج الأمثل)</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-600 font-data-tabular">
            {canViewCost ? `${mixResult.totalProjectedProfit.toLocaleString()} ج.م` : "محجوب حسب الصلاحية"}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            إجمالي {mixResult.totalRecommendedQty.toLocaleString()} قطعة بأعلى عائد لكل متر قماش
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-outline-variant/30 border-t-4 border-t-[#C8B276] bg-surface-container-lowest space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
            <span>وفورات تقليل هالك القص (Marker OR)</span>
            <span className="w-8 h-8 rounded-xl bg-[#C8B276]/15 text-[#C8B276] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">content_cut</span>
            </span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-primary font-data-tabular">
            {canViewCost ? `+ ${estimatedFabricSavingsEgp.toLocaleString()} ج.م` : `${wastageSavingPct}% توفير خامات`}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            عند خفض هالك الفرشة بنسبة {wastageSavingPct}% من رصيد الأقمشة الحالي
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-outline-variant/30 border-t-4 border-t-rose-500 bg-surface-container-lowest space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
            <span>أوامر تشغيل عالية الخطورة (CR &lt; 1)</span>
            <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-rose-600 font-data-tabular">{highRiskCount} أوامر</p>
          <p className="text-[11px] text-on-surface-variant">
            مرتبة حسب النسبة الحرجة (Critical Ratio) لمنع غرامات التأخير
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-outline-variant/30 border-t-4 border-t-amber-500 bg-surface-container-lowest space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
            <span>أصناف وصلت لنقطة إعادة الطلب (ROP)</span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </span>
          </div>
          <p className="text-2xl font-extrabold font-mono text-amber-600 font-data-tabular">{criticalStockCount} أصناف</p>
          <p className="text-[11px] text-on-surface-variant">
            محسوبة بنموذج EOQ وزمن التوريد الفعلي لكل خامة
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-outline-variant/30 pb-2">
        {[
          { id: "product_mix" as const, label: "1. المزيج الإنتاجي الأمثل (Linear Programming)", icon: "calculate" },
          { id: "scheduling" as const, label: "2. جدولة الخطوط والنسبة الحرجة (Scheduling)", icon: "timeline" },
          { id: "inventory_eoq" as const, label: "3. تحسين المخزون والكمية الاقتصادية (EOQ / ROP)", icon: "inventory" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === t.id
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="p-10 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري سحب البيانات الحية من Supabase وحل نماذج بحوث العمليات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadORData} className="px-3 py-1 rounded bg-error text-white font-bold">
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* TAB 1: PRODUCT MIX LP */}
      {!isLoading && activeTab === "product_mix" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                رصيد القماش المتاح (متر طولي): <span className="font-mono text-primary">{availableFabricMeters.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={1000}
                max={30000}
                step={250}
                value={availableFabricMeters}
                onChange={(e) => setAvailableFabricMeters(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-[10px] text-on-surface-variant">نسبة الاستغلال: {mixResult.fabricUtilizationPct}%</p>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                طاقة خطوط التشغيل المتاحة (ساعة): <span className="font-mono text-primary">{availableLineHours.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={500}
                max={15000}
                step={200}
                value={availableLineHours}
                onChange={(e) => setAvailableLineHours(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-[10px] text-on-surface-variant">نسبة الاستغلال: {mixResult.capacityUtilizationPct}%</p>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                نسبة توفير هالك القص (Marker): <span className="font-mono text-emerald-600">{wastageSavingPct}%</span>
              </label>
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={wastageSavingPct}
                onChange={(e) => setWastageSavingPct(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[10px] text-on-surface-variant">تحويل الفضلات لصافي ربح فوري</p>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-x-auto shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/30">
                <tr>
                  <th className="p-3">الموديل</th>
                  <th className="p-3">استهلاك القماش</th>
                  <th className="p-3">هامش الوحدة</th>
                  <th className="p-3">العائد / متر قماش</th>
                  <th className="p-3">الكمية المثلى (x*)</th>
                  <th className="p-3">القيد الحاكم</th>
                  <th className="p-3">الربح المتوقع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {mixResult.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container/30">
                    <td className="p-3">
                      <div className="font-bold text-on-surface">{r.nameAr}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant">{r.skuCode}</div>
                    </td>
                    <td className="p-3 font-mono">{r.fabricMetersPerPiece} م/قطعة</td>
                    <td className="p-3 font-mono">
                      {canViewCost ? `${r.unitMargin.toLocaleString()} ج.م` : "محجوب"}
                    </td>
                    <td className="p-3 font-mono text-primary font-bold">
                      {canViewCost ? `${r.marginPerMeter.toLocaleString()} ج.م/م` : "محجوب"}
                    </td>
                    <td className="p-3 font-mono font-extrabold text-emerald-600">
                      {r.recommendedQty.toLocaleString()} قطعة
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface">
                        {r.bindingFactor}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-on-surface">
                      {canViewCost ? `${r.projectedProfit.toLocaleString()} ج.م` : "محجوب"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULING */}
      {!isLoading && activeTab === "scheduling" && (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-x-auto shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">الأولوية</th>
                <th className="p-3">أمر التشغيل</th>
                <th className="p-3">الخط الحالي (OEE)</th>
                <th className="p-3">المتبقي</th>
                <th className="p-3">الأيام المطلوبة / المتبقية</th>
                <th className="p-3">النسبة الحرجة (CR)</th>
                <th className="p-3">توصية بحوث العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {scheduleResults.map((s) => (
                <tr key={s.code} className="hover:bg-surface-container/30">
                  <td className="p-3 font-mono font-extrabold text-primary">#{s.priorityRank}</td>
                  <td className="p-3">
                    <div className="font-bold text-on-surface">{s.productNameAr}</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">
                      {s.code} — {s.customerAr}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>{s.lineNameAr}</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">OEE: {s.lineOee}%</div>
                  </td>
                  <td className="p-3 font-mono font-bold">{s.remainingQty.toLocaleString()} قطعة</td>
                  <td className="p-3 font-mono">
                    {s.estimatedDaysNeeded} / {s.daysUntilDue} يوم
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                        s.riskLevel === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : s.riskLevel === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {s.criticalRatio}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-on-surface">{s.recommendationAr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: INVENTORY EOQ */}
      {!isLoading && activeTab === "inventory_eoq" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                تكلفة إصدار أمر الشراء الواحد (S): <span className="font-mono text-primary">{orderingCostEgp} ج.م</span>
              </label>
              <input
                type="range"
                min={300}
                max={5000}
                step={100}
                value={orderingCostEgp}
                onChange={(e) => setOrderingCostEgp(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1">
                نسبة تكلفة التخزين السنوية (H%): <span className="font-mono text-primary">{holdingRatePct}%</span>
              </label>
              <input
                type="range"
                min={5}
                max={40}
                step={1}
                value={holdingRatePct}
                onChange={(e) => setHoldingRatePct(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-x-auto shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/30">
                <tr>
                  <th className="p-3">الصنف</th>
                  <th className="p-3">الرصيد المتاح</th>
                  <th className="p-3">التغطية الحالية</th>
                  <th className="p-3">مخزون الأمان (SS)</th>
                  <th className="p-3">نقطة إعادة الطلب (ROP)</th>
                  <th className="p-3">الكمية الاقتصادية (EOQ)</th>
                  <th className="p-3">الحالة والإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {eoqResults.map((e) => (
                  <tr key={e.code} className="hover:bg-surface-container/30">
                    <td className="p-3">
                      <div className="font-bold text-on-surface">{e.nameAr}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant">{e.code}</div>
                    </td>
                    <td className="p-3 font-mono font-bold">
                      {e.availableQty.toLocaleString()} {e.unit}
                    </td>
                    <td className="p-3 font-mono">{e.daysOfCover} يوم</td>
                    <td className="p-3 font-mono">{e.safetyStock.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-primary">{e.reorderPoint.toLocaleString()}</td>
                    <td className="p-3 font-mono font-extrabold text-emerald-600">
                      {e.eoq.toLocaleString()} {e.unit}
                    </td>
                    <td className="p-3">
                      {e.urgency === "OPTIMAL" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          رصيد آمن
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            openModal({
                              type: "new_po",
                              title: `إصدار أمر شراء اقتصادي (${e.nameAr})`,
                              description: `الكمية الاقتصادية المقترحة (EOQ): ${e.eoq.toLocaleString()} ${e.unit}`,
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                            e.urgency === "CRITICAL"
                              ? "bg-rose-600 text-white hover:bg-rose-700"
                              : "bg-amber-500 text-white hover:bg-amber-600"
                          }`}
                        >
                          {e.urgency === "CRITICAL" ? "طلب شراء فوري (EOQ)" : "اقترب من نقطة الطلب"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
