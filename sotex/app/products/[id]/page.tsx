"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = (params?.id as string) || "prod-1";
  const { canViewCost, showToast, currentUser, roleConfig } = useERP();

  const [activeTab, setActiveTab] = useState("measurements");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);

  // Editable price state
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`id.eq.${productId},sku_code.eq.${productId}`)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProduct(data);
        setWholesalePrice(Number(data.wholesale_price || 0));
        setRetailPrice(Number(data.retail_price || 0));
        setCostPrice(Number(data.cost_price || 0));
      } else {
        // Fallback demo model
        const fallback = {
          id: productId,
          name_ar: "قميص أكسفورد كلاسيكي قطن 100%",
          sku_code: "STX-SHRT-405",
          category_ar: "قمصان رجالي",
          season: "صيف 2026",
          fabric_spec: "أكسفورد 60/1 ممشط مصري 100% (135 جم/م2)",
          wholesale_price: 380,
          retail_price: 560,
          cost_price: 240,
        };
        setProduct(fallback);
        setWholesalePrice(fallback.wholesale_price);
        setRetailPrice(fallback.retail_price);
        setCostPrice(fallback.cost_price);
      }
    } catch (err: any) {
      console.error("Failed to load product details:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          wholesale_price: wholesalePrice,
          retail_price: retailPrice,
          cost_price: costPrice,
        })
        .or(`id.eq.${productId},sku_code.eq.${productId}`);

      if (error) throw error;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "تحديث أسعار وتوصيف الموديل في الكتالوج",
        entityType: "products",
        entityId: product.id || productId,
        entityName: product.name_ar,
        details: { wholesalePrice, retailPrice, costPrice },
        severity: "INFO",
      });

      showToast("success", "تم حفظ التعديلات في Supabase", `تم تحديث بطاقة تسعير الموديل: ${product.name_ar}`);
    } catch (err: any) {
      showToast("error", "فشل حفظ التعديلات", err?.message || "خطأ في الاتصال بقاعدة البيانات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-gutter space-y-4 max-w-5xl mx-auto text-right">
        <div className="h-8 w-48 bg-surface-container animate-pulse rounded" />
        <div className="h-44 bg-surface-container-lowest border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-gutter space-y-space-md max-w-5xl mx-auto text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30 print:hidden">
        <div className="flex items-center gap-2 text-xs">
          <Link href="/products" className="text-primary hover:underline">
            كتالوج المنتجات
          </Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-mono font-bold">{product.sku_code || product.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>طباعة ملف المواصفة (Tech Pack)</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            <span>حفظ التعديلات في Supabase</span>
          </button>
        </div>
      </div>

      {/* Product Hero Info */}
      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex flex-col sm:flex-row items-start gap-5 shadow-xs">
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80"}
          alt={product.name_ar}
          className="w-28 h-28 rounded-xl object-cover border border-outline-variant/30 overflow-hidden shadow-xs shrink-0"
        />

        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
              {product.sku_code || product.id}
            </span>
            <h1 className="text-lg font-bold text-on-surface">{product.name_ar}</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
              معتمد للتصنيع
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">
            الخامة الرئيسية: {product.fabric_spec || "قطن مصري 100% فاخر"} — التصنيف: {product.category_ar || "ملابس رجالي"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1">سعر الجملة (ج.م):</label>
              <input
                type="number"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-outline mb-1">سعر التجزئة (ج.م):</label>
              <input
                type="number"
                value={retailPrice}
                onChange={(e) => setRetailPrice(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-on-surface"
              />
            </div>
            {canViewCost && (
              <div>
                <label className="block text-[11px] font-semibold text-outline mb-1">تكلفة المصنع (ج.م):</label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs font-mono font-bold text-[#16A36A]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-1 text-xs print:hidden">
        {[
          { key: "measurements", label: "جدول القياسات المعياري (Measurement Specs)" },
          { key: "colors", label: "مصفوفة الألوان المعتمدة (Colorways)" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-t-lg transition-colors font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary font-bold bg-surface-container-low"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Measurements Table */}
      {activeTab === "measurements" && (
        <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-x-auto shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
              <tr>
                <th className="p-2.5">نقطة القياس</th>
                <th className="p-2.5">التفاوت المسموح</th>
                <th className="p-2.5">S</th>
                <th className="p-2.5">M</th>
                <th className="p-2.5">L</th>
                <th className="p-2.5">XL</th>
                <th className="p-2.5">XXL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-mono">
              <tr>
                <td className="p-2.5 font-sans font-bold">نصف محيط الصدر (Chest)</td>
                <td className="p-2.5 text-outline">±1.0 سم</td>
                <td className="p-2.5">52 سم</td>
                <td className="p-2.5">55 سم</td>
                <td className="p-2.5">58 سم</td>
                <td className="p-2.5">61 سم</td>
                <td className="p-2.5">64 سم</td>
              </tr>
              <tr>
                <td className="p-2.5 font-sans font-bold">طول الظهر من الرقبة (Back Length)</td>
                <td className="p-2.5 text-outline">±1.5 سم</td>
                <td className="p-2.5">74 سم</td>
                <td className="p-2.5">76 سم</td>
                <td className="p-2.5">78 سم</td>
                <td className="p-2.5">80 سم</td>
                <td className="p-2.5">82 سم</td>
              </tr>
              <tr>
                <td className="p-2.5 font-sans font-bold">طول الكم متضمناً الإسورة (Sleeve)</td>
                <td className="p-2.5 text-outline">±0.5 سم</td>
                <td className="p-2.5">63 سم</td>
                <td className="p-2.5">64 سم</td>
                <td className="p-2.5">65 سم</td>
                <td className="p-2.5">66 سم</td>
                <td className="p-2.5">67 سم</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Colors Table */}
      {activeTab === "colors" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "أزرق كحلي داكن", hex: "#1E3A8A", code: "NVY" },
            { name: "أبيض ناصع", hex: "#FFFFFF", code: "WHT" },
            { name: "رمادي ميلانج", hex: "#6B7280", code: "GRY" },
            { name: "أسود فحمي", hex: "#111827", code: "BLK" },
          ].map((col, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center gap-3 shadow-xs">
              <span className="w-8 h-8 rounded-lg border border-outline-variant/40 shrink-0 shadow-inner" style={{ backgroundColor: col.hex }} />
              <div>
                <span className="font-bold text-xs text-on-surface block">{col.name}</span>
                <span className="text-[11px] text-outline font-mono">كود: {col.code}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
