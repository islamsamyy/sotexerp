"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useERP } from "@/lib/erp-context";
import { supabase } from "@/lib/supabase";

interface BOMItem {
  id: string;
  productCode: string;
  itemType: string;
  itemTypeAr: string;
  name: string;
  specification: string;
  consumptionPerPiece: string;
  wastagePercent: number;
  totalFor1000Pieces: string;
  unitCostEGP?: number;
}

export default function BOMPage() {
  const { canViewCost, showToast } = useERP();
  const [selectedProduct, setSelectedProduct] = useState("STX-JKT-001");
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("bom_items")
        .select("*")
        .order("id");

      if (dbErr) throw dbErr;

      setBomItems(
        (data || []).map((b) => ({
          id: b.id,
          productCode: b.product_code,
          itemType: b.item_type.toLowerCase(),
          itemTypeAr: b.item_type_ar,
          name: b.name,
          specification: b.specification,
          consumptionPerPiece: b.consumption_per_piece,
          wastagePercent: Number(b.wastage_percent),
          totalFor1000Pieces: b.total_for_1000_pieces,
          unitCostEGP: Number(b.unit_cost_egp),
        }))
      );
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل شجرة المواد من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBom();
  }, [fetchBom]);

  const handleAddBomItem = async () => {
    const id = `BOM-${Math.floor(10 + Math.random() * 89)}`;
    const { error: insertErr } = await supabase.from("bom_items").insert({
      id,
      product_id: "prod-1",
      product_code: selectedProduct,
      item_type: "ACCESSORY",
      item_type_ar: "إكسسوارات ومستلزمات",
      name: "تيكت مقاس منسوج عالي الكثافة (Damask Woven Label)",
      specification: "حياكة أطراف ناعمة بالليزر - ألوان ثابتة",
      consumption_per_piece: "1 قطعة",
      wastage_percent: 1.5,
      total_for_1000_pieces: "1,015 قطعة",
      unit_cost_egp: 1.85,
      required_qty_str: "3,045 قطعة",
      stock_qty_str: "10,000 قطعة",
      availability_pct: 100,
      status_label: "متوفر بالكامل",
    });

    if (insertErr) {
      showToast("error", "تعذر إضافة بند شجرة المواد", insertErr.message);
      return;
    }

    showToast("success", "تمت إضافة بند جديد لشجرة المواد في Supabase", `رقم البند: ${id}`);
    fetchBom();
  };

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">account_tree</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">قوائم شجرة المواد وهندسة التصنيع (BOM)</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            حساب معدلات استهلاك الخامات، الإكسسوارات، ونسب الهالك المعيارية لكل قطعة
          </p>
        </div>

        <button
          onClick={handleAddBomItem}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>إضافة بند لشجرة المواد BOM</span>
        </button>
      </div>

      {/* Model Selector Card */}
      <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-right">
        <div className="space-y-1">
          <span className="text-xs text-on-surface-variant">الموديل المعروض حالياً:</span>
          <h2 className="font-bold text-base text-primary">جاكيت جينز كاجوال مغسول (#STX-JKT-001)</h2>
          <span className="text-xs text-outline">الموسم: خريف/شتاء 2026 — خط الإنتاج: خط خياطة الجينز الثقيل 1</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-xs text-right focus:outline-none"
          >
            <option value="STX-JKT-001">جاكيت جينز كاجوال مغسول (#STX-JKT-001)</option>
            <option value="STX-POL-104">تيشيرت بولو بيكيه مطرز (#STX-POL-104)</option>
            <option value="STX-PNT-208">بنطلون كارجو جبردين ليكرا (#STX-PNT-208)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-10 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-xs text-on-surface-variant">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل شجرة المواد (BOM) من قاعدة بيانات Supabase...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-error/40 bg-error/10 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchBom} className="px-3 py-1.5 rounded-lg bg-error text-on-error font-bold">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">بند الخامة</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">المواصفة الفنية</th>
                <th className="p-3">معدل استهلاك القطعة</th>
                <th className="p-3">نسبة الهالك المعيارية</th>
                <th className="p-3">الاحتياج لكل 1,000 قطعة</th>
                {canViewCost && <th className="p-3 bg-primary/5 text-primary">تكلفة البند للقطعة</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {bomItems.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3 font-semibold text-on-surface">{item.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-surface-container text-on-surface">
                      {item.itemTypeAr}
                    </span>
                  </td>
                  <td className="p-3 text-on-surface-variant">{item.specification}</td>
                  <td className="p-3 font-mono font-bold text-primary">{item.consumptionPerPiece}</td>
                  <td className="p-3 font-mono text-amber-700">+{item.wastagePercent}%</td>
                  <td className="p-3 font-mono font-bold text-on-surface">{item.totalFor1000Pieces}</td>
                  {canViewCost && (
                    <td className="p-3 font-mono font-bold text-rose-700 bg-primary/5">
                      {item.unitCostEGP ? `${item.unitCostEGP.toFixed(2)} ج.م` : "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
