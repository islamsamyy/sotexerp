export interface ORProductInput {
  id: string;
  skuCode: string;
  nameAr: string;
  wholesalePrice: number;
  costPrice: number;
  fabricMetersPerPiece: number;
  minutesPerPiece: number;
  maxDemand: number;
}

export interface ORProductMixRow extends ORProductInput {
  unitMargin: number;
  marginPerMeter: number;
  recommendedQty: number;
  fabricUsed: number;
  hoursUsed: number;
  projectedRevenue: number;
  projectedProfit: number;
  bindingFactor: "طاقة الخطوط" | "رصيد القماش" | "سقف الطلب" | "غير مجدٍ";
}

export interface ORProductMixResult {
  rows: ORProductMixRow[];
  totalRecommendedQty: number;
  totalFabricUsed: number;
  totalHoursUsed: number;
  totalProjectedRevenue: number;
  totalProjectedProfit: number;
  fabricUtilizationPct: number;
  capacityUtilizationPct: number;
}

/**
 * Solves the resource-constrained Product Mix problem:
 * Maximize sum((P_i - C_i) * x_i)
 * Subject to:
 *   sum(fabric_i * x_i) <= availableFabricMeters
 *   sum(hours_i * x_i) <= availableLineHours
 *   0 <= x_i <= maxDemand_i
 */
export function solveProductMixLP(
  products: ORProductInput[],
  availableFabricMeters: number,
  availableLineHours: number
): ORProductMixResult {
  let remFabric = Math.max(0, availableFabricMeters);
  let remHours = Math.max(0, availableLineHours);

  const enriched = products.map((p) => {
    const unitMargin = Math.max(0, p.wholesalePrice - p.costPrice);
    const fabric = Math.max(0.2, p.fabricMetersPerPiece);
    const hours = Math.max(0.05, p.minutesPerPiece / 60);
    // Score by blended bottleneck return (profit per weighted resource unit)
    const fabricShare = availableFabricMeters > 0 ? fabric / availableFabricMeters : 1;
    const hourShare = availableLineHours > 0 ? hours / availableLineHours : 1;
    const resourceIntensity = fabricShare + hourShare;
    const priorityScore = resourceIntensity > 0 ? unitMargin / resourceIntensity : unitMargin;
    return {
      ...p,
      unitMargin,
      fabric,
      hours,
      marginPerMeter: Number((unitMargin / fabric).toFixed(2)),
      priorityScore,
    };
  });

  // Sort descending by profit per bottleneck resource unit
  const sorted = [...enriched].sort((a, b) => b.priorityScore - a.priorityScore);
  const allocationMap = new Map<string, { qty: number; binding: ORProductMixRow["bindingFactor"] }>();

  for (const item of sorted) {
    if (item.unitMargin <= 0 || item.maxDemand <= 0) {
      allocationMap.set(item.id, { qty: 0, binding: "غير مجدٍ" });
      continue;
    }

    const maxByFabric = Math.floor(remFabric / item.fabric);
    const maxByHours = Math.floor(remHours / item.hours);
    const maxAllowed = Math.max(0, Math.min(item.maxDemand, maxByFabric, maxByHours));

    let binding: ORProductMixRow["bindingFactor"] = "سقف الطلب";
    if (maxAllowed === maxByFabric && maxByFabric <= maxByHours && maxByFabric < item.maxDemand) {
      binding = "رصيد القماش";
    } else if (maxAllowed === maxByHours && maxByHours < maxByFabric && maxByHours < item.maxDemand) {
      binding = "طاقة الخطوط";
    }

    remFabric -= maxAllowed * item.fabric;
    remHours -= maxAllowed * item.hours;

    allocationMap.set(item.id, { qty: maxAllowed, binding });
  }

  const rows: ORProductMixRow[] = enriched.map((item) => {
    const alloc = allocationMap.get(item.id) || { qty: 0, binding: "غير مجدٍ" as const };
    const fabricUsed = Number((alloc.qty * item.fabric).toFixed(1));
    const hoursUsed = Number((alloc.qty * item.hours).toFixed(1));
    return {
      id: item.id,
      skuCode: item.skuCode,
      nameAr: item.nameAr,
      wholesalePrice: item.wholesalePrice,
      costPrice: item.costPrice,
      fabricMetersPerPiece: item.fabric,
      minutesPerPiece: item.minutesPerPiece,
      maxDemand: item.maxDemand,
      unitMargin: item.unitMargin,
      marginPerMeter: item.marginPerMeter,
      recommendedQty: alloc.qty,
      fabricUsed,
      hoursUsed,
      projectedRevenue: alloc.qty * item.wholesalePrice,
      projectedProfit: alloc.qty * item.unitMargin,
      bindingFactor: alloc.binding,
    };
  });

  const totalRecommendedQty = rows.reduce((s, r) => s + r.recommendedQty, 0);
  const totalFabricUsed = Number(rows.reduce((s, r) => s + r.fabricUsed, 0).toFixed(1));
  const totalHoursUsed = Number(rows.reduce((s, r) => s + r.hoursUsed, 0).toFixed(1));
  const totalProjectedRevenue = rows.reduce((s, r) => s + r.projectedRevenue, 0);
  const totalProjectedProfit = rows.reduce((s, r) => s + r.projectedProfit, 0);

  return {
    rows: rows.sort((a, b) => b.projectedProfit - a.projectedProfit),
    totalRecommendedQty,
    totalFabricUsed,
    totalHoursUsed,
    totalProjectedRevenue,
    totalProjectedProfit,
    fabricUtilizationPct:
      availableFabricMeters > 0
        ? Math.min(100, Number(((totalFabricUsed / availableFabricMeters) * 100).toFixed(1)))
        : 0,
    capacityUtilizationPct:
      availableLineHours > 0
        ? Math.min(100, Number(((totalHoursUsed / availableLineHours) * 100).toFixed(1)))
        : 0,
  };
}

