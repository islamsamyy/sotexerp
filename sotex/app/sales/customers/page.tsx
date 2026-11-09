"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface Customer {
  id: string;
  name: string;
  type: "export" | "wholesale";
  typeAr: string;
  countryOrCity: string;
  totalOrdersVolume: string;
  outstandingBalanceEGP: number;
  creditLimitEGP: number;
  contactPerson: string;
  phone: string;
}

export default function CustomersPage() {
  const { showToast, canViewCost, currentRole, currentUser } = useERP();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    id: "",
    name: "",
    type: "wholesale" as "wholesale" | "export",
    typeAr: "جملة محلي",
    countryOrCity: "القاهرة",
    contactPerson: "",
    phone: "",
    creditLimitEGP: 500000,
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (fetchErr) throw fetchErr;
      if (data) {
        setCustomers(
          data.map((r) => {
            const rawType = (r.type || "").toLowerCase();
            const normType: Customer["type"] = rawType.includes("export") ? "export" : "wholesale";
            return {
              id: r.id,
              name: r.name,
              type: normType,
              typeAr: r.type_ar || (normType === "export" ? "تصدير خارجي" : "توكيل جملة"),
              countryOrCity: r.country_or_city || "",
              totalOrdersVolume: r.total_orders_volume || "0 قطعة",
              outstandingBalanceEGP: Number(r.outstanding_balance_egp || 0),
              creditLimitEGP: Number(r.credit_limit_egp || 0),
              contactPerson: r.contact_person || "",
              phone: r.phone || "",
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل دليل العملاء");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    setIsSubmitting(true);
    const generatedId = newCustomer.id || `CUST-${Math.floor(100 + Math.random() * 899)}`;
    try {
      const { error: insertErr } = await supabase.from("customers").insert({
        id: generatedId,
        name: newCustomer.name,
        type: newCustomer.type === "export" ? "EXPORT" : "WHOLESALE",
        type_ar: newCustomer.type === "export" ? "تصدير خارجي" : "توكيل جملة محلي",
        country_or_city: newCustomer.countryOrCity,
        total_orders_volume: "0 قطعة",
        outstanding_balance_egp: 0,
        credit_limit_egp: Number(newCustomer.creditLimitEGP),
        contact_person: newCustomer.contactPerson,
        phone: newCustomer.phone,
      });
      if (insertErr) throw insertErr;
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `تكويد عميل جديد: ${newCustomer.name} (${generatedId})`,
        module: "المبيعات",
        severity: "normal",
      });
      showToast("success", "تم تكويد العميل بنجاح", `تمت إضافة ${newCustomer.name} إلى قاعدة بيانات العملاء.`);
      setShowAddForm(false);
      setNewCustomer({
        id: "",
        name: "",
        type: "wholesale",
        typeAr: "جملة محلي",
        countryOrCity: "القاهرة",
        contactPerson: "",
        phone: "",
        creditLimitEGP: 500000,
      });
      await fetchCustomers();
    } catch (err: unknown) {
      showToast("error", "تعذر تسجيل العميل", err instanceof Error ? err.message : "خطأ في الصلاحيات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.includes(search) ||
      c.countryOrCity.includes(search) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">group</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">دليل حسابات العملاء وتوكيلات التوزيع والتصدير</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            سجل عملاء الجملة والتصدير، الحدود الائتمانية، والأرصدة المستحقة
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>إضافة عميل أو توكيل جديد</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCustomer} className="p-4 rounded-xl border border-primary/30 bg-surface-container-lowest space-y-3 text-right shadow-sm">
          <h3 className="text-xs font-bold text-primary">تسجيل وتكويد عميل جديد في النظام</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              required
              placeholder="اسم العميل أو الشركة"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <select
              value={newCustomer.type}
              onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  type: e.target.value as "wholesale" | "export",
                  typeAr: e.target.value === "export" ? "تصدير خارجي" : "توكيل جملة محلي",
                })
              }
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            >
              <option value="wholesale">جملة محلي</option>
              <option value="export">تصدير خارجي</option>
            </select>
            <input
              placeholder="المدينة / الدولة"
              value={newCustomer.countryOrCity}
              onChange={(e) => setNewCustomer({ ...newCustomer, countryOrCity: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              placeholder="الشخص المسؤول"
              value={newCustomer.contactPerson}
              onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              placeholder="رقم الهاتف"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <input
              type="number"
              placeholder="الحد الائتماني (ج.م)"
              value={newCustomer.creditLimitEGP}
              onChange={(e) => setNewCustomer({ ...newCustomer, creditLimitEGP: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <div className="sm:col-span-2 flex justify-end gap-2">
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
                {isSubmitting ? "جاري الحفظ..." : "حفظ العميل"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="بحث باسم العميل، المدينة، أو الكود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل دليل العملاء من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCustomers} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Customer Cards Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((cust) => (
            <div
              key={cust.id}
              className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right space-y-3 shadow-xs hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary">{cust.id}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary/15 text-secondary border border-secondary/30">
                  {cust.typeAr}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-on-surface">{cust.name}</h3>
                <p className="text-xs text-outline mt-0.5">{cust.countryOrCity}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20 text-xs">
                <div className="p-2 rounded bg-surface-container-low">
                  <span className="text-[10px] text-outline">حجم الطلبيات:</span>
                  <p className="font-mono font-bold text-on-surface">{cust.totalOrdersVolume}</p>
                </div>
                <div className="p-2 rounded bg-surface-container-low">
                  <span className="text-[10px] text-outline">الرصيد المدين:</span>
                  <p className={`font-mono font-bold ${cust.outstandingBalanceEGP > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {canViewCost ? `${cust.outstandingBalanceEGP.toLocaleString()} ج.م` : "••••••"}
                  </p>
                </div>
              </div>

              <div className="text-xs text-on-surface-variant flex items-center justify-between pt-1">
                <span>المسؤول: {cust.contactPerson}</span>
                <span className="font-mono text-outline">{cust.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
