"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface FabricItem {
  code: string;
  name: string;
  composition: string;
  colorName: string;
  colorCode: string;
  rollsCount: number;
  totalMeters: number;
  reservedMeters: number;
  availableMeters: number;
  location: string;
  lotNumber: string;
  supplier: string;
  status: "available" | "low" | "critical";
}

export default function FabricsInventoryPage() {
  const { showToast, currentRole, currentUser } = useERP();
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFabric, setNewFabric] = useState({
    code: "",
    name: "",
    composition: "100% قطن مصري",
    colorName: "كحلي",
    colorCode: "#1E3A8A",
    rollsCount: 10,
    totalMeters: 1000,
    location: "ممر A - رف 05",
    lotNumber: "",
    supplier: "مصر للغزل والنسيج",
  });

  const fetchFabrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("fabric_batches")
        .select("*")
        .order("code");
      if (fetchError) throw fetchError;
      if (data) {
        setFabrics(
          data.map((r) => ({
            code: r.code,
            name: r.name,
            composition: r.composition || "",
            colorName: r.color_name || "",
            colorCode: r.color_code || "#1E3A8A",
            rollsCount: Number(r.rolls_count || 0),
            totalMeters: Number(r.total_meters || 0),
            reservedMeters: Number(r.reserved_meters || 0),
            availableMeters: Number(r.available_meters || 0),
            location: r.location || "",
            lotNumber: r.lot_number || "",
            supplier: r.supplier || "",
            status: (r.status || "available") as FabricItem["status"],
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل أرصدة الأقمشة");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFabrics();
  }, [fetchFabrics]);

  const handleAddFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFabric.code || !newFabric.name) return;
    setIsSubmitting(true);
    try {
      const { error: insertErr } = await supabase.from("fabric_batches").insert({
        code: newFabric.code,
        name: newFabric.name,
        composition: newFabric.composition,
        color_name: newFabric.colorName,
        color_code: newFabric.colorCode,
        rolls_count: Number(newFabric.rollsCount),
        total_meters: Number(newFabric.totalMeters),
        reserved_meters: 0,
        available_meters: Number(newFabric.totalMeters),
        location: newFabric.location,
        lot_number: newFabric.lotNumber || `LOT-${Math.floor(9000 + Math.random() * 999)}`,
        supplier: newFabric.supplier,
        status: "available",
      });
      if (insertErr) throw insertErr;
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `إضافة دفعة أقمشة جديدة ${newFabric.code} (${newFabric.totalMeters} متر)`,
        module: "المخازن",
        severity: "normal",
      });
      showToast("success", "تم تسجيل دفعة الأقمشة", `تمت إضافة ${newFabric.name} إلى قاعدة بيانات المخازن.`);
      setShowAddForm(false);
      await fetchFabrics();
    } catch (err: unknown) {
      showToast("error", "تعذر إضافة الدفعة", err instanceof Error ? err.message : "خطأ في الصلاحيات أو قاعدة البيانات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = fabrics.filter(
    (f) =>
      f.name.includes(search) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.lotNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalMetersSum = fabrics.reduce((acc, f) => acc + f.totalMeters, 0);
  const reservedSum = fabrics.reduce((acc, f) => acc + f.reservedMeters, 0);
  const availableSum = fabrics.reduce((acc, f) => acc + f.availableMeters, 0);
  const criticalCount = fabrics.filter((f) => f.status === "critical").length;

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">texture</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">أرصدة الأقمشة والخامات والإكسسوارات</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            إدارة رولات القماش الخام، أرقام الدفعات (Lots)، الأمتار المتاحة والمحجوزة لأوامر التشغيل
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>إضافة دفعة أقمشة جديدة</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddFabric} className="p-4 rounded-xl border border-primary/30 bg-surface-container-lowest space-y-3 text-right shadow-sm">
          <h3 className="text-xs font-bold text-primary">تسجيل دفعة أقمشة جديدة في قاعدة البيانات</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              required
              placeholder="كود القماش (مثال: FAB-CTN-501)"
              value={newFabric.code}
              onChange={(e) => setNewFabric({ ...newFabric, code: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <input
              required
              placeholder="اسم ونوع القماش"
              value={newFabric.name}
              onChange={(e) => setNewFabric({ ...newFabric, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              required
              type="number"
              placeholder="إجمالي الأمتار"
              value={newFabric.totalMeters}
              onChange={(e) => setNewFabric({ ...newFabric, totalMeters: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <div className="flex gap-2">
              <input
                placeholder="رقم اللوت (LOT-9950)"
                value={newFabric.lotNumber}
                onChange={(e) => setNewFabric({ ...newFabric, lotNumber: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-primary text-white font-bold disabled:opacity-50"
              >
                {isSubmitting ? "جاري..." : "حفظ"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">إجمالي رصيد الأقمشة</span>
          <p className="text-2xl font-bold font-mono text-primary mt-1">{totalMetersSum.toLocaleString()} متر</p>
          <span className="text-[11px] text-outline font-mono">
            {fabrics.reduce((acc, f) => acc + f.rollsCount, 0)} رول في المستودعات
          </span>
        </div>
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">محجوز لأوامر الإنتاج</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{reservedSum.toLocaleString()} متر</p>
          <span className="text-[11px] text-outline">مرتبط بأوامر القص النشطة</span>
        </div>
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">صافي المتاح للصرف</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">{availableSum.toLocaleString()} متر</p>
          <span className="text-[11px] text-outline">جاهز للتشغيل فوراً</span>
        </div>
        <div className="p-4 rounded-xl border border-error/30 bg-error/5 text-right">
          <span className="text-xs text-error font-semibold">نواقص دون حد الأمان</span>
          <p className="text-2xl font-bold font-mono text-error mt-1">{criticalCount} صنف حرج</p>
          <span className="text-[11px] text-error font-mono">يحتاج طلب شراء عاجل</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="بحث بكود الخامة، اسم القماش، أو رقم الدفعة (Lot)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل دفعات الأقمشة من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchFabrics} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Fabrics Table */}
      {!isLoading && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">كود القماش</th>
                <th className="p-3">النوع والمواصفة</th>
                <th className="p-3">اللون</th>
                <th className="p-3">رقم الدفعة (Lot)</th>
                <th className="p-3">عدد الرولات</th>
                <th className="p-3">إجمالي الأمتار</th>
                <th className="p-3">المحجوز</th>
                <th className="p-3">المتاح للصرف</th>
                <th className="p-3">الموقع</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((item) => (
                <tr key={item.code} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{item.code}</td>
                  <td className="p-3">
                    <div className="font-semibold text-on-surface">{item.name}</div>
                    <div className="text-[11px] text-outline">{item.composition}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: item.colorCode }} />
                      <span>{item.colorName}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-outline">{item.lotNumber}</td>
                  <td className="p-3 font-mono">{item.rollsCount} رول</td>
                  <td className="p-3 font-mono font-bold">{item.totalMeters} م</td>
                  <td className="p-3 font-mono text-amber-700">{item.reservedMeters} م</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">{item.availableMeters} م</td>
                  <td className="p-3 text-on-surface-variant">{item.location}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.status === "critical" ? "bg-error text-on-error" :
                      item.status === "low" ? "bg-amber-500 text-white" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {item.status === "critical" ? "حرج" : item.status === "low" ? "منخفض" : "متوفر"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
