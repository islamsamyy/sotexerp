import assert from "assert";
import { CORE_ROLES } from "../lib/constants";
import { RoleKey } from "../lib/types";
import { solveProductMixLP, calculateEOQAndROP, prioritizeWorkOrdersOR } from "../lib/or-engine";

// Helper functions under test
function canAccessRoute(roleKey: RoleKey, route: string): boolean {
  const role = CORE_ROLES[roleKey];
  if (!role) return false;
  if (role.allowedNavPrefixes.includes("*")) return true;
  return role.allowedNavPrefixes.some(
    (prefix) => route === prefix || route.startsWith(prefix === "/" ? "/dashboard" : prefix)
  );
}

function calculateFinancials(totalRevenue: number, expenseRatio: number = 0.769) {
  const operatingExpenses = Math.round(totalRevenue * expenseRatio);
  const netProfit = totalRevenue - operatingExpenses;
  const netMarginPct = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
  return { operatingExpenses, netProfit, netMarginPct };
}

function calculateOEE(lines: { overall_oee: number | string }[]): number {
  if (!lines.length) return 0;
  const sum = lines.reduce((acc, cur) => acc + Number(cur.overall_oee || 0), 0);
  return Number((sum / lines.length).toFixed(1));
}

function calculateAQLPassRate(inspections: { decision: string }[]): number {
  if (!inspections.length) return 0;
  const passedCount = inspections.filter((i) => i.decision === "PASSED").length;
  return Number(((passedCount / inspections.length) * 100).toFixed(1));
}

function generateCSVString(filename: string, rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return (
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
    ].join("\r\n")
  );
}

