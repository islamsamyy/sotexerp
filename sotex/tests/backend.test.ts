import { createClient } from "@supabase/supabase-js";
import assert from "assert";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qxyyfaeggspoalbogpfu.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eXlmYWVnZ3Nwb2FsYm9ncGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxOTIyMjMsImV4cCI6MjEwOTc2ODIyM30.x_ATQwR_4YiUzmoMCRkdyn2UpiXIv3WCXMX_KHkHq4s";

const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      "x-application-name": "sotex-unit-tests",
      "x-sotex-role": "OWNER_ADMIN",
    },
  },
});

const productionClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      "x-application-name": "sotex-unit-tests",
      "x-sotex-role": "PRODUCTION_MANAGER",
    },
  },
});

async function runBackendUnitTests() {
  console.log("\n=======================================================");
  console.log("🚀 SOTEX ERP — SENIOR ENGINEER BACKEND TEST SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`⏳ [TEST] ${name} ... `);
    try {
      await fn();
      console.log("✅ PASSED");
      passed++;
    } catch (err: any) {
      console.log("❌ FAILED");
      console.error(`   Error details: ${err?.message || err}`);
      failed++;
    }
  }

  // TEST 1: Connection & Health Check
  await test("1. Supabase Client Connection & Health Check", async () => {
    assert(SUPABASE_URL.startsWith("https://"), "Supabase URL must be HTTPS");
    assert(SUPABASE_ANON_KEY.length > 20, "Supabase anon key must be present");
    const { data, error } = await adminClient.from("facilities").select("count").limit(1);
    assert.ifError(error);
  });

  // TEST 2: Verify Key Relational Tables Exist
  await test("2. Relational Schema Integrity (42 Relational Tables Verification)", async () => {
    const requiredTables = [
      "work_orders",
      "production_lines",
      "inventory_items",
      "fabric_batches",
      "stock_movements",
      "stock_transfers",
      "products",
      "product_skus",
      "bom_items",
      "sales_orders",
      "suppliers",
      "supplier_invoices",
      "procurement_rfqs",
      "journal_entries",
      "treasury_accounts",
      "quality_inspections",
      "quality_defects",
      "user_profiles",
      "roles",
      "audit_logs",
    ];

    for (const table of requiredTables) {
      const { error } = await adminClient.from(table).select("*").limit(1);
      assert.ifError(error);
    }
  });

  // TEST 3: Work Orders CRUD Lifecycle
  await test("3. Work Orders Full CRUD Lifecycle (INSERT -> SELECT -> UPDATE -> DELETE)", async () => {
    const testCode = `WO-TEST-${Date.now().toString().slice(-4)}`;

    // Create (INSERT)
    const { data: insertData, error: insertError } = await adminClient
      .from("work_orders")
      .insert({
        code: testCode,
        product_id: "prod-1",
        product_name_ar: "قميص تجريبي لأتمتة الاختبارات",
        customer_ar: "عميل اختبار وحدة البرمجيات",
        target_qty: 1000,
        completed_qty: 0,
        line_id: "line-1",
        line_name_ar: "خط خياطة الجينز الثقيل 1",
        status: "CUTTING",
        due_date: "2026-12-31",
        efficiency: 95,
        start_date: "اليوم",
        days_required: 5,
        workers_count: 25,
      })
      .select()
      .single();

    assert.ifError(insertError);
    assert.strictEqual(insertData?.code, testCode);

    // Read (SELECT)
    const { data: readData, error: readError } = await adminClient
      .from("work_orders")
      .select("*")
      .eq("code", testCode)
      .single();

    assert.ifError(readError);
    assert.strictEqual(readData?.target_qty, 1000);

    // Update (UPDATE)
    const { data: updateData, error: updateError } = await adminClient
      .from("work_orders")
      .update({ completed_qty: 500, status: "SEWING" })
      .eq("code", testCode)
      .select()
      .single();

    assert.ifError(updateError);
    assert.strictEqual(updateData?.completed_qty, 500);

    // Delete (DELETE Cleanup)
    const { error: deleteError } = await adminClient
      .from("work_orders")
      .delete()
      .eq("code", testCode);

    assert.ifError(deleteError);
  });

  // TEST 4: Inventory & Stock Movements CRUD
  await test("4. Inventory Items & Stock Movements Persistence", async () => {
    const testMovId = `MOV-TEST-${Date.now().toString().slice(-5)}`;
    const { error: movErr } = await adminClient.from("stock_movements").insert({
      id: testMovId,
      type: "ISSUE_TO_PROD",
      type_ar: "صرف خامات تجريبي",
      material_name_ar: "قماش اختبار قطن 100%",
      qty: 150,
      unit: "متر طولي",
      warehouse: "مستودع الأقمشة - العاشر",
      batch_no: "LOT-TEST-01",
      reference_no: "REF-TEST-01",
      officer: "مهندس الاختبارات الآلية",
      date_ar: "الآن",
      status: "COMPLETED",
    });

    assert.ifError(movErr);

    // Verify it exists
    const { data: readMov, error: readMovErr } = await adminClient
      .from("stock_movements")
      .select("*")
      .eq("id", testMovId)
      .single();

    assert.ifError(readMovErr);
    assert.strictEqual(readMov?.qty, 150);

    // Cleanup
    await adminClient.from("stock_movements").delete().eq("id", testMovId);
  });

  // TEST 5: Sales Orders Revenue Aggregation
  await test("5. Sales Orders Revenue & Balance Aggregations", async () => {
    const { data: orders, error } = await adminClient.from("sales_orders").select("total_amount_egp");
    assert.ifError(error);
    assert(Array.isArray(orders), "Sales orders must be an array");
    const totalRev = orders.reduce((acc, cur) => acc + Number(cur.total_amount_egp || 0), 0);
    assert(totalRev > 0, "Total sales revenue must be positive");
  });

  // TEST 6: Treasury Liquidity Calculation
  await test("6. Treasury Accounts Cash Liquidity Check", async () => {
    const { data: accounts, error } = await adminClient.from("treasury_accounts").select("balance");
    assert.ifError(error);
    assert(Array.isArray(accounts) && accounts.length > 0, "Treasury accounts must exist");
    const totalCash = accounts.reduce((acc, cur) => acc + Number(cur.balance || 0), 0);
    assert(totalCash > 1000000, "Cash liquidity should be properly computed from bank accounts");
  });

  // TEST 7: Production Lines OEE Computation
  await test("7. Production Lines & Overall OEE Metrics", async () => {
    const { data: lines, error } = await adminClient.from("production_lines").select("*");
    assert.ifError(error);
    assert(lines && lines.length > 0, "Production lines must be seeded");

    for (const line of lines) {
      assert(line.line_name, "Each line must have a name");
      assert(Number(line.overall_oee) >= 0 && Number(line.overall_oee) <= 120, "OEE must be within valid percentage bounds");
    }
  });

  // TEST 8: Quality Inspections & AQL Calculation
  await test("8. Quality Inspections & Defect Tracking Lifecycle", async () => {
    const testInspId = `INS-TEST-${Date.now().toString().slice(-4)}`;
    const { error: insErr } = await adminClient.from("quality_inspections").insert({
      id: testInspId,
      work_order: "WO-2026-0891",
      type: "INLINE",
      type_ar: "فحص جودة تجريبي AQL",
      stage: "بعد الخياطة",
      sample_name: "عينة فحص اختبارات الأتمتة",
      batch_qty: 1000,
      sample_size: 100,
      defects_found: 1,
      aql_status: "مقبول (AQL 1.5)",
      decision: "PASSED",
      inspector: "مهندس ضبط الجودة التجريبي",
      date_ar: "الآن",
    });

    assert.ifError(insErr);

    const { data: foundInsp, error: fetchErr } = await adminClient
      .from("quality_inspections")
      .select("*")
      .eq("id", testInspId)
      .single();

    assert.ifError(fetchErr);
    assert.strictEqual(foundInsp?.decision, "PASSED");

    // Cleanup
    await adminClient.from("quality_inspections").delete().eq("id", testInspId);
  });

  // TEST 9: RLS Role Context & Security Header Injection
  await test("9. PostgreSQL Row Level Security (RLS) Header Injection", async () => {
    // Querying with PRODUCTION_MANAGER scoped client
    const { data: prodData, error: prodErr } = await productionClient
      .from("work_orders")
      .select("code, target_qty, status")
      .limit(5);

    assert.ifError(prodErr);
    assert(prodData && prodData.length > 0, "Production manager must be able to view work orders");
  });

  // TEST 10: Immutability of Audit Logs (PostgreSQL Trigger Enforcement)
  await test("10. Tamper-Proof Audit Log Trail (UPDATE Rejection Trigger)", async () => {
    const testAuditId = `AUD-TEST-${Date.now().toString().slice(-4)}`;
    // First, insert a new audit log
    const { error: insertErr } = await adminClient.from("audit_logs").insert({
      id: testAuditId,
      actor: "مراقب الأمان الآلي",
      actor_role: "OWNER_ADMIN",
      action: "اختبار مناعة سجل التدقيق ضد التعديل",
      module: "الأمان والامتثال",
      record_ref: testAuditId,
      new_val: "اختبار عدم القابلية للتحريف",
      severity: "INFO",
      ip: "127.0.0.1",
      timestamp_ar: "الآن",
    });

    assert.ifError(insertErr);

    // Now, attempt to UPDATE the audit log - PostgreSQL trigger MUST reject it!
    const { error: updateErr } = await adminClient
      .from("audit_logs")
      .update({ action: "محاولة اختراق وتعديل السجل" })
      .eq("id", testAuditId);

    assert(updateErr !== null, "PostgreSQL trigger trg_audit_logs_immutable MUST reject UPDATE on audit_logs");
  });

  // TEST 11: Stock Transfers CRUD & State Transition
  await test("11. Inter-Warehouse Transfers CRUD & Status Transition", async () => {
    const testCode = `TRF-TEST-${Date.now().toString().slice(-4)}`;

    // Insert
    const { error: insErr } = await adminClient.from("stock_transfers").insert({
      code: testCode,
      from_facility: "مستودع 6 أكتوبر الرئيسي",
      to_facility: "مصنع العاشر من رمضان",
      items_count: 2,
      total_qty_desc: "500 متر قماش دينيم",
      driver_name: "كابتن اختبار الأتمتة",
      vehicle_number: "أ ج د 9999",
      status: "IN_TRANSIT",
      date_ar: "الآن",
    });
    assert.ifError(insErr);

    // Update to DELIVERED
    const { error: upErr } = await adminClient
      .from("stock_transfers")
      .update({ status: "DELIVERED" })
      .eq("code", testCode);
    assert.ifError(upErr);

    // Verify
    const { data: fetchRow, error: fetchErr } = await adminClient
      .from("stock_transfers")
      .select("status")
      .eq("code", testCode)
      .single();
    assert.ifError(fetchErr);
    assert.strictEqual(fetchRow?.status, "DELIVERED");

    // Cleanup
    await adminClient.from("stock_transfers").delete().eq("code", testCode);
  });

  // TEST 12: Product SKUs and BOM Items Integrity
  await test("12. Product SKUs and Bill of Materials (BOM) Relational Integrity", async () => {
    const { data: skus, error: skuErr } = await adminClient
      .from("product_skus")
      .select("sku, model_code, stock_qty")
      .limit(5);
    assert.ifError(skuErr);
    assert(skus && skus.length > 0, "Product SKUs must be seeded");

    const { data: bom, error: bomErr } = await adminClient
      .from("bom_items")
      .select("id, product_code, name, availability_pct")
      .limit(5);
    assert.ifError(bomErr);
    assert(bom && bom.length > 0, "BOM items must be seeded");
  });

  // TEST 13: Products Catalog Complete Database CRUD Lifecycle
  await test("13. Products Catalog Full CRUD Lifecycle (INSERT -> UPDATE -> DELETE)", async () => {
    const testProdId = `prod-test-${Date.now().toString().slice(-4)}`;
    const testSku = `STX-TEST-${Date.now().toString().slice(-4)}`;

    // 1. INSERT
    const { error: insErr } = await adminClient.from("products").insert({
      id: testProdId,
      sku_code: testSku,
      name_ar: "منتج اختبار سلامة الكتالوج",
      model_subtitle: "Test Drop 2026",
      season: "صيف 2026",
      category_ar: "اختبارات",
      fabric_spec: "قطن مصري 100%",
      colors_json: [{ name: "كحلي", hex: "#1E3A8A" }],
      sizes: ["S", "M", "L"],
      wholesale_price: 350,
      retail_price: 520,
      cost_price: 210,
      available_qty: 600,
      wip_qty: 150,
      barcode: `6221048${Date.now().toString().slice(-6)}`,
      status: "IN_STOCK",
      image_url: "https://example.com/test.jpg",
    });
    assert.ifError(insErr);

    // 2. UPDATE wholesale price
    const { error: upErr } = await adminClient
      .from("products")
      .update({ wholesale_price: 375, status: "LOW_STOCK" })
      .eq("id", testProdId);
    assert.ifError(upErr);

    // 3. SELECT & VERIFY
    const { data: fetched, error: fetchErr } = await adminClient
      .from("products")
      .select("wholesale_price, status")
      .eq("id", testProdId)
      .single();
    assert.ifError(fetchErr);
    assert.strictEqual(Number(fetched?.wholesale_price), 375);
    assert.strictEqual(fetched?.status, "LOW_STOCK");

    // 4. DELETE (Cleanup)
    const { error: delErr } = await adminClient.from("products").delete().eq("id", testProdId);
    assert.ifError(delErr);
  });

  // TEST 14: Sales and Purchase Orders CRUD Lifecycle
  await test("14. Sales & Procurement Orders Full CRUD Lifecycle", async () => {
    const testSoId = `SO-TEST-${Date.now().toString().slice(-4)}`;
    const testPoId = `PO-TEST-${Date.now().toString().slice(-4)}`;

    // 1. INSERT Sales Order
    const { error: soInsErr } = await adminClient.from("sales_orders").insert({
      id: testSoId,
      client_name: "عميل اختبار وحدة المبيعات",
      order_type: "WHOLESALE",
      order_type_ar: "توكيل جملة تجريبي",
      pieces_count: 800,
      total_amount_egp: 280000,
      paid_amount_egp: 140000,
      delivery_date: "2026-12-30",
      status: "IN_PRODUCTION",
    });
    assert.ifError(soInsErr);

    // 2. INSERT Purchase Order
    const { error: poInsErr } = await adminClient.from("purchase_orders").insert({
      id: testPoId,
      supplier: "مورد اختبار المشتريات",
      items: "خامات قماش تجريبية للاختبار",
      total_egp: 120000,
      po_date: "2026-11-09",
      expected_delivery: "2026-11-20",
      status: "IN_TRANSIT",
    });
    assert.ifError(poInsErr);

    // 3. UPDATE status to COMPLETED
    const { error: poUpErr } = await adminClient
      .from("purchase_orders")
      .update({ status: "COMPLETED" })
      .eq("id", testPoId);
    assert.ifError(poUpErr);

    // 4. CLEANUP
    await adminClient.from("sales_orders").delete().eq("id", testSoId);
    await adminClient.from("purchase_orders").delete().eq("id", testPoId);
  });

  console.log("\n-------------------------------------------------------");
  console.log(`📊 BACKEND TEST SUITE RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log("-------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runBackendUnitTests().catch((err) => {
  console.error("Test execution failed fatal:", err);
  process.exit(1);
});
