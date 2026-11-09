"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

interface PriceItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  exportPriceUSD: number;
  minQtyWholesale: number;
}

export default function PricingPage() {
  const { canViewCost, roleConfig, showToast, currentUser } = useERP();
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("products")
        .select("*")
        .order("id");

      if (dbErr) throw dbErr;

      setItems(
        (data || []).map((p) => ({
          id: p.id,
          sku: p.sku_code,
          name: p.name_ar,
          category: p.category_ar,
          costPrice: Number(p.cost_price),
          wholesalePrice: Number(p.wholesale_price),
          retailPrice: Number(p.retail_price),
          exportPriceUSD: Number(p.export_price_usd),
          minQtyWholesale: Number(p.min_qty_wholesale),
        }))
      );
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل مصفوفة الأسعار من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handlePriceChange = (id: string, field: "wholesalePrice" | "retailPrice" | "costPrice", val: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleSaveAllPrices = async () => {
    setSaving(true);
    try {
      for (const it of items) {
        await supabase
          .from("products")
          .update({
            wholesale_price: it.wholesalePrice,
            retail_price: it.retailPrice,
            cost_price: it.costPrice,
          })
          .eq("id", it.id);
      }
      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "تحديث مصفوفة أسعار وهوامش كتالوج المنتجات",
        entityType: "products",
        entityId: "PRICING-MATRIX",
        entityName: "كتالوج المنتجات",
        details: { itemsCount: items.length },
        severity: "INFO",
      });
      showToast("success", "تم حفظ وتحديث مصفوفة الأسعار في Supabase بنجاح", `تم تحديث أسعار ${items.length} منتج.`);
    } catch (err: any) {
      showToast("error", "فشل حفظ الأسعار", err?.message || "خطأ في الاتصال بقاعدة البيانات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">price_change</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">مصفوفة أسعار البيع والتكلفة وهوامش الربح</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            إدارة تسعير الجملة والتجزئة والتصدير وحساب ربحية الموديلات
          </p>
        </div>

        {canViewCost && (
          <button
            onClick={handleSaveAllPrices}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            <span>{saving ? "جاري الحفظ في Supabase..." : "حفظ تعديلات الأسعار"}</span>
          </button>
        )}
      </div>

      {/* Permission alert banner if cost is restricted */}
      {!canViewCost && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-center gap-3 text-right">
          <span className="material-symbols-outlined text-[20px] text-amber-600">lock</span>
          <div>
            <strong>تنبيه الصلاحيات:</strong> بيانات تكلفة التصنيع وهامش الربح محجوبة عن دور <strong>{roleConfig.nameAr}</strong>. للوصول إليها يجب تسجيل الدخول بدور مالي أو مالك المصنع.
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-10 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-xs text-on-surface-variant">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل مصفوفة التسعير من قاعدة بيانات Supabase...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-error/40 bg-error/10 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchPricing} className="px-3 py-1.5 rounded-lg bg-error text-on-error font-bold">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">كود الموديل</th>
                <th className="p-3">اسم المنتج</th>
                <th className="p-3">الفئة</th>
                <th className="p-3">سعر الجملة (ج.م)</th>
                <th className="p-3">سعر التجزئة (ج.م)</th>
                <th className="p-3">سعر التصدير ($)</th>
                <th className="p-3">أقل كمية جملة</th>
                {canViewCost && (
                  <>
                    <th className="p-3 bg-primary/5 text-primary">تكلفة المصنع المعيارية</th>
                    <th className="p-3 bg-primary/5 text-primary">هامش ربح الجملة %</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {items.map((item) => {
                const wholesaleMargin =
                  item.wholesalePrice > 0
                    ? ((item.wholesalePrice - item.costPrice) / item.wholesalePrice) * 100
                    : 0;

                return (
                  <tr key={item.sku} className="hover:bg-surface-container/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{item.sku}</td>
                    <td className="p-3 font-semibold text-on-surface">{item.name}</td>
                    <td className="p-3 text-on-surface-variant">{item.category}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={item.wholesalePrice}
                        onChange={(e) => handlePriceChange(item.id, "wholesalePrice", Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded border border-outline-variant/40 bg-surface-container-low font-mono font-bold text-primary text-center focus:outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={item.retailPrice}
                        onChange={(e) => handlePriceChange(item.id, "retailPrice", Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded border border-outline-variant/40 bg-surface-container-low font-mono font-bold text-emerald-700 text-center focus:outline-none focus:border-primary"
                      />
                    </td>
                    <td className="p-3 font-mono text-outline">${item.exportPriceUSD.toFixed(2)}</td>
                    <td className="p-3 font-mono">{item.minQtyWholesale} قطعة</td>

                    {canViewCost && (
                      <>
                        <td className="p-3 bg-primary/5">
                          <input
                            type="number"
                            value={item.costPrice}
                            onChange={(e) => handlePriceChange(item.id, "costPrice", Number(e.target.value))}
                            className="w-24 px-2 py-1 rounded border border-outline-variant/40 bg-surface-container-low font-mono font-bold text-rose-700 text-center focus:outline-none focus:border-primary"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-800 bg-primary/5">
                          +{wholesaleMargin.toFixed(1)}%
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