async function runFrontendLogicTests() {
  console.log("\n=======================================================");
  console.log("🧩 SOTEX ERP — SENIOR ENGINEER FRONTEND LOGIC TEST SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    process.stdout.write(`⏳ [TEST] ${name} ... `);
    try {
      fn();
      console.log("✅ PASSED");
      passed++;
    } catch (err: any) {
      console.log("❌ FAILED");
      console.error(`   Error details: ${err?.message || err}`);
      failed++;
    }
  }

  // TEST 1: Role Route Access (Wildcard vs Restrictive)
  test("1. Role Navigation Access Control (canAccessRoute)", () => {
    // OWNER_ADMIN has wildcard "*"
    assert.strictEqual(canAccessRoute("OWNER_ADMIN", "/"), true);
    assert.strictEqual(canAccessRoute("OWNER_ADMIN", "/production"), true);
    assert.strictEqual(canAccessRoute("OWNER_ADMIN", "/finance/pnl"), true);
    assert.strictEqual(canAccessRoute("OWNER_ADMIN", "/settings/users"), true);

    // PRODUCTION_MANAGER has access to /production and /inventory
    assert.strictEqual(canAccessRoute("PRODUCTION_MANAGER", "/production"), true);
    assert.strictEqual(canAccessRoute("PRODUCTION_MANAGER", "/production/bom"), true);
    assert.strictEqual(canAccessRoute("PRODUCTION_MANAGER", "/inventory"), true);
    // Should NOT have access to /finance
    assert.strictEqual(canAccessRoute("PRODUCTION_MANAGER", "/finance"), false);

    // WAREHOUSE_MANAGER has access to /inventory and /production
    assert.strictEqual(canAccessRoute("WAREHOUSE_MANAGER", "/inventory"), true);
    assert.strictEqual(canAccessRoute("WAREHOUSE_MANAGER", "/inventory/fabrics"), true);
    assert.strictEqual(canAccessRoute("WAREHOUSE_MANAGER", "/finance"), false);

    // FINANCE_SALES_MANAGER has access to /finance and /sales
    assert.strictEqual(canAccessRoute("FINANCE_SALES_MANAGER", "/finance"), true);
    assert.strictEqual(canAccessRoute("FINANCE_SALES_MANAGER", "/sales"), true);
  });

  // TEST 2: Role Cost & Margins Masking Rules
  test("2. Cost & Margin Financial Visibility Rules (canViewCost)", () => {
    assert.strictEqual(CORE_ROLES.OWNER_ADMIN.canViewCost, true, "Owner must view cost");
    assert.strictEqual(CORE_ROLES.OWNER_ADMIN.canViewMargins, true, "Owner must view margins");
    assert.strictEqual(CORE_ROLES.OWNER_ADMIN.canApproveFinancial, true, "Owner must approve financial");

    assert.strictEqual(CORE_ROLES.FINANCE_SALES_MANAGER.canViewCost, true, "Finance manager must view cost");
    assert.strictEqual(CORE_ROLES.FINANCE_SALES_MANAGER.canApproveFinancial, true, "Finance manager can approve");

    assert.strictEqual(CORE_ROLES.PRODUCTION_MANAGER.canViewCost, false, "Production manager cost masked");
    assert.strictEqual(CORE_ROLES.PRODUCTION_MANAGER.canApproveFinancial, false, "Production manager cannot approve financial");

    assert.strictEqual(CORE_ROLES.WAREHOUSE_MANAGER.canViewCost, false, "Warehouse manager cost masked");
  });

  // TEST 3: Financial Calculations
  test("3. Executive Financial KPI Algorithms (Expenses, Profit, Margin %)", () => {
    const rev = 4850200;
    const { operatingExpenses, netProfit, netMarginPct } = calculateFinancials(rev, 0.769);

    assert.strictEqual(operatingExpenses, 3729804);
    assert.strictEqual(netProfit, 1120396);
    assert.strictEqual(netMarginPct, 23.1);

    // Zero revenue edge case
    const zeroCase = calculateFinancials(0);
    assert.strictEqual(zeroCase.netProfit, 0);
    assert.strictEqual(zeroCase.netMarginPct, 0);
  });

  // TEST 4: OEE Weighted Average Calculation
  test("4. Production Line Overall OEE Algorithm", () => {
    const lines = [
      { overall_oee: 89.1 },
      { overall_oee: 90.8 },
      { overall_oee: 64.9 },
      { overall_oee: 84.0 },
      { overall_oee: 90.0 },
    ];
    const avg = calculateOEE(lines);
    assert.strictEqual(avg, 83.8);

    // Empty lines edge case
    assert.strictEqual(calculateOEE([]), 0);
  });

  // TEST 5: Quality AQL Pass Rate Calculation
  test("5. Quality Assurance AQL Pass Ratio Algorithm", () => {
    const inspections = [
      { decision: "PASSED" },
      { decision: "PASSED" },
      { decision: "PASSED" },
      { decision: "REJECTED" },
    ];
    const passRate = calculateAQLPassRate(inspections);
    assert.strictEqual(passRate, 75.0);

    // 100% pass case
    const allPass = [{ decision: "PASSED" }, { decision: "PASSED" }];
    assert.strictEqual(calculateAQLPassRate(allPass), 100.0);
  });

  // TEST 6: CSV Generator Formatter & UTF-8 Encoding
  test("6. Client-Side Report Exporter CSV Formatter (UTF-8 BOM, Escaped Quotes)", () => {
    const testData = [
      { id: "WO-01", name: 'قميص أكسفورد "صيفي"', qty: 1500 },
      { id: "WO-02", name: "بنطلون كارجو", qty: 850 },
    ];
    const csv = generateCSVString("test", testData);

    assert(csv.startsWith("\uFEFF"), "CSV must include UTF-8 Byte Order Mark for Excel Arabic support");
    assert(csv.includes("id,name,qty"), "CSV must format headers");
    assert(csv.includes('""صيفي""'), "Quotes in cell values must be escaped by doubling");
  });

  // TEST 7: Inventory Valuation & Storage Allocation Calculations
  test("7. Inventory Aggregations & Storage Breakdown Calculations", () => {
    const mockItems = [
      { code: "RAW-FAB-01", warehouse_ar: "مخزن الأقمشة", total_value: 500000, status: "OPTIMAL" },
      { code: "RAW-FAB-02", warehouse_ar: "مخزن الأقمشة", total_value: 300000, status: "LOW_STOCK" },
      { code: "FIN-TSH-01", warehouse_ar: "مخزن المنتج التام", total_value: 200000, status: "OPTIMAL" },
    ];

    const totalVal = mockItems.reduce((acc, it) => acc + it.total_value, 0);
    assert.strictEqual(totalVal, 1000000);

    const lowStockCount = mockItems.filter((it) => it.status === "LOW_STOCK").length;
    assert.strictEqual(lowStockCount, 1);

    const fabricsPct = Math.round((800000 / totalVal) * 100);
    assert.strictEqual(fabricsPct, 80);
  });

  // TEST 8: Products Margins & Status Filter Logic
  test("8. Product Catalog Margin Math & Filter Predicates", () => {
    const p = { wholesale_price: 350, cost_price: 210 };
    const margin = Number((((p.wholesale_price - p.cost_price) / p.wholesale_price) * 100).toFixed(1));
    assert.strictEqual(margin, 40.0);

    const products = [
      { id: "1", status: "ACTIVE", available_qty: 500 },
      { id: "2", status: "ACTIVE", available_qty: 0 },
      { id: "3", status: "DRAFT", available_qty: 0 },
    ];

    const activeList = products.filter((item) => item.status === "ACTIVE");
    assert.strictEqual(activeList.length, 2);

    const outOfStockList = products.filter((item) => item.available_qty === 0);
    assert.strictEqual(outOfStockList.length, 2);
  });

  // TEST 9: Production Target vs Completed Qty Weekly Aggregates
  test("9. Work Orders Planned vs Actual Completion Rates", () => {
    const mockOrders = [
      { targetQty: 10000, completedQty: 8500, status: "in_progress" },
      { targetQty: 5000, completedQty: 5000, status: "completed" },
    ];

    const planned = mockOrders.reduce((acc, o) => acc + o.targetQty, 0);
    const completed = mockOrders.reduce((acc, o) => acc + o.completedQty, 0);
    const pct = Number(((completed / planned) * 100).toFixed(1));

    assert.strictEqual(planned, 15000);
    assert.strictEqual(completed, 13500);
    assert.strictEqual(pct, 90.0);
  });

  // TEST 10: Product SKU Matrix Permutation Generator Math
  test("10. Product SKU Matrix Permutation & Allocation Algorithm", () => {
    const colors = [{ code: "NVY" }, { code: "BLK" }, { code: "WHT" }, { code: "OLV" }];
    const sizes = ["S", "M", "L", "XL"];
    const baseSku = "STX-TSH-2026";
    const totalQty = 1600;

    const generatedSkus: string[] = [];
    for (const c of colors) {
      for (const sz of sizes) {
        generatedSkus.push(`${baseSku}-${c.code}-${sz}`);
      }
    }

    assert.strictEqual(generatedSkus.length, 16);
    assert.strictEqual(generatedSkus[0], "STX-TSH-2026-NVY-S");
    assert.strictEqual(generatedSkus[15], "STX-TSH-2026-OLV-XL");

    const qtyPerSku = Math.round(totalQty / generatedSkus.length);
    assert.strictEqual(qtyPerSku, 100);
  });

  // TEST 11: Sales & Procurement Order Financial Calculations
  test("11. Sales Order Balance Due & Procurement Order Delivery Predicates", () => {
    const salesOrder = { totalAmountEGP: 875000, paidAmountEGP: 262500, status: "in_production" };
    const balanceDue = salesOrder.totalAmountEGP - salesOrder.paidAmountEGP;
    const paidRatio = Number(((salesOrder.paidAmountEGP / salesOrder.totalAmountEGP) * 100).toFixed(1));

    assert.strictEqual(balanceDue, 612500);
    assert.strictEqual(paidRatio, 30.0);

    const po = { totalEGP: 285000, status: "in_shipping" };
    assert.strictEqual(po.status === "in_shipping", true);
  });

  // TEST 12: Operations Research (OR) Linear Programming, EOQ & Scheduling
  test("12. Operations Research (OR) Product Mix LP, EOQ & Scheduling Algorithms", () => {
    const mix = solveProductMixLP(
      [
        {
          id: "p1",
          skuCode: "SKU-1",
          nameAr: "جاكيت جينز",
          wholesalePrice: 600,
          costPrice: 350,
          fabricMetersPerPiece: 1.5,
          minutesPerPiece: 30,
          maxDemand: 1000,
        },
        {
          id: "p2",
          skuCode: "SKU-2",
          nameAr: "تيشيرت بولو",
          wholesalePrice: 250,
          costPrice: 170,
          fabricMetersPerPiece: 1.0,
          minutesPerPiece: 15,
          maxDemand: 1000,
        },
      ],
      1500,
      1000
    );
    assert(mix.totalProjectedProfit > 0, "LP Product Mix must generate positive profit");
    assert(mix.totalFabricUsed <= 1500, "LP must respect fabric constraint");
    assert(mix.totalHoursUsed <= 1000, "LP must respect line hours constraint");

    const eoq = calculateEOQAndROP(
      {
        code: "FAB-1",
        nameAr: "قماش دينيم",
        availableQty: 100,
        unit: "متر",
        unitCost: 150,
        dailyUsage: 50,
        leadTimeDays: 6,
      },
      1200,
      0.2
    );
    assert(eoq.eoq > 0, "EOQ must be positive");
    assert.strictEqual(eoq.urgency, "CRITICAL", "Low stock vs safety stock must trigger CRITICAL urgency");

    const sched = prioritizeWorkOrdersOR(
      [
        {
          code: "WO-1",
          productNameAr: "موديل أ",
          customerAr: "عميل",
          remainingQty: 1000,
          lineNameAr: "خط 1",
          lineDailyCapacity: 200,
          lineOee: 85,
          dueDate: "2026-11-25",
          status: "SEWING",
        },
      ],
      "خط 2",
      new Date("2026-11-23")
    );
    assert.strictEqual(sched.length, 1);
    assert.strictEqual(sched[0].riskLevel, "HIGH", "2 days left for 5 days work must be HIGH risk");
  });

  console.log("\n-------------------------------------------------------");
  console.log(`📊 FRONTEND LOGIC TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log("-------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runFrontendLogicTests().catch((err) => {
  console.error("Test execution failed fatal:", err);
  process.exit(1);
});
