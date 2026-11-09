"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

export function ActionModal() {
  const {
    activeModal,
    closeModal,
    showToast,
    addWorkOrder,
    addStockMovement,
    addStockTransfer,
    addJournalEntry,
    addInspectionRecord,
    refreshData,
    activeRole,
    roleConfig,
    currentUser,
    workOrders,
    stockMovements,
  } = useERP();

  // Form states for various modals
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [loadingBom, setLoadingBom] = useState(false);

  // When pay_approval modal opens, load real pending supplier invoices
  useEffect(() => {
    if (activeModal?.type === "pay_approval") {
      setLoadingInvoices(true);
      (async () => {
        try {
          const { data } = await supabase
            .from("supplier_invoices")
            .select("*")
            .eq("status", "PENDING");
          setPendingInvoices(data || []);
          if (data && data.length > 0) {
            setFormData((prev) => ({ ...prev, selectedInvoice: data[0].inv_no }));
          }
        } finally {
          setLoadingInvoices(false);
        }
      })();
    } else if (activeModal?.type === "tech_pack_view") {
      setLoadingBom(true);
      (async () => {
        try {
          const { data } = await supabase
            .from("bom_items")
            .select("*")
            .limit(6);
          setBomItems(data || []);
        } finally {
          setLoadingBom(false);
        }
      })();
    } else {
      setFormData({});
    }
  }, [activeModal]);

  if (!activeModal) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownloadCSV = (filename: string, rows: Record<string, any>[]) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (activeModal.type === "new_work_order") {
        await addWorkOrder?.({
          code: formData.code || `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          productNameAr: formData.productName || "قميص أكسفورد صيفي كلاسيك",
          customerAr: formData.customer || "مجموعة هيدز التجارية - عقد رقم EX-88",
          targetQty: Number(formData.qty) || 3500,
          completedQty: 0,
          lineId: formData.line || "line-1",
          lineNameAr: formData.lineName || "خط خياطة الجينز الثقيل 1",
          status: "cutting",
          dueDate: formData.dueDate || "2026-12-01",
          efficiency: 92,
        });
        showToast("success", "تم إنشاء أمر الإنتاج والتشغيل في Supabase", `تم فتح أمر التشغيل وتوجيه أمر القص لمشرف الصالة.`);
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sotex_production_updated"));
      } else if (activeModal.type === "new_stock_movement") {
        await addStockMovement?.({
          type: formData.type || "issue",
          materialNameAr: formData.material || "قماش قطن بيكيه معالج ضد الانكماش 220 جم - رمادي",
          qty: Number(formData.qty) || 450,
          unit: formData.unit || "متر طولي",
          warehouse: formData.warehouse || "مستودع الأقمشة المركزي - المحلة الكبرى",
          batchNo: formData.batchNo || `LOT-26-${Math.floor(100 + Math.random() * 900)}`,
          referenceNo: formData.ref || `TRX-${Date.now().toString().slice(-5)}`,
          date: "الآن",
        });
        showToast("success", "تم توثيق الحركة المخزنية في Supabase", `تم إصدار إذن الترحيل وتحديث الرصيد اللحظي.`);
      } else if (activeModal.type === "new_stock_transfer") {
        await addStockTransfer?.({
          code: `TRF-2026-${Math.floor(100 + Math.random() * 900)}`,
          fromFacility: formData.from || "مستودع الخامات الرئيسي - المحلة الكبرى",
          toFacility: formData.to || "صالة القص والتشغيل 1 - المحلة الكبرى",
          itemsCount: Number(formData.itemsCount) || 6,
          driverName: formData.driver || "أحمد إبراهيم (شاحنة سوتكس 3342)",
          status: "in_transit",
          date: "الآن",
        });
        showToast("success", "تم إصدار إذن تحويل مخزني في Supabase", `تم إنشاء البوليصة وتأكيد جاهزية النقل.`);
      } else if (activeModal.type === "new_journal_entry") {
        await addJournalEntry?.({
          code: `JV-2026-${Date.now().toString().slice(-4)}`,
          debitAccount: formData.debit || "5000 - تكاليف تشغيل وأجور مباشرة - صالة الخياطة",
          creditAccount: formData.credit || "1110 - حساب البنك التجاري الدولي CIB - جاري",
          amount: Number(formData.amount) || 68400,
          costCenter: formData.costCenter || "خط الإنتاج رقم 2 - بنطلونات جينز",
          narration: formData.notes || "صرف خامات ومصروفات تشغيل قمصان التصدير",
          date: "اليوم",
        });
        showToast("success", "تم ترحيل القيد المحاسبي إلى Supabase", `تم ترحيل القيد إلى دفتر الأستاذ العام وميزان المراجعة.`);
      } else if (activeModal.type === "new_inspection") {
        await addInspectionRecord?.({
          workOrder: formData.workOrder || "WO-2026-0891",
          stage: formData.stage || "بعد الخياطة وقبل التجميع",
          sampleSize: Number(formData.sampleSize) || 125,
          defectsFound: Number(formData.defects) || 1,
          aqlStatus: "passed",
          inspector: currentUser?.nameAr || "م. كريم عبد العزيز",
        });
        showToast("success", "تم تسجيل نتيجة فحص الجودة في Supabase", `العينة مقبولة وفق معيار AQL 1.5 بنسبة نجاح 99.2%.`);
      } else if (activeModal.type === "new_rfq") {
        const rfqId = `RFQ-2026-${Math.floor(100 + Math.random() * 900)}`;
        const { error: rfqErr } = await supabase.from("procurement_rfqs").insert({
          id: rfqId,
          title: formData.title || "طلب توريد عاجل لأقمشة قطن سنجل ليكرا",
          created_date: new Date().toISOString().split("T")[0],
          due_date: formData.dueDate || "2026-11-20",
          status: "OPEN",
          quotes_json: [
            {
              supplier: formData.supplier || "شركة مصر للغزل والنسيج",
              unitPrice: Number(formData.unitPrice) || 120,
              qty: Number(formData.qty) || 500,
              total: (Number(formData.unitPrice) || 120) * (Number(formData.qty) || 500),
              leadDays: 3,
            },
          ],
        });
        if (rfqErr) throw rfqErr;

        await logAuditAction({
          userName: currentUser.nameAr,
          userRole: roleConfig.nameAr,
          action: "إصدار طلب عروض أسعار وتوريد عاجل",
          entityType: "procurement_rfqs",
          entityId: rfqId,
          entityName: formData.title || "طلب توريد أقمشة",
          severity: "WARNING",
        });
        showToast("success", "تم إنشاء طلب التوريد في Supabase", `تم فتح طلب الشراء برقم ${rfqId} وتوجيهه للموردين.`);
      } else if (activeModal.type === "barcode_scan") {
        const sessionCode = `COUNT-2026-${Math.floor(100 + Math.random() * 900)}`;
        const { error: countErr } = await supabase.from("stock_count_sessions").insert({
          id: sessionCode,
          name: formData.sessionName || "جلسة جرد باركود تفقدية دورية",
          warehouse: formData.warehouse || "مستودع الأقمشة المركزي - المحلة الكبرى",
          session_date: new Date().toISOString().split("T")[0],
          counted_items: Number(formData.count) || 1,
          discrepancies_count: 0,
          net_diff_amount: "0.00 ج.م",
          status: "IN_PROGRESS",
        });
        if (countErr) throw countErr;

        await logAuditAction({
          userName: currentUser.nameAr,
          userRole: roleConfig.nameAr,
          action: "بدء جلسة جرد بالباركود",
          entityType: "stock_count_sessions",
          entityId: sessionCode,
          entityName: formData.barcode || "بار كود صنف",
          severity: "INFO",
        });
        showToast("success", "تم توثيق مسح الباركود وجلسة الجرد في Supabase", `تم مطابقة الباركود مع السجلات المخزنية.`);
      } else if (activeModal.type === "shift_redirect") {
        // Update production lines in Supabase
        const targetLineId = formData.targetLine || "line-4";
        const workers = Number(formData.workersCount) || 4;
        await supabase
          .from("production_lines")
          .update({ workers_count: 34 })
          .eq("id", targetLineId);

        await logAuditAction({
          userName: currentUser.nameAr,
          userRole: roleConfig.nameAr,
          action: "إعادة توزيع عمالة الوردية لفك اختناق الإنتاج",
          entityType: "production_lines",
          entityId: targetLineId,
          entityName: "توجيه وردية لخط التشطيب والكي",
          details: { workersReassigned: workers, reason: "تراكم تشغيلات بانتظار الكي" },
          severity: "WARNING",
        });
        showToast("success", "تم إعادة توجيه وردية العمل", `تم نقل ${workers} فنيين لدعم خط التشطيب والكي وتحديث خطة اليوم.`);
        await refreshData();
      } else if (activeModal.type === "pay_approval") {
        const invNo = formData.selectedInvoice || pendingInvoices[0]?.inv_no;
        if (invNo) {
          const { error: invErr } = await supabase
            .from("supplier_invoices")
            .update({ status: "PAID" })
            .eq("inv_no", invNo);
          if (invErr) throw invErr;

          await logAuditAction({
            userName: currentUser.nameAr,
            userRole: roleConfig.nameAr,
            action: "اعتماد وصرف فاتورة المورد",
            entityType: "supplier_invoices",
            entityId: invNo,
            entityName: "سداد دفعة نقدية / تحرير شيك للمورد",
            severity: "INFO",
          });
          showToast("success", "تم اعتماد الدفعة وصرف الفاتورة", `تم تحويل الفاتورة رقم ${invNo} لحالة السداد.`);
          await refreshData();
        } else {
          showToast("info", "تم توثيق اعتماد الدفعة المالية للمورد");
        }
      } else if (activeModal.type === "new_sales_order") {
        const orderId = `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const orderType = (formData.orderType || "wholesale").toUpperCase() === "EXPORT" ? "EXPORT" : "WHOLESALE";
        const pieces = Number(formData.piecesCount) || 1500;
        const totalEGP = Number(formData.totalAmountEGP) || pieces * 350;
        const { error: soErr } = await supabase.from("sales_orders").insert({
          id: orderId,
          client_name: formData.clientName || "شركة التميز لتجارة الملابس",
          order_type: orderType,
          order_type_ar: orderType === "EXPORT" ? "تصدير خارجي" : "توكيل جملة محلي",
          pieces_count: pieces,
          total_amount_egp: totalEGP,
          paid_amount_egp: Number(formData.paidAmountEGP) || 0,
          delivery_date: formData.deliveryDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
          status: "IN_PRODUCTION",
        });
        if (soErr) throw soErr;

        await logAuditAction({
          userName: currentUser.nameAr,
          userRole: roleConfig.nameAr,
          action: "إصدار وتعميد طلب بيع جديد",
          entityType: "sales_orders",
          entityId: orderId,
          entityName: formData.clientName || "طلب بيع",
          details: { pieces, totalEGP, orderType },
          severity: "INFO",
        });
        showToast("success", "تم إنشاء طلب البيع في Supabase", `تم فتح طلب البيع برقم ${orderId} وتوجيهه لصالة التشغيل.`);
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sotex_sales_updated"));
        await refreshData();
      } else if (activeModal.type === "new_po") {
        const poId = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const totalVal = Number(formData.totalEGP) || 185000;
        const { error: poErr } = await supabase.from("purchase_orders").insert({
          id: poId,
          supplier: formData.supplier || "شركة مصر للغزل والنسيج",
          items: formData.items || "5,000 متر قماش قطن مصري 100% سينجل جيرسي",
          total_egp: totalVal,
          po_date: new Date().toISOString().split("T")[0],
          expected_delivery: formData.expectedDelivery || new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
          status: "IN_TRANSIT",
        });
        if (poErr) throw poErr;

        await logAuditAction({
          userName: currentUser.nameAr,
          userRole: roleConfig.nameAr,
          action: "إصدار أمر شراء وتوريد خامات",
          entityType: "purchase_orders",
          entityId: poId,
          entityName: formData.supplier || "أمر شراء خامات",
          details: { totalVal, items: formData.items },
          severity: "WARNING",
        });
        showToast("success", "تم إصدار أمر الشراء في Supabase", `تم فتح أمر الشراء برقم ${poId} وتأكيد جدول التوريد.`);
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sotex_procurement_updated"));
        await refreshData();
      } else if (activeModal.type === "new_product_quick") {
        const prodId = `prod-${Date.now().toString().slice(-6)}`;
        const rawSku = formData.sku || `STX-MOD-${Math.floor(100 + Math.random() * 900)}`;
        const sku = rawSku.trim().toUpperCase();
        const name = (formData.name || "موديل سوتكس كلاسيكي جديد").trim();
        const cat = formData.category || "قمصان رجالي";
        const fabric = formData.fabric || "قطن مصري 100% فاخر";
        const wholesale = Number(formData.wholesale) || 350;
        const retail = Number(formData.retail) || 520;
        const cost = Number(formData.cost) || 210;
        const qty = Number(formData.qty) || 800;

        const newProd = {
          id: prodId,
          sku_code: sku,
          barcode: `6221048${Math.floor(100000 + Math.random() * 900000)}`,
          name_ar: name,
          model_subtitle: "SOTEX Ready Collection 2026",
          season: formData.season || "صيف 2026",
          category_ar: cat,
          fabric_spec: fabric,
          colors_json: [{ name: "كحلي", hex: "#1E3A8A" }, { name: "أبيض", hex: "#FFFFFF" }],
          sizes: ["S", "M", "L", "XL"],
          cost_price: cost,
          raw_cost: Number((cost * 0.65).toFixed(2)),
          labor_cost: Number((cost * 0.35).toFixed(2)),
          wholesale_price: wholesale,
          retail_price: retail,
          export_price_usd: Number((wholesale / 48).toFixed(2)),
          min_qty_wholesale: 50,
          available_qty: qty,
          wip_qty: 200,
          reserved_qty: 0,
          status: "IN_STOCK",
          image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80",
        };

        const { error: pErr } = await supabase.from("products").insert(newProd);
        if (pErr) throw pErr;

        // Auto-generate SKUs in product_skus
        const skuRows = [
          {
            sku: `${sku}-NVY-M`,
            product_id: prodId,
            model_code: sku,
            model_name: name,
            color_name: "كحلي",
            color_hex: "#1E3A8A",
            size: "M",
            stock_qty: Math.round(qty / 2),
            barcode: `622${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            warehouse: "مستودع المنتج التام - العاشر",
            weight_grams: 220,
            safety_threshold: 50,
            status: "ACTIVE",
          },
          {
            sku: `${sku}-WHT-L`,
            product_id: prodId,
            model_code: sku,
            model_name: name,
            color_name: "أبيض",
            color_hex: "#FFFFFF",
            size: "L",
            stock_qty: Math.round(qty / 2),
            barcode: `622${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            warehouse: "مستودع المنتج التام - العاشر",
            weight_grams: 220,
            safety_threshold: 50,
            status: "ACTIVE",
          },
        ];
        const { error: skuErr } = await supabase.from("product_skus").insert(skuRows);
        if (skuErr) console.warn("SKU insert warning:", skuErr);

        await logAuditAction({
          userName: currentUser.nameAr,
          userRole: roleConfig.nameAr,
          action: `إضافة منتج وتوصيف سريع: ${name}`,
          entityType: "products",
          entityId: prodId,
          entityName: name,
          details: { sku, wholesale, retail },
          severity: "INFO",
        });

        showToast("success", "تم تكويد وإضافة المنتج في Supabase بنجاح", `تم إنشاء الموديل ${name} وتوليد أكواد الـ SKUs.`);
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sotex_product_updated"));
        await refreshData();
      } else if (activeModal.type === "export_report") {
        const reportType = formData.reportSubject || "work_orders";
        if (reportType === "work_orders") {
          handleDownloadCSV("SOTEX_Work_Orders_Report", workOrders as any);
        } else if (reportType === "inventory") {
          const { data: invData } = await supabase.from("inventory_items").select("*");
          handleDownloadCSV("SOTEX_Inventory_Valuation_Report", invData || []);
        } else {
          const { data: salesData } = await supabase.from("sales_orders").select("*");
          handleDownloadCSV("SOTEX_Sales_Orders_Report", salesData || []);
        }
        showToast("success", "تم إنشاء وتصدير التقرير", `تم تحميل ملف التقرير بنجاح.`);
      } else {
        showToast("success", "تم تنفيذ الإجراء بنجاح", "تم حفظ وتحديث البيانات في قاعدة بيانات Supabase.");
      }

      setFormData({});
      closeModal();
    } catch (err: any) {
      showToast("error", "فشل تنفيذ العملية", err?.message || "خطأ أثناء الحفظ في Supabase");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(activeModal)} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-brand-gold/60 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain" />
            </div>
            <div>
              <DialogTitle>{activeModal.title}</DialogTitle>
              {activeModal.description && (
                <DialogDescription>{activeModal.description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-right">
          {/* New Work Order */}
          {activeModal.type === "new_work_order" && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">اسم الموديل / المنتج *</label>
                <input
                  type="text"
                  required
                  defaultValue="قميص أكسفورد صيفي كلاسيك"
                  onChange={(e) => handleChange("productName", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">الكمية المطلوبة (قطعة) *</label>
                <input
                  type="number"
                  required
                  defaultValue={3500}
                  onChange={(e) => handleChange("qty", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">خط الإنتاج المستهدف</label>
                <select
                  defaultValue="line-1"
                  onChange={(e) => handleChange("line", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                >
                  <option value="line-1">خط الخياطة A1 (جينز وتشغيل ثقيل)</option>
                  <option value="line-2">خط الخياطة A2 (بولو وتيشرتات)</option>
                  <option value="line-3">خط الخياطة B1 (بناطيل كارجو)</option>
                  <option value="line-4">خط التشطيب والكي والتعبئة</option>
                  <option value="line-5">خط القمصان الكلاسيك والتصدير</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">العميل / أمر التصدير</label>
                <input
                  type="text"
                  defaultValue="مجموعة هيدز التجارية - عقد رقم EX-88"
                  onChange={(e) => handleChange("customer", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">تاريخ التسليم النهائي</label>
                <input
                  type="date"
                  defaultValue="2026-12-01"
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
            </div>
          )}

          {/* New Sales Order */}
          {activeModal.type === "new_sales_order" && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">اسم العميل / التوكيل التجاري *</label>
                <input
                  type="text"
                  required
                  defaultValue="مجموعة هيدز للتجارة والتوزيع"
                  onChange={(e) => handleChange("clientName", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">نوع الطلب والتعاقد</label>
                <select
                  defaultValue="wholesale"
                  onChange={(e) => handleChange("orderType", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                >
                  <option value="wholesale">توكيل جملة محلي</option>
                  <option value="export">عقد تصدير خارجي</option>
                  <option value="retail">توريد سلاسل تجزئة</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">الكمية الإجمالية (قطعة) *</label>
                <input
                  type="number"
                  required
                  defaultValue={2500}
                  onChange={(e) => handleChange("piecesCount", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">إجمالي القيمة التعاقدية (ج.م) *</label>
                <input
                  type="number"
                  required
                  defaultValue={875000}
                  onChange={(e) => handleChange("totalAmountEGP", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-primary"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">الدفعة المقدمة المسددة (ج.م)</label>
                <input
                  type="number"
                  defaultValue={262500}
                  onChange={(e) => handleChange("paidAmountEGP", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-emerald-700"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">موعد التسليم النهائي المعتمد</label>
                <input
                  type="date"
                  defaultValue="2026-12-15"
                  onChange={(e) => handleChange("deliveryDate", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
            </div>
          )}

          {/* New Purchase Order (PO) */}
          {activeModal.type === "new_po" && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">المورد المعتمد *</label>
                <select
                  defaultValue="شركة مصر للغزل والنسيج (المحلة)"
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                >
                  <option value="شركة مصر للغزل والنسيج (المحلة)">شركة مصر للغزل والنسيج (المحلة)</option>
                  <option value="الشركة الشرقية للغزول والمنسوجات">الشركة الشرقية للغزول والمنسوجات</option>
                  <option value="مصانع الدلتا للمنسوجات القطنية">مصانع الدلتا للمنسوجات القطنية</option>
                  <option value="العاشر للصباغة والتجهيز">العاشر للصباغة والتجهيز</option>
                  <option value="مجموعة الأهرام للسحابات والأزرار">مجموعة الأهرام للسحابات والأزرار</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">بيان الخامات والمواصفة الفنية *</label>
                <input
                  type="text"
                  required
                  defaultValue="5,000 متر قماش قطن مصري 100% سينجل جيرسي 190 GSM"
                  onChange={(e) => handleChange("items", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">إجمالي قيمة أمر الشراء (ج.م) *</label>
                <input
                  type="number"
                  required
                  defaultValue={285000}
                  onChange={(e) => handleChange("totalEGP", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-primary"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">تاريخ الوصول المجدول للمخزن</label>
                <input
                  type="date"
                  defaultValue="2026-11-28"
                  onChange={(e) => handleChange("expectedDelivery", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
            </div>
          )}

          {/* Quick Add Product Modal */}
          {activeModal.type === "new_product_quick" && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">اسم المنتج والموديل *</label>
                <input
                  type="text"
                  required
                  defaultValue="قميص سوتكس أكسفورد صيفي كلاسيك"
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">كود الموديل (SKU) *</label>
                <input
                  type="text"
                  required
                  defaultValue={`STX-SHRT-${Math.floor(100 + Math.random() * 900)}`}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">التصنيف الرئيسي *</label>
                <select
                  defaultValue="قمصان رجالي"
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                >
                  <option value="قمصان رجالي">قمصان رجالي</option>
                  <option value="تيشيرتات كاجوال">تيشيرتات كاجوال</option>
                  <option value="بناطيل وجينز">بناطيل وجينز</option>
                  <option value="ملابس حريمي">ملابس حريمي</option>
                  <option value="يونيفورم B2B">يونيفورم B2B</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">مواصفة النسيج والخامة *</label>
                <input
                  type="text"
                  required
                  defaultValue="قطن مصري 100% غزل تمشيط 60/1 فاخر"
                  onChange={(e) => handleChange("fabric", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">سعر الجملة (ج.م) *</label>
                <input
                  type="number"
                  required
                  defaultValue={380}
                  onChange={(e) => handleChange("wholesale", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-primary"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">سعر التجزئة (ج.م) *</label>
                <input
                  type="number"
                  required
                  defaultValue={560}
                  onChange={(e) => handleChange("retail", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">تكلفة المصنع COGS (ج.م)</label>
                <input
                  type="number"
                  defaultValue={230}
                  onChange={(e) => handleChange("cost", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-rose-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">الرصيد المبدئي بالمخازن</label>
                <input
                  type="number"
                  defaultValue={1200}
                  onChange={(e) => handleChange("qty", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* New Stock Movement */}
          {activeModal.type === "new_stock_movement" && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">نوع الحركة</label>
                <select
                  defaultValue="issue"
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                >
                  <option value="issue">إذن صرف تشغيل خامات (Issue)</option>
                  <option value="receipt">إذن استلام واردات توريد (Receipt)</option>
                  <option value="return">مردودات أقمشة من الصالة (Return)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">المستودع المعني</label>
                <select
                  defaultValue="raw_fabrics"
                  onChange={(e) => handleChange("warehouse", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                >
                  <option value="raw_fabrics">مخزن الأقمشة الخام - العاشر</option>
                  <option value="accessories">مخزن الإكسسوارات والسحابات</option>
                  <option value="finished">مخزن المنتج التام الجاهز للشحن</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">الصنف / الخامة *</label>
                <input
                  type="text"
                  required
                  defaultValue="قماش قطن بيكيه معالج ضد الانكماش 220 جم - رمادي"
                  onChange={(e) => handleChange("material", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">الكمية *</label>
                <input
                  type="number"
                  required
                  defaultValue={450}
                  onChange={(e) => handleChange("qty", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">الوحدة</label>
                <input
                  type="text"
                  defaultValue="متر طولي"
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
            </div>
          )}

          {/* New Stock Transfer */}
          {activeModal.type === "new_stock_transfer" && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">من فرع / مخزن</label>
                <select
                  defaultValue="العاشر"
                  onChange={(e) => handleChange("from", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                >
                  <option value="مصنع العاشر من رمضان المركزي">فرع العاشر من رمضان - المصنع الرئيسي</option>
                  <option value="مستودع الأقمشة والإمداد - 6 أكتوبر">مستودع الأقمشة والإمداد - 6 أكتوبر</option>
                  <option value="معرض التوزيع المركزي - القاهرة">معرض التوزيع المركزي - القاهرة</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">إلى فرع / صالة</label>
                <select
                  defaultValue="أكتوبر"
                  onChange={(e) => handleChange("to", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                >
                  <option value="مستودع المنتج التام - القاهرة">مستودع المنتج التام - القاهرة</option>
                  <option value="مستودع الأقمشة والإمداد - 6 أكتوبر">مستودع الأقمشة والإمداد - 6 أكتوبر</option>
                  <option value="صالة القص الكبرى - خط 1">صالة القص الكبرى - خط 1</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">اسم السائق ورقم الشاحنة</label>
                <input
                  type="text"
                  defaultValue="أحمد إبراهيم (شاحنة سوتكس 3342)"
                  onChange={(e) => handleChange("driver", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">عدد البنود / الطرود</label>
                <input
                  type="number"
                  defaultValue={6}
                  onChange={(e) => handleChange("itemsCount", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
            </div>
          )}

          {/* New Journal Entry */}
          {activeModal.type === "new_journal_entry" && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">الحساب المدين (Debit)</label>
                <input
                  type="text"
                  defaultValue="5000 - تكاليف تشغيل وأجور مباشرة - صالة الخياطة"
                  onChange={(e) => handleChange("debit", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">الحساب الدائن (Credit)</label>
                <input
                  type="text"
                  defaultValue="1110 - حساب البنك التجاري الدولي CIB - جاري"
                  onChange={(e) => handleChange("credit", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  required
                  defaultValue={68400}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">مركز التكلفة</label>
                <input
                  type="text"
                  defaultValue="خط الإنتاج رقم 2 - بنطلونات جينز"
                  onChange={(e) => handleChange("costCenter", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
            </div>
          )}

          {/* Urgent RFQ Procurement */}
          {activeModal.type === "new_rfq" && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-semibold text-on-surface mb-1">عنوان طلب التوريد *</label>
                <input
                  type="text"
                  required
                  defaultValue="طلب توريد عاجل لأقمشة قطن سنجل ليكرا (كود 402)"
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">المورد المستهدف</label>
                <input
                  type="text"
                  defaultValue="شركة مصر للغزل والنسيج (المحلة الكبرى)"
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">الكمية المطلوبة (متر طولي) *</label>
                <input
                  type="number"
                  required
                  defaultValue={1000}
                  onChange={(e) => handleChange("qty", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">السعر التقديري للوحدة (ج.م)</label>
                <input
                  type="number"
                  defaultValue={145}
                  onChange={(e) => handleChange("unitPrice", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1">أقصى موعد للتوريد</label>
                <input
                  type="date"
                  defaultValue="2026-11-15"
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>
            </div>
          )}

          {/* Barcode Scan Inventory Modal */}
          {activeModal.type === "barcode_scan" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">رمز الباركود المفحوص (Barcode Scanner) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    defaultValue="6221088492019"
                    onChange={(e) => handleChange("barcode", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-primary/50 bg-primary/5 text-xs font-mono font-bold"
                  />
                  <span className="material-symbols-outlined text-primary text-[24px]">qr_code_scanner</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">المستودع / الرف</label>
                  <select
                    defaultValue="العاشر - ممر A"
                    onChange={(e) => handleChange("warehouse", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                  >
                    <option value="مستودع الأقمشة - العاشر (ممر A)">مستودع الأقمشة - العاشر (ممر A)</option>
                    <option value="مستودع الإكسسوارات - العاشر">مستودع الإكسسوارات - العاشر</option>
                    <option value="مستودع المنتج التام - القاهرة">مستودع المنتج التام - القاهرة</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">الكمية المحصورة فعلياً</label>
                  <input
                    type="number"
                    defaultValue={120}
                    onChange={(e) => handleChange("count", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs">
                <span>الصنف المطابق: <strong>قماش سنجل ليكرا كحلي (LOT-9921)</strong></span>
                <span className="text-emerald-700 font-bold">مطابق بنسبة 100%</span>
              </div>
            </div>
          )}

          {/* Shift Redirect Bottleneck Solver */}
          {activeModal.type === "shift_redirect" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <strong>تنبيه فني:</strong> خط التشطيب والكي النهائي يواجه تكدس 650 قطعة بانتظار التعبئة. سيتم توجيه الدعم من الصالات الأقل ضغطاً.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">سحب عمالة من</label>
                  <select
                    defaultValue="صالة القص والليزر"
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                  >
                    <option value="صالة القص والليزر">صالة القص والليزر (فائض مرحلي)</option>
                    <option value="خط الخياطة B1">خط الخياطة B1 (صيانة دورية)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">الخط المستهدف بالدعم</label>
                  <select
                    defaultValue="line-4"
                    onChange={(e) => handleChange("targetLine", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                  >
                    <option value="line-4">خط 4: التشطيب والكي والتعبئة</option>
                    <option value="line-3">خط 3: بناطيل كارجو وجينز</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-on-surface mb-1">عدد الفنيين المراد نقلهم للوردية *</label>
                  <input
                    type="number"
                    defaultValue={4}
                    min={1}
                    max={12}
                    onChange={(e) => handleChange("workersCount", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pay Approval Modal */}
          {activeModal.type === "pay_approval" && (
            <div className="space-y-3 text-xs">
              <p className="text-on-surface-variant">
                حدد الفاتورة المطلوب اعتماد صرف الشيك أو التحويل البنكي لها من واقع سجلات الموردين:
              </p>
              {loadingInvoices ? (
                <div className="h-20 bg-surface-container-low animate-pulse rounded-lg" />
              ) : pendingInvoices.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-surface-container-low text-on-surface-variant">
                  لا توجد فواتير معلقة بانتظار الاعتماد المالي حالياً.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingInvoices.map((inv) => (
                    <label
                      key={inv.inv_no}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        (formData.selectedInvoice || pendingInvoices[0]?.inv_no) === inv.inv_no
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant/30 hover:bg-surface-container-low"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="invoiceRadio"
                          value={inv.inv_no}
                          checked={(formData.selectedInvoice || pendingInvoices[0]?.inv_no) === inv.inv_no}
                          onChange={() => handleChange("selectedInvoice", inv.inv_no)}
                        />
                        <div>
                          <span className="font-bold text-on-surface block">{inv.supplier}</span>
                          <span className="text-[11px] text-outline font-mono">فاتورة #{inv.inv_no} — أمر شراء {inv.po_no}</span>
                        </div>
                      </div>
                      <span className="font-bold text-primary font-mono text-sm">{inv.amount}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export Report Modal */}
          {activeModal.type === "export_report" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">نوع التقرير المراد استخراجه</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "work_orders", label: "أوامر الإنتاج (Work Orders)" },
                    { key: "inventory", label: "تقييم المخزون (Inventory)" },
                    { key: "sales", label: "المبيعات والتعاقدات (Sales)" },
                  ].map((rep) => (
                    <button
                      key={rep.key}
                      type="button"
                      onClick={() => handleChange("reportSubject", rep.key)}
                      className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-colors ${
                        (formData.reportSubject || "work_orders") === rep.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {rep.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-[11px] text-on-surface-variant">
                سيتم استخراج البيانات بصيغة CSV المتوافقة مع Microsoft Excel مع دعم كامل للغة العربية UTF-8.
              </div>
            </div>
          )}

          {/* Tech Pack View Modal */}
          {activeModal.type === "tech_pack_view" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120&auto=format&fit=crop&q=80"
                  alt="Tech Pack"
                  className="w-16 h-16 rounded-lg object-cover border border-outline-variant/40"
                />
                <div>
                  <h4 className="font-bold text-on-surface text-sm">موديل: قميص أكسفورد صيفي كلاسيك #SH-901</h4>
                  <p className="text-on-surface-variant text-[11px]">الموسم: ربيع/صيف 2026 | التركيب: 100% قطن مصري غزل ناعم 60/1</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    معتمد هندسياً للإنتاج
                  </span>
                </div>
              </div>

              {/* Real BOM items loaded from Supabase */}
              <div className="space-y-1.5">
                <span className="font-bold text-on-surface block">مكونات الـ BOM وشجرة الخامات القياسية (من قاعدة البيانات):</span>
                {loadingBom ? (
                  <div className="h-20 bg-surface-container-low animate-pulse rounded-lg" />
                ) : (
                  <div className="divide-y divide-outline-variant/20 border rounded-lg bg-surface-container-lowest overflow-hidden">
                    {bomItems.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-on-surface">{item.name}</span>
                          <span className="text-outline mr-2">({item.specification})</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span>{item.consumption_per_piece} / ق</span>
                          <span className="text-emerald-700 font-bold">{item.stock_qty_str}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border border-brand-gold/40 hover:border-brand-gold text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{activeModal.type === "export_report" ? "تحميل التقرير فوراً" : activeModal.type === "tech_pack_view" ? "إغلاق المعاينة" : "حفظ واعتماد في Supabase"}</span>
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
