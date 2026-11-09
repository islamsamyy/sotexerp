"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface SKUItem {
  sku: string;
  modelCode: string;
  modelName: string;
  colorName: string;
  colorHex: string;
  size: string;
  stockQty: number;
  barcode: string;
  warehouse: string;
}

export default function SKUsPage() {
  const { showToast } = useERP();
  const [search, setSearch] = useState("");
  const [skus, setSkus] = useState<SKUItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("product_skus")
        .select("*")
        .order("sku");

      if (dbErr) throw dbErr;

      setSkus(
        (data || []).map((s) => ({
          sku: s.sku,
          modelCode: s.model_code,
          modelName: s.model_name,
          colorName: s.color_name,
          colorHex: s.color_hex,
          size: s.size,
          stockQty: Number(s.stock_qty),
          barcode: s.barcode,
          warehouse: s.warehouse,
        }))
      );
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل مصفوفة الـ SKUs من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkus();
  }, [fetchSkus]);

  const handleGenerateSku = async () => {
    const rand = Math.floor(100 + Math.random() * 900);
    const sku = `STX-JKT-001-IND-XXL-${rand}`;
    const { error: insertErr } = await supabase.from("product_skus").insert({
      sku,
      product_id: "prod-1",
      model_code: "STX-JKT-001",
      model_name: "جاكيت جينز كاجوال مغسول",
      color_name: "أزرق إنديجو",
      color_hex: "#1e3a8a",
      size: "XXL",
      stock_qty: 250,
      barcode: `622104891${rand}9`,
      warehouse: "مستودع المنتج التام - القاهرة",
      weight_grams: 760,
      safety_threshold: 80,
      status: "ACTIVE",
    });

    if (insertErr) {
      showToast("error", "تعذر توليد الـ SKU", insertErr.message);
      return;
    }

    showToast("success", "تم توليد كود SKU جديد في Supabase", `الكود المولّد: ${sku}`);
    fetchSkus();
  };

  const filtered = skus.filter(
    (item) =>
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.modelName.includes(search) ||
      item.barcode.includes(search)
  );

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">style</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إدارة الألوان والمقاسات (SKUs) والباركود</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            توليد وإدارة وحدات حفظ المخزون التفصيلية حسب المقاس واللون والباركود الدولي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast("info", "إرسال أمر طباعة الملصقات", "تم إرسال أكواد الباركود لطابعة Zebra الحرارية.")}
            className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>طباعة ملصقات الباركود</span>
          </button>
          <button
            onClick={handleGenerateSku}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>توليد SKUs جديدة</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="بحث بكود SKU، اسم الموديل، أو رقم الباركود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="p-10 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-xs text-on-surface-variant">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل وحدات حفظ المخزون (SKUs) من قاعدة بيانات Supabase...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-error/40 bg-error/10 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSkus} className="px-3 py-1.5 rounded-lg bg-error text-on-error font-bold">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">رمز SKU</th>
                <th className="p-3">كود الموديل</th>
                <th className="p-3">اسم الموديل</th>
                <th className="p-3">اللون</th>
                <th className="p-3">المقاس</th>
                <th className="p-3">الباركود</th>
                <th className="p-3">الرصيد المتاح</th>
                <th className="p-3">الموقع المخزني</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((item) => (
                <tr key={item.sku} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.sku}</td>
                  <td className="p-3 font-mono text-outline">{item.modelCode}</td>
                  <td className="p-3 font-medium text-on-surface">{item.modelName}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: item.colorHex }} />
                      <span>{item.colorName}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono font-bold text-on-surface">{item.size}</td>
                  <td className="p-3 font-mono text-outline">{item.barcode}</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">{item.stockQty.toLocaleString()} ق</td>
                  <td className="p-3 text-on-surface-variant">{item.warehouse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
