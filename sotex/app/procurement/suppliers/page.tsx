"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface Supplier {
  id: string;
  name: string;
  category: string;
  city: string;
  contactPerson: string;
  phone: string;
  rating: number;
  creditDays: number;
  openOrdersCount: number;
  status: "approved" | "under_review";
}

export default function SuppliersPage() {
  const { showToast, currentRole, currentUser } = useERP();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    category: "أقمشة قطنية وخامات نسيج",
    city: "المحلة الكبرى",
    contactPerson: "",
    phone: "",
    creditDays: 45,
  });

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (fetchErr) throw fetchErr;
      if (data) {
        setSuppliers(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category || "خامات ومستلزمات إنتاج",
            city: r.city || "المحلة الكبرى",
            contactPerson: r.contact_person || "",
            phone: r.phone || "",
            rating: Number(r.rating || 4.5),
            creditDays: Number(r.credit_days || 30),
            openOrdersCount: Number(r.open_orders_count || 0),
            status: (r.status === "UNDER_REVIEW" ? "under_review" : "approved") as Supplier["status"],
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل دليل الموردين");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    setIsSubmitting(true);
    const newId = `SUP-${Math.floor(100 + Math.random() * 899)}`;
    try {
      const { error: insertErr } = await supabase.from("suppliers").insert({
        id: newId,
        name: newSupplier.name,
        category: newSupplier.category,
        city: newSupplier.city,
        contact_person: newSupplier.contactPerson,
        phone: newSupplier.phone,
        rating: 4.8,
        credit_days: Number(newSupplier.creditDays),
        open_orders_count: 0,
        status: "PREFERRED",
      });
      if (insertErr) throw insertErr;
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `تسجيل وتوثيق مورد معتمد جديد: ${newSupplier.name} (${newId})`,
        module: "المشتريات",
        severity: "normal",
      });
      showToast("success", "تم تسجيل المورد بنجاح", `تمت إضافة ${newSupplier.name} إلى دليل الموردين المعتمدين.`);
      setShowAddForm(false);
      setNewSupplier({
        name: "",
        category: "أقمشة قطنية وخامات نسيج",
        city: "المحلة الكبرى",
        contactPerson: "",
        phone: "",
        creditDays: 45,
      });
      await fetchSuppliers();
    } catch (err: unknown) {
      showToast("error", "تعذر تسجيل المورد", err instanceof Error ? err.message : "خطأ في الصلاحيات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.includes(search) ||
      s.category.includes(search) ||
      s.city.includes(search) ||
      s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">corporate_fare</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">دليل وسجل الموردين المعتمدين وعقود الإمداد</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            إدارة مصانع الغزل والنسيج، موردي الأزرار والإكسسوارات، وتقييم جودة التوريد
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>تسجيل مورد معتمد جديد</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSupplier} className="p-4 rounded-xl border border-primary/30 bg-surface-container-lowest space-y-3 text-right shadow-sm">
          <h3 className="text-xs font-bold text-primary">تسجيل وتوثيق مورد معتمد جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <input
              required
              placeholder="اسم المورد أو المصنع"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              placeholder="تصنيف الخامات (مثال: أقمشة، أزرار)"
              value={newSupplier.category}
              onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              placeholder="المدينة / المركز الصناعي"
              value={newSupplier.city}
              onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              placeholder="مسؤول الاتصال"
              value={newSupplier.contactPerson}
              onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              placeholder="رقم الهاتف"
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <input
              type="number"
              placeholder="فترة السداد (أيام)"
              value={newSupplier.creditDays}
              onChange={(e) => setNewSupplier({ ...newSupplier, creditDays: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
              >
                {isSubmitting ? "جاري التسجيل..." : "تسجيل المورد"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="max-w-md">
        <input
          type="text"
          placeholder="بحث باسم المورد، التصنيف، أو المدينة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل الموردين من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSuppliers} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sup) => (
            <div
              key={sup.id}
              className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right space-y-3 shadow-xs hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-primary">{sup.id}</span>
                  <h3 className="font-bold text-sm text-on-surface mt-0.5">{sup.name}</h3>
                  <span className="text-xs text-outline">{sup.category}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs font-mono">
                  <span className="material-symbols-outlined text-[16px] text-amber-500 fill-1">star</span>
                  <span>{sup.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20 text-xs">
                <div className="p-2 rounded bg-surface-container-low">
                  <span className="text-[10px] text-outline">المدينة:</span>
                  <p className="font-medium text-on-surface">{sup.city}</p>
                </div>
                <div className="p-2 rounded bg-surface-container-low">
                  <span className="text-[10px] text-outline">فترة السداد:</span>
                  <p className="font-mono font-bold text-on-surface">{sup.creditDays} يوماً</p>
                </div>
                <div className="p-2 rounded bg-surface-container-low">
                  <span className="text-[10px] text-outline">أوامر جارية:</span>
                  <p className="font-mono font-bold text-primary">{sup.openOrdersCount} أوامر</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-on-surface-variant">
                <span>مسؤول الاتصال: {sup.contactPerson}</span>
                <span className="font-mono text-outline">{sup.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