export interface OREOQInput {
  code: string;
  nameAr: string;
  availableQty: number;
  unit: string;
  unitCost: number;
  dailyUsage: number;
  leadTimeDays: number;
}

export interface OREOQResult extends OREOQInput {
  annualDemand: number;
  eoq: number;
  safetyStock: number;
  reorderPoint: number;
  daysOfCover: number;
  urgency: "CRITICAL" | "REORDER_SOON" | "OPTIMAL";
  estimatedAnnualHoldingAndOrderCost: number;
}

/**
 * Economic Order Quantity (EOQ) & Reorder Point (ROP) calculation
 */
export function calculateEOQAndROP(
  item: OREOQInput,
  orderingCostEgp: number = 1200,
  annualHoldingRate: number = 0.2
): OREOQResult {
  const dailyUsage = Math.max(1, item.dailyUsage);
  const annualDemand = Math.round(dailyUsage * 300); // 300 working days/year
  const holdingCostPerUnit = Math.max(1, item.unitCost * annualHoldingRate);
  const eoq = Math.max(1, Math.round(Math.sqrt((2 * annualDemand * orderingCostEgp) / holdingCostPerUnit)));
  const safetyStock = Math.round(dailyUsage * Math.max(2, Math.ceil(item.leadTimeDays * 0.4)));
  const reorderPoint = Math.round(dailyUsage * item.leadTimeDays + safetyStock);
  const daysOfCover = Number((item.availableQty / dailyUsage).toFixed(1));

  let urgency: OREOQResult["urgency"] = "OPTIMAL";
  if (item.availableQty <= safetyStock) urgency = "CRITICAL";
  else if (item.availableQty <= reorderPoint) urgency = "REORDER_SOON";

  const estimatedAnnualHoldingAndOrderCost = Math.round(
    (annualDemand / eoq) * orderingCostEgp + (eoq / 2) * holdingCostPerUnit
  );

  return {
    ...item,
    annualDemand,
    eoq,
    safetyStock,
    reorderPoint,
    daysOfCover,
    urgency,
    estimatedAnnualHoldingAndOrderCost,
  };
}

export interface ORScheduleInput {
  code: string;
  productNameAr: string;
  customerAr: string;
  remainingQty: number;
  lineNameAr: string;
  lineDailyCapacity: number;
  lineOee: number;
  dueDate: string;
  status: string;
}

export interface ORScheduleRecommendation extends ORScheduleInput {
  estimatedDaysNeeded: number;
  daysUntilDue: number;
  criticalRatio: number;
  priorityRank: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  recommendationAr: string;
}

/**
 * Earliest Due Date (EDD) & Critical Ratio (CR) scheduling prioritization
 */
export function prioritizeWorkOrdersOR(
  orders: ORScheduleInput[],
  bestAvailableLineName: string,
  referenceDate: Date = new Date()
): ORScheduleRecommendation[] {
  const active = orders.filter((o) => o.status !== "COMPLETED" && o.remainingQty > 0);

  const scored = active.map((o) => {
    const cap = Math.max(50, o.lineDailyCapacity);
    const estimatedDaysNeeded = Number((o.remainingQty / cap).toFixed(1));
    const due = new Date(o.dueDate);
    const rawDiff = Number.isFinite(due.getTime())
      ? (due.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      : 10;
    const daysUntilDue = Number(rawDiff.toFixed(1));
    const criticalRatio =
      estimatedDaysNeeded > 0 ? Number((daysUntilDue / estimatedDaysNeeded).toFixed(2)) : 99;

    let riskLevel: ORScheduleRecommendation["riskLevel"] = "LOW";
    let recommendationAr = "التدفق متوازن — استمرار التشغيل على الخط الحالي";

    if (criticalRatio < 1 || o.lineOee < 75) {
      riskLevel = "HIGH";
      recommendationAr =
        o.lineOee < 75
          ? `كفاءة الخط منخفضة (${o.lineOee}%) — يُوصى بتحويل الفائض إلى ${bestAvailableLineName} أو إضافة وردية`
          : `عجز زمني (${estimatedDaysNeeded} يوم مطلوب مقابل ${Math.max(0, daysUntilDue)} متبقي) — أولوية قصوى ووردية إضافية`;
    } else if (criticalRatio < 1.5) {
      riskLevel = "MEDIUM";
      recommendationAr = "هامش أمان ضيق — تثبيت جدول القص ومنع تغيير الموديل قبل الإتمام";
    }

    return {
      ...o,
      estimatedDaysNeeded,
      daysUntilDue,
      criticalRatio,
      riskLevel,
      recommendationAr,
    };
  });

  return scored
    .sort((a, b) => a.criticalRatio - b.criticalRatio)
    .map((item, idx) => ({ ...item, priorityRank: idx + 1 }));
}
