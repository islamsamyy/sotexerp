"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

interface ColorItem {
  name: string;
  hex: string;
  code: string;
}

export default function NewProductWizardPage() {
  const router = useRouter();
  const { showToast, currentUser, roleConfig } = useERP();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Basic Product Information
  const [nameAr, setNameAr] = useState("تيشيرت سوِتكس كاجوال بشعار ذهبي");
  const [skuCode, setSkuCode] = useState(`STX-TSH-${Date.now().toString().slice(-4)}`);
  const [modelSubtitle, setModelSubtitle] = useState("SOTEX Signature Summer Drop 2026");
  const [season, setSeason] = useState("صيف 2026 (Summer Drop 1)");
  const [categoryAr, setCategoryAr] = useState("تيشيرتات كاجوال رجالي");
  const [fabricSpec, setFabricSpec] = useState("قطن مصري 100% سينجل جيرسي 190 GSM معالج إنزيمياً");
  const [fitType, setFitType] = useState("Classic Regular Fit (قصة كلاسيكية مريحة)");
  const [facility, setFacility] = useState("مجمع ومصانع سوتكس المركزي - المحلة الكبرى");

  // Step 2: Media & Tech Pack
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80");
  const [galleryImages, setGalleryImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80",
  ]);
  const [techPackName] = useState("TECH-PACK-STX-2026-V2.pdf");

  // Step 3: Attributes & SKU Matrix
  const [selectedColors, setSelectedColors] = useState<ColorItem[]>([
    { name: "كحلي داكن", hex: "#142D4E", code: "NVY" },
    { name: "أسود فحمي", hex: "#1E1E24", code: "BLK" },
    { name: "أبيض قطني", hex: "#FFFFFF", code: "WHT" },
    { name: "زيتي مطفأ", hex: "#4A5340", code: "OLV" },
  ]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#C8B276");

  // Step 4: Costing & Pricing
  const [costPrice, setCostPrice] = useState<number>(185);
  const [rawCost, setRawCost] = useState<number>(120);
  const [laborCost, setLaborCost] = useState<number>(65);
  const [wholesalePrice, setWholesalePrice] = useState<number>(320);
  const [retailPrice, setRetailPrice] = useState<number>(490);
  const [exportPriceUsd, setExportPriceUsd] = useState<number>(6.67);

  // Step 5: Inventory & Storage Policy
  const [availableQty, setAvailableQty] = useState<number>(1200);
  const [wipQty, setWipQty] = useState<number>(450);
  const [safetyThreshold, setSafetyThreshold] = useState<number>(150);
  const [reorderPoint, setReorderPoint] = useState<number>(300);
  const [selectedWarehouse, setSelectedWarehouse] = useState("مستودع المنتج التام المركزي - المحلة الكبرى");
  const [packagingType, setPackagingType] = useState("كيس بولي فردي مع كارت صنف باركود + كرتونة شحن 24 قطعة");

  // Step 6: Sales & Distribution Channels
  const [minQtyWholesale, setMinQtyWholesale] = useState<number>(50);
  const [channels, setChannels] = useState<string[]>([
    "وكلاء وموزعو الجملة المحليون",
    "عقود التصدير B2B للأسواق الإقليمية",
    "معارض سوتكس ونقاط البيع المباشرة",
  ]);
  const [paymentTerms, setPaymentTerms] = useState("50% دفعة مقدمة + 50% قبل الشحن (أو آجل 30 يوماً للمعتمدين)");
  const [hsCode, setHsCode] = useState("6109.10.00 (ملابس منسوجة قطنية للرجال)");

  // Wizard Steps Metadata
  const steps = [
    { id: 1, title: "البيانات الأساسية", desc: "توصيف الموديل والخامة", icon: "edit_note" },
    { id: 2, title: "وسائط وصور المنتج", desc: "معرض الصور والـ Tech Pack", icon: "photo_library" },
    { id: 3, title: "المتغيرات والأكواد (SKUs)", desc: "مصفوفة الألوان والمقاسات", icon: "tune" },
    { id: 4, title: "التكاليف والتسعير", desc: "شجرة التكاليف وهوامش الربح", icon: "payments" },
    { id: 5, title: "سياسة المخزون", desc: "حدود الأمان ومواقع التخزين", icon: "inventory_2" },
    { id: 6, title: "قنوات البيع والتوزيع", desc: "الجملة والتصدير والتعاقدات", icon: "storefront" },
    { id: 7, title: "الاعتماد والنشر", desc: "المراجعة النهائية والتكويد في Supabase", icon: "verified" },
  ];

  const toggleSize = (sz: string) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleAddCustomColor = () => {
    if (!newColorName.trim()) return;
    const code = newColorName.trim().slice(0, 3).toUpperCase();
    setSelectedColors((prev) => [...prev, { name: newColorName.trim(), hex: newColorHex, code }]);
    setNewColorName("");
    showToast("success", "تمت إضافة اللون", `تم إضافة ${newColorName} لمصفوفة الموديل.`);
  };

  const handleRemoveColor = (code: string) => {
    if (selectedColors.length <= 1) {
      showToast("warning", "يجب الإبقاء على لون واحد على الأقل");
      return;
    }
    setSelectedColors((prev) => prev.filter((c) => c.code !== code));
  };

  // Main Submit Handler
  const handleSaveProduct = async (status: string = "IN_PRODUCTION") => {
    if (!nameAr.trim() || !skuCode.trim()) {
      showToast("error", "بيانات ناقصة", "يرجى إدخال اسم الموديل وكود الـ SKU في الخطوة الأولى");
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    try {
      const prodId = `prod-${Date.now().toString().slice(-6)}`;
      const cleanSku = skuCode.trim().toUpperCase();
      const cleanName = nameAr.trim();

      const newProd = {
        id: prodId,
        sku_code: cleanSku,
        name_ar: cleanName,
        model_subtitle: modelSubtitle || "مجموعة صيف 2026",
        season: season || "صيف 2026",
        category_ar: categoryAr || "تيشيرتات كاجوال رجالي",
        fabric_spec: fabricSpec || "قطن مصري 100%",
        colors_json: selectedColors.length > 0 ? selectedColors : [{ name: "كحلي", hex: "#142D4E", code: "NVY" }],
        sizes: selectedSizes.length > 0 ? selectedSizes : ["M", "L", "XL"],
        wholesale_price: Number(wholesalePrice) || 0,
        retail_price: Number(retailPrice) || 0,
        cost_price: Number(costPrice) || 0,
        export_price_usd: Number(exportPriceUsd || (Number(wholesalePrice) / 48).toFixed(2)) || 0,
        min_qty_wholesale: Number(minQtyWholesale) || 50,
        available_qty: Number(availableQty) || 0,
        wip_qty: Number(wipQty) || 450,
        reserved_qty: 0,
        raw_cost: Number(rawCost || (Number(costPrice) * 0.65).toFixed(2)) || 0,
        labor_cost: Number(laborCost || (Number(costPrice) * 0.35).toFixed(2)) || 0,
        barcode: `6221048${Math.floor(100000 + Math.random() * 900000)}`,
        status: status === "DRAFT" ? "LOW_STOCK" : "IN_STOCK",
        image_url: imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
      };

      const { error: prodErr } = await supabase.from("products").insert(newProd);
      if (prodErr) throw prodErr;

      // Auto-generate SKU records for all color & size permutations
      const skuRows = [];
      const colorsToUse = selectedColors.length > 0 ? selectedColors : [{ name: "كحلي", hex: "#142D4E", code: "NVY" }];
      const sizesToUse = selectedSizes.length > 0 ? selectedSizes : ["S", "M", "L", "XL"];
      const qtyPerSku = Math.max(10, Math.round(Number(availableQty) / (colorsToUse.length * sizesToUse.length)));

      for (const col of colorsToUse) {
        for (const sz of sizesToUse) {
          skuRows.push({
            sku: `${cleanSku}-${col.code || "COL"}-${sz}`,
            product_id: prodId,
            model_code: cleanSku,
            model_name: cleanName,
            color_name: col.name,
            color_hex: col.hex,
            size: sz,
            stock_qty: qtyPerSku,
            barcode: `622${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            warehouse: selectedWarehouse || "مستودع المنتج التام المركزي - المحلة الكبرى",
            weight_grams: 220,
            safety_threshold: Number(safetyThreshold) || 50,
            status: "ACTIVE",
          });
        }
      }

      if (skuRows.length > 0) {
        const { error: skuErr } = await supabase.from("product_skus").insert(skuRows);
        if (skuErr) console.warn("SKU generation note:", skuErr);
      }

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "تكويد واعتماد موديل تصنيعي جديد عبر معالج الإعداد الكامل (7 خطوات)",
        entityType: "products",
        entityId: prodId,
        entityName: cleanName,
        details: { sku: cleanSku, wholesalePrice, retailPrice, costPrice, skusGenerated: skuRows.length, stepsCompleted: 7 },
        severity: "INFO",
      });

      showToast(
        "success",
        "تم تكويد وحفظ الموديل وجميع بيانات الخطوات الـ 7 في Supabase",
        `تم إضافة ${cleanName} بنجاح وتوليد ${skuRows.length} كود SKU معتمد.`
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sotex_product_updated"));
      }

      setTimeout(() => {
        router.push("/products");
      }, 500);
    } catch (err: any) {
      showToast("error", "فشل حفظ المنتج", err?.message || "خطأ أثناء الحفظ في قاعدة البيانات");
    } finally {
      setIsSaving(false);
    }
  };

  const wholesaleMarginPct = wholesalePrice > 0 ? (((wholesalePrice - costPrice) / wholesalePrice) * 100).toFixed(1) : "0.0";
  const retailMarginPct = retailPrice > 0 ? (((retailPrice - costPrice) / retailPrice) * 100).toFixed(1) : "0.0";
  const totalSkusCount = selectedColors.length * selectedSizes.length;

  return (
    <main className="relative pt-4 bg-surface min-h-screen text-right pb-32">
      <div className="flex flex-col w-full px-gutter py-space-md space-y-space-md max-w-[1720px] mx-auto">
        
        {/* Breadcrumbs & Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="space-y-space-xs">
            <nav className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
              <Link href="/" className="hover:text-primary transition-colors">
                الرئيسية
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
              <Link href="/products" className="hover:text-primary transition-colors">
                المنتجات والتصميم
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
              <span className="text-primary font-semibold">
                معالج تكويد وتوصيف موديل تصنيعي جديد
              </span>
            </nav>
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-xl bg-white p-1 border-2 border-brand-gold/50 shadow-sm flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight flex items-center gap-2">
                  <span>معالج إعداد وتوصيف المنتج التصنيعي (7 خطوات)</span>
                  <span className="text-brand-gold font-serif text-xl">SOTEX</span>
                </h1>
                <span className="px-space-xs py-[2px] rounded bg-brand-gold/20 text-brand-bronze border border-brand-gold/30 font-bold text-xs inline-block mt-0.5">
                  مسودة نشطة #{skuCode}
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">
              معالج الإعداد المتكامل لتوصيف بيانات الصنف الفنية، وسائط الموديل، مصفوفة السمات والأكواد (SKUs)، شجرة التكاليف، سياسة المخزون، وقنوات التوزيع.
            </p>
          </div>

          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={() => handleSaveProduct("IN_PRODUCTION")}
              disabled={isSaving}
              className="h-10 px-space-lg bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border border-brand-gold/40 hover:border-brand-gold rounded-lg font-label-md text-label-md flex items-center gap-space-xs shadow-md transition-all cursor-pointer font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-gold">
                check_circle
              </span>
              <span>{isSaving ? "جاري الاعتماد في Supabase..." : "اعتماد وتكويد الموديل في Supabase"}</span>
            </button>
            <button
              onClick={() => handleSaveProduct("DRAFT")}
              disabled={isSaving}
              className="h-10 px-space-md rounded bg-surface-container-lowest text-primary border border-outline-variant/60 hover:bg-surface-container-low transition-colors font-label-md text-label-md shadow-sm flex items-center gap-space-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{isSaving ? "جاري الحفظ..." : "حفظ كمسودة"}</span>
            </button>
            <button
              onClick={() => router.push("/products")}
              className="h-10 px-space-sm rounded text-error hover:bg-error-container/40 transition-colors font-label-md text-label-md flex items-center gap-space-xs cursor-pointer"
              type="button"
            >
              <span>إلغاء</span>
            </button>
          </div>
        </div>

        {/* 7-Step Interactive Stepper Navigation Bar */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {steps.map((st) => {
              const isCurrent = currentStep === st.id;
              const isPast = currentStep > st.id;

              return (
                <button
                  key={st.id}
                  onClick={() => setCurrentStep(st.id)}
                  type="button"
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-right transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-surface-container-low shadow-sm ring-2 ring-brand-gold/60 border border-primary/20"
                      : isPast
                      ? "hover:bg-surface-container-low/80 bg-surface-container-lowest"
                      : "opacity-60 hover:opacity-90 hover:bg-surface-container-low/50"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                      isCurrent
                        ? "bg-primary text-white ring-2 ring-brand-gold/50"
                        : isPast
                        ? "bg-[#E8F8F0] text-[#16A36A]"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {isPast ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      st.id
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-[10px] leading-tight ${
                        isCurrent
                          ? "text-brand-gold font-bold"
                          : isPast
                          ? "text-[#16A36A] font-semibold"
                          : "text-outline"
                      }`}
                    >
                      {isCurrent ? "الخطوة الحالية" : isPast ? "مكتملة ✓" : `الخطوة ${st.id}`}
                    </span>
                    <span
                      className={`text-xs font-semibold truncate ${
                        isCurrent ? "text-primary font-bold" : "text-on-surface"
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Summary Pill Card (Always Visible Header Strip) */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-16 rounded-lg overflow-hidden border border-outline-variant/40 bg-surface-container shrink-0 shadow-sm">
              <img src={imageUrl} alt={nameAr} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-primary text-sm">{nameAr}</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-mono font-bold text-on-surface">
                  {skuCode}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#E8F8F0] text-[#16A36A] text-[10px] font-bold">
                  جاهز للتصنيع الكثيف
                </span>
              </div>
              <p className="text-xs text-on-surface-variant flex items-center gap-3 flex-wrap">
                <span>التصنيف: <strong>{categoryAr}</strong></span>
                <span>•</span>
                <span>الخامة: <strong>{fabricSpec}</strong></span>
                <span>•</span>
                <span>الموسم: <strong>{season}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto text-xs font-mono">
            <div className="text-left">
              <span className="text-[10px] text-outline block">سعر الجملة:</span>
              <span className="font-bold text-primary">{wholesalePrice} ج.م</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-outline block">هامش الربح:</span>
              <span className="font-bold text-[#16A36A]">+{wholesaleMarginPct}%</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-outline block">المصفوفة:</span>
              <span className="font-bold text-secondary">{totalSkusCount} SKUs</span>
            </div>
          </div>
        </div>

        {/* Dynamic Step Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          
          {/* Main Form Body (8 cols on large screens) */}
          <div className="lg:col-span-8 space-y-space-md">
            
            {/* ================= STEP 1: Basic Information ================= */}
            {currentStep === 1 && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-gold">edit_note</span>
                      <span>الخطوة 1: البيانات الأساسية والتوصيف الفني للموديل</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تحديد اسم الصنف، كود التشفير الأساسي، مواصفة النسيج والتركيب وموقع صالة التشغيل.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-surface-container text-primary font-mono font-bold">
                    DRF-{skuCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="col-span-2">
                    <label className="block font-semibold text-on-surface mb-1">اسم المنتج والموديل التجاري *</label>
                    <input
                      type="text"
                      required
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      placeholder="مثال: تيشيرت سوِتكس كاجوال بشعار ذهبي"
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-bold text-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">كود الموديل الأساسي (Base SKU) *</label>
                    <input
                      type="text"
                      required
                      value={skuCode}
                      onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-mono font-bold text-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">التصنيف الرئيسي *</label>
                    <select
                      value={categoryAr}
                      onChange={(e) => setCategoryAr(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    >
                      <option value="تيشيرتات كاجوال رجالي">تيشيرتات كاجوال رجالي</option>
                      <option value="قمصان قطن كلاسيك">قمصان قطن كلاسيك</option>
                      <option value="بناطيل كارجو وجينز">بناطيل كارجو وجينز</option>
                      <option value="سويت شيرت وهودي ميلتون">سويت شيرت وهودي ميلتون</option>
                      <option value="ملابس حريمي وعبايات">ملابس حريمي وعبايات</option>
                      <option value="يونيفورم وملابس شركات B2B">يونيفورم وملابس شركات B2B</option>
                      <option value="ترينجات وملابس رياضية">ترينجات وملابس رياضية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">موسم الإنتاج والطرح *</label>
                    <select
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    >
                      <option value="صيف 2026 (Summer Drop 1)">صيف 2026 (Summer Drop 1)</option>
                      <option value="خريف وشتاء 2026">خريف وشتاء 2026</option>
                      <option value="ربيع وصيف 2026">ربيع وصيف 2026</option>
                      <option value="كولكشن العيد 2026">كولكشن العيد 2026</option>
                      <option value="تشغيل دائم طوال العام (All Season)">تشغيل دائم طوال العام (All Season)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">قصة الموديل والباترون (Pattern Fit)</label>
                    <select
                      value={fitType}
                      onChange={(e) => setFitType(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    >
                      <option value="Classic Regular Fit (قصة كلاسيكية مريحة)">Classic Regular Fit (قصة كلاسيكية مريحة)</option>
                      <option value="Slim Fit (مجسم عصري)">Slim Fit (مجسم عصري)</option>
                      <option value="Oversized Streetwear (واسع كاجوال)">Oversized Streetwear (واسع كاجوال)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold text-on-surface mb-1">مواصفة النسيج والتركيب الخام *</label>
                    <input
                      type="text"
                      required
                      value={fabricSpec}
                      onChange={(e) => setFabricSpec(e.target.value)}
                      placeholder="مثال: قطن مصري 100% سينجل جيرسي 190 GSM معالج إنزيمياً"
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold text-on-surface mb-1">الوصف التسويقي للكتالوج</label>
                    <textarea
                      rows={2}
                      value={modelSubtitle}
                      onChange={(e) => setModelSubtitle(e.target.value)}
                      className="w-full p-3 rounded-lg border border-outline-variant/50 bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold text-on-surface mb-1">صالة التصنيع والقص المخصصة</label>
                    <input
                      type="text"
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low text-xs text-on-surface"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: Media & Images ================= */}
            {currentStep === 2 && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-gold">photo_library</span>
                      <span>الخطوة 2: وسائط وصور المنتج والمواصفة الهندسية (Tech Pack)</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تحديد الصورة الرئيسية، معرض الصور بدقة عالية، وملف المواصفات الفنية المعتمد للقص.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-[#E8F8F0] text-[#16A36A] font-bold">
                    معاينة حية
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">رابط الصورة الرئيسية للموديل *</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low text-xs font-mono text-primary focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  </div>

                  {/* Preset quick image selection */}
                  <div>
                    <label className="block font-semibold text-on-surface-variant mb-2">نماذج صور جاهزة للاختيار السريع:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { title: "تيشيرت كحلي فاخر", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80" },
                        { title: "قميص أكسفورد صيفي", url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80" },
                        { title: "تيشيرت أبيض قطني", url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80" },
                        { title: "سويت شيرت ميلتون", url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setImageUrl(item.url)}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                            imageUrl === item.url
                              ? "border-brand-gold ring-2 ring-brand-gold/40 bg-brand-gold/5"
                              : "border-outline-variant/30 hover:bg-surface-container-low"
                          }`}
                        >
                          <img src={item.url} alt={item.title} className="w-full h-24 object-cover rounded-lg mb-1.5" />
                          <span className="font-bold text-[11px] text-on-surface block truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tech Pack View Card */}
                  <div className="p-4 rounded-xl border border-secondary/30 bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                        PDF
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-xs">{techPackName}</h4>
                        <p className="text-[11px] text-on-surface-variant">
                          المواصفة الهندسية المعتمدة | تفاوت المقاسات: +/- 0.5 سم | معتمد لقسم الباترون والقص
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#E8F8F0] text-[#16A36A] font-bold text-[11px]">
                      معتمد هندسياً
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: SKU Matrix & Attributes ================= */}
            {currentStep === 3 && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-gold">tune</span>
                      <span>الخطوة 3: مصفوفة السمات وتوليد الأكواد الذكية (SKU Matrix)</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تحديد تركيبة الألوان والمقاسات لتوليد أكواد التخزين الفريدة وجداول الباركود الدولي GS1 EAN-13.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-surface-container-high text-primary font-bold">
                    {totalSkusCount} كود SKU ناتج
                  </span>
                </div>

                {/* Color Palette Selector */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-on-surface">1. الألوان المقررة للموديل ({selectedColors.length} ألوان):</label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {selectedColors.map((col) => (
                      <div
                        key={col.code}
                        className="p-2.5 rounded-xl border border-primary/40 bg-surface-container-low flex items-center justify-between shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 shadow-inner"
                            style={{ backgroundColor: col.hex }}
                          />
                          <div>
                            <span className="font-bold text-on-surface block text-[11px]">{col.name}</span>
                            <span className="font-mono text-[10px] text-outline">{col.code} • {col.hex}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(col.code)}
                          className="text-outline hover:text-error transition-colors p-0.5"
                          title="إزالة اللون"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Color Row */}
                  <div className="p-3 rounded-xl border border-dashed border-outline-variant/60 flex items-center gap-2.5">
                    <input
                      type="text"
                      placeholder="اسم لون جديد (مثال: عنابي فاخر)"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
                    />
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded border border-outline-variant/40 bg-transparent cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      className="h-9 px-3 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors"
                    >
                      + إضافة لون
                    </button>
                  </div>
                </div>

                {/* Size Matrix Selector */}
                <div className="space-y-2 text-xs pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-on-surface">2. تشكيلة المقاسات المعتمدة (EU Standard):</label>
                    <div className="flex items-center gap-2 text-secondary text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedSizes(["XS", "S", "M", "L", "XL", "2XL", "3XL"])}
                        className="hover:underline font-bold"
                      >
                        تحديد الكل
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSizes(["M", "L"])}
                        className="hover:underline"
                      >
                        المقاسات الأكثر طلباً (M, L)
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"].map((sz) => {
                      const isSelected = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSize(sz)}
                          className={`h-9 px-4 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white shadow-xs ring-2 ring-primary"
                              : "bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/30"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generated SKU Table */}
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden pt-2">
                  <div className="p-3 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/30 text-xs">
                    <span className="font-bold text-primary">الأكواد المولدة آلياً في Supabase:</span>
                    <span className="font-mono text-outline">{totalSkusCount} سجلات SKU</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-surface-container-low/70 text-on-surface-variant font-semibold border-b border-outline-variant/20 sticky top-0">
                        <tr>
                          <th className="p-2">اللون</th>
                          <th className="p-2">المقاس</th>
                          <th className="p-2">كود SKU الكامل</th>
                          <th className="p-2">الباركود الدولي (EAN-13)</th>
                          <th className="p-2">الرصيد المبدئي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {selectedColors.map((col) =>
                          selectedSizes.map((sz) => (
                            <tr key={`${col.code}-${sz}`} className="hover:bg-surface-container-low/50">
                              <td className="p-2 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.hex }} />
                                <span>{col.name}</span>
                              </td>
                              <td className="p-2 font-mono font-bold text-primary">{sz}</td>
                              <td className="p-2 font-mono font-bold text-on-surface">
                                {skuCode}-{col.code}-{sz}
                              </td>
                              <td className="p-2 font-mono text-outline">
                                6221048{col.code.charCodeAt(0)}{sz.charCodeAt(0)}
                              </td>
                              <td className="p-2 font-mono font-semibold text-[#16A36A]">
                                {Math.round(availableQty / Math.max(1, totalSkusCount))} ق
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: Costing & Pricing ================= */}
            {currentStep === 4 && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-gold">payments</span>
                      <span>الخطوة 4: شجرة التكاليف والتسعير وهوامش الربح</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تحديد تكلفة الخامات، أجور الخياطة، تكلفة المصنع (COGS)، وأسعار بيع الجملة والتجزئة والتصدير.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-[#E8F8F0] text-[#16A36A] font-bold">
                    +{wholesaleMarginPct}% هامش الجملة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                    <span className="text-outline font-semibold block">تكلفة خامات النسيج (Raw BOM):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={rawCost}
                        onChange={(e) => {
                          const r = Number(e.target.value);
                          setRawCost(r);
                          setCostPrice(r + laborCost);
                        }}
                        className="w-full h-9 px-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest font-mono font-bold text-primary text-sm"
                      />
                      <span className="font-bold text-on-surface-variant">ج.م</span>
                    </div>
                    <span className="text-[10px] text-outline block">أقمشة + خيوط + بطاقات</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                    <span className="text-outline font-semibold block">أجور القص والخياطة (Labor):</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={laborCost}
                        onChange={(e) => {
                          const l = Number(e.target.value);
                          setLaborCost(l);
                          setCostPrice(rawCost + l);
                        }}
                        className="w-full h-9 px-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest font-mono font-bold text-primary text-sm"
                      />
                      <span className="font-bold text-on-surface-variant">ج.م</span>
                    </div>
                    <span className="text-[10px] text-outline block">تشغيل فنيين + كي وتعبئة</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-primary text-white space-y-1 shadow-xs flex flex-col justify-between">
                    <span className="text-white/80 font-semibold block">إجمالي تكلفة الصنع (COGS):</span>
                    <div className="text-xl font-mono font-bold">
                      {costPrice} <span className="text-xs font-normal">ج.م / قطعة</span>
                    </div>
                    <span className="text-[10px] text-white/70 block">التكلفة المعيارية المعتمدة</span>
                  </div>
                </div>

                {/* Selling Prices Tiers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="p-4 rounded-xl border border-primary/40 bg-surface-container-low space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-primary">سعر بيع الجملة (Wholesale) *</label>
                      <span className="text-[#16A36A] font-bold font-mono">+{wholesaleMarginPct}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        required
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-primary text-base"
                      />
                      <span className="font-bold text-on-surface-variant">ج.م</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant block">
                      صافي ربح المصنع: {(wholesalePrice - costPrice).toFixed(2)} ج.م/ق
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-secondary/40 bg-surface-container-low space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-secondary">سعر بيع التجزئة (Retail) *</label>
                      <span className="text-[#16A36A] font-bold font-mono">+{retailMarginPct}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        required
                        value={retailPrice}
                        onChange={(e) => setRetailPrice(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-secondary text-base"
                      />
                      <span className="font-bold text-on-surface-variant">ج.م</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant block">
                      سعر المستهلك النهائي في المعارض
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-brand-gold/40 bg-surface-container-low space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-brand-bronze">سعر التصدير (USD Export)</label>
                      <span className="text-brand-gold font-bold font-mono">دولار $</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={exportPriceUsd}
                        onChange={(e) => setExportPriceUsd(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-brand-bronze text-base"
                      />
                      <span className="font-bold text-on-surface-variant">$</span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant block">
                      معادل بسعر صرف 48 ج.م / دولار
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 5: Inventory Policy ================= */}
            {currentStep === 5 && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-gold">inventory_2</span>
                      <span>الخطوة 5: سياسة المخزون والتسكين بالمستودعات</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تحديد الرصيد الافتتاحي، حد الأمان، نقطة إعادة الطلب، والمستودع المخصص لاستلام التشغيلات.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-surface-container text-primary font-bold">
                    سياسة الرقابة الذكية
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">الرصيد الافتتاحي المتاح بالمخزن (قطعة) *</label>
                    <input
                      type="number"
                      required
                      value={availableQty}
                      onChange={(e) => setAvailableQty(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-mono font-bold text-primary text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">الكميات قيد التشغيل المبدئية (WIP)</label>
                    <input
                      type="number"
                      value={wipQty}
                      onChange={(e) => setWipQty(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-mono font-bold text-on-surface text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">حد الأمان المخزني (Safety Threshold)</label>
                    <input
                      type="number"
                      value={safetyThreshold}
                      onChange={(e) => setSafetyThreshold(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-mono font-bold text-rose-700 text-sm"
                    />
                    <span className="text-[10px] text-outline mt-0.5 block">إطلاق إشعار حرج عند هبوط الرصيد أدنى هذا الحد</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">نقطة إعادة طلب الإنتاج (Reorder Point)</label>
                    <input
                      type="number"
                      value={reorderPoint}
                      onChange={(e) => setReorderPoint(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-mono font-bold text-amber-700 text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold text-on-surface mb-1">المستودع الرئيسي المعتمد للتخزين</label>
                    <select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-semibold text-on-surface"
                    >
                      <option value="مستودع المنتج التام المركزي - المحلة الكبرى">مستودع المنتج التام المركزي - المحلة الكبرى (المقر والمصانع الرئيسية)</option>
                      <option value="مستودع الأقمشة والخامات - مجمع المحلة الكبرى">مستودع الأقمشة والخامات - مجمع المحلة الكبرى</option>
                      <option value="صالة التجهيز وشحن الصادرات - المحلة الكبرى">صالة التجهيز وشحن الصادرات - المحلة الكبرى</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold text-on-surface mb-1">مواصفة التعبئة والتغليف (Packaging Spec)</label>
                    <input
                      type="text"
                      value={packagingType}
                      onChange={(e) => setPackagingType(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low text-xs text-on-surface"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 6: Sales & Distribution ================= */}
            {currentStep === 6 && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-gold">storefront</span>
                      <span>الخطوة 6: قنوات البيع والتوزيع وشروط التعاقد</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تفعيل قنوات المبيعات، الحد الأدنى لطلبيات الجملة والتصدير (MOQ)، والتعرفة الجمركية.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-secondary-container text-secondary font-bold">
                    قنوات متعددة
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-on-surface mb-2">قنوات التوزيع المعتمدة للموديل:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        "وكلاء وموزعو الجملة المحليون",
                        "عقود التصدير B2B للأسواق الإقليمية",
                        "معارض سوتكس ونقاط البيع المباشرة",
                        "المتجر الإلكتروني والطلبيات المباشرة DTC",
                      ].map((ch) => {
                        const isChecked = channels.includes(ch);
                        return (
                          <label
                            key={ch}
                            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                              isChecked
                                ? "border-primary bg-primary/5 font-bold text-primary"
                                : "border-outline-variant/30 text-on-surface hover:bg-surface-container-low"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleChannel(ch)}
                              className="w-4 h-4 rounded text-primary"
                            />
                            <span>{ch}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-on-surface mb-1">الحد الأدنى لطلبيات الجملة (MOQ قطعة) *</label>
                      <input
                        type="number"
                        value={minQtyWholesale}
                        onChange={(e) => setMinQtyWholesale(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-mono font-bold text-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-on-surface mb-1">كود البند الجمركي للتصدير (HS Code)</label>
                      <input
                        type="text"
                        value={hsCode}
                        onChange={(e) => setHsCode(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low font-mono text-xs"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block font-semibold text-on-surface mb-1">شروط السداد والائتمان المعتمدة</label>
                      <input
                        type="text"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 7: Review & Final Submit ================= */}
            {currentStep === 7 && (
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-gold">verified</span>
                      <span>الخطوة 7: المراجعة النهائية واعتماد التكويد في Supabase</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تم استيفاء جميع المتطلبات الفنية والتسعيرية ومصفوفة الـ SKUs. اضغط على الزر أدناه للحفظ الفوري.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-[#E8F8F0] text-[#16A36A] font-bold">
                    جاهز 100%
                  </span>
                </div>

                {/* Final Review Passport Card */}
                <div className="p-4 rounded-xl border border-brand-gold/40 bg-surface-container-low space-y-4">
                  <div className="flex items-start gap-4">
                    <img src={imageUrl} alt={nameAr} className="w-20 h-24 object-cover rounded-xl border border-outline-variant/40 shadow-xs" />
                    <div className="space-y-1 flex-1 text-xs">
                      <h3 className="font-bold text-primary text-sm">{nameAr}</h3>
                      <p className="font-mono text-outline">{skuCode} • {categoryAr} • {season}</p>
                      <p className="text-on-surface-variant">{fabricSpec}</p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-primary text-white text-[11px] font-bold">
                          {wholesalePrice} ج.م جملة
                        </span>
                        <span className="px-2 py-0.5 rounded bg-secondary text-white text-[11px] font-bold">
                          {retailPrice} ج.م تجزئة
                        </span>
                        <span className="px-2 py-0.5 rounded bg-brand-gold/20 text-brand-bronze text-[11px] font-bold">
                          ${exportPriceUsd} تصدير
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-outline-variant/20">
                    <div className="p-2 rounded-lg bg-surface-container-lowest">
                      <span className="text-[10px] text-outline block">ألوان الموديل:</span>
                      <span className="font-bold text-primary">{selectedColors.length} ألوان معتمدة</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-lowest">
                      <span className="text-[10px] text-outline block">مقاسات الموديل:</span>
                      <span className="font-bold text-primary">{selectedSizes.join(", ")}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-lowest">
                      <span className="text-[10px] text-outline block">وحدات الـ SKUs:</span>
                      <span className="font-bold text-[#16A36A]">{totalSkusCount} كود SKU</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-lowest">
                      <span className="text-[10px] text-outline block">الرصيد الافتتاحي:</span>
                      <span className="font-bold text-primary">{availableQty.toLocaleString()} قطعة</span>
                    </div>
                  </div>
                </div>

                {/* Big Commit Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleSaveProduct("IN_PRODUCTION")}
                    disabled={isSaving}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border-2 border-brand-gold/60 hover:border-brand-gold font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] text-brand-gold">
                      verified
                    </span>
                    <span>
                      {isSaving
                        ? "جاري اعتماد وتكويد الصنف والـ SKUs في Supabase..."
                        : "تأكيد واعتماد وحفظ الموديل في قاعدة بيانات Supabase فوراً"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Assistant & Live Preview Deck (4 cols on large screens) */}
          <div className="lg:col-span-4 space-y-space-md">
            
            {/* Live Progress Card */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary text-xs">نسبة اكتمال المواصفة الفنية</span>
                <span className="font-mono font-bold text-xs text-[#16A36A]">
                  {Math.round((currentStep / 7) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-gold to-[#16A36A] transition-all duration-300"
                  style={{ width: `${(currentStep / 7) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant">
                الخطوة الحالية: <strong>{steps[currentStep - 1].title}</strong> ({currentStep} من 7)
              </p>
            </div>

            {/* Model Card Snapshot */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 space-y-3">
              <span className="font-bold text-on-surface text-xs block">معاينة بطاقة الموديل بالكتالوج:</span>
              <div className="relative rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container">
                <img src={imageUrl} alt={nameAr} className="w-full h-44 object-cover" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-primary/90 text-white font-mono text-[10px] font-bold">
                  {skuCode}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-primary block">{nameAr}</span>
                <span className="text-on-surface-variant text-[11px] block">{categoryAr} • {season}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                <span className="text-outline">سعر الجملة:</span>
                <span className="font-bold font-mono text-primary">{wholesalePrice} ج.م</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline">سعر التجزئة:</span>
                <span className="font-bold font-mono text-secondary">{retailPrice} ج.م</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline">هامش الربح:</span>
                <span className="font-bold font-mono text-[#16A36A]">+{wholesaleMarginPct}%</span>
              </div>
            </div>

            {/* Security & RLS Compliance Card */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <span className="material-symbols-outlined text-[16px] text-brand-gold">shield</span>
                <span>الحفظ المباشر في Supabase</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                يتم تسجيل العملية باسم <strong>{currentUser.nameAr}</strong> ({roleConfig.nameAr}) وتوثيقها تلقائياً في جدول التدقيق غير القابل للتعديل <code>audit_logs</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Sticky Bar with Previous / Next Controls */}
      <div className="fixed bottom-0 right-0 md:right-72 left-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md shadow-lg z-50 px-gutter flex items-center justify-between gap-4 border-t border-outline-variant/30">
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-primary">
            الخطوة {currentStep} من 7:
          </span>
          <span className="text-xs text-on-surface-variant hidden sm:inline">
            {steps[currentStep - 1].title}
          </span>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Previous Step Button */}
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className={`h-9 px-4 rounded-lg border border-outline-variant/50 text-xs font-semibold flex items-center gap-1 transition-all ${
              currentStep === 1
                ? "opacity-40 cursor-not-allowed bg-surface-container"
                : "bg-surface-container-low text-primary hover:bg-surface-container cursor-pointer"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            <span>السابق</span>
          </button>

          {/* Next Step Button (if not on last step) */}
          {currentStep < 7 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
              className="h-9 px-5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>التالي</span>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveProduct("IN_PRODUCTION")}
              disabled={isSaving}
              className="h-9 px-6 rounded-lg bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border border-brand-gold/40 hover:border-brand-gold text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-brand-gold">check</span>
              <span>{isSaving ? "جاري الاعتماد..." : "اعتماد وتكويد الموديل في Supabase"}</span>
            </button>
          )}

          {/* Secondary Save Draft Button */}
          <button
            type="button"
            onClick={() => handleSaveProduct("DRAFT")}
            disabled={isSaving}
            className="hidden sm:flex h-9 px-3 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-primary text-xs items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            <span>مسودة</span>
          </button>
        </div>
      </div>
    </main>
  );
}
