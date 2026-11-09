"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CORE_ROLES, FACILITIES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

export default function NewUserWizardPage() {
  const router = useRouter();
  const { showToast, currentUser, roleConfig } = useERP();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nameAr: "",
    email: "",
    phone: "",
    code: "EMP-" + Math.floor(1000 + Math.random() * 9000),
    department: "الإنتاج والتصنيع",
    facilityId: FACILITIES[0].id,
    role: "PRODUCTION_MANAGER" as RoleKey,
    scope: "BRANCH",
    allowedWarehouses: ["مخزن الأقمشة الرئيسي"],
  });

  const nextStep = () => setStep((s) => Math.min(5, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    if (!formData.nameAr || !formData.email) {
      showToast("error", "بيانات غير مكتملة", "يرجى إدخال الاسم والبريد الإلكتروني على الأقل.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const newId = `user-${Date.now().toString().slice(-5)}`;
      const { error } = await supabase.from("user_profiles").insert({
        id: newId,
        code: formData.code,
        name_ar: formData.nameAr,
        email: formData.email,
        phone: formData.phone || "01000000000",
        role: formData.role,
        department_ar: formData.department,
        facility_id: formData.facilityId,
        avatar_url: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150`,
        status: "ACTIVE",
        last_login: "لم يسجل الدخول بعد",
      });

      if (error) throw error;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "إضافة حساب مستخدم وموظف جديد",
        entityType: "user_profiles",
        entityId: newId,
        entityName: formData.nameAr,
        details: { code: formData.code, role: formData.role },
        severity: "INFO",
      });

      showToast(
        "success",
        "تم حفظ المستخدم بنجاح في Supabase",
        `تم إنشاء الحساب للموظف (${formData.nameAr}) وتعيين الصلاحيات.`
      );

      setTimeout(() => {
        router.push("/settings/users");
      }, 500);
    } catch (err: any) {
      showToast("error", "فشل إضافة المستخدم", err?.message || "خطأ أثناء الحفظ في قاعدة البيانات");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-gutter max-w-4xl mx-auto space-y-space-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 text-right">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-on-surface">معالج إضافة مستخدم وموظف جديد</h1>
          <p className="font-body-sm text-sm text-on-surface-variant">خطوات تعيين الحساب، الدور الوظيفي، ونطاق الصلاحيات الجغرافية</p>
        </div>
        <Link href="/settings/users" className="text-xs text-outline hover:text-on-surface flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">close</span>
          <span>إلغاء والعودة</span>
        </Link>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs">
        {[
          { num: 1, label: "البيانات الأساسية" },
          { num: 2, label: "الوظيفة والفرع" },
          { num: 3, label: "تعيين الدور (الأدوار الـ 4)" },
          { num: 4, label: "نطاق المخازن والبيانات" },
          { num: 5, label: "المراجعة والاعتماد" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step === s.num ? "bg-primary text-on-primary" : step > s.num ? "bg-emerald-600 text-white" : "bg-surface-container text-on-surface-variant"
            }`}>
              {step > s.num ? "✓" : s.num}
            </span>
            <span className={`hidden sm:inline ${step === s.num ? "font-bold text-on-surface" : "text-outline"}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Contents */}
      <div className="p-6 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right space-y-5 shadow-xs">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-on-surface">الخطوة 1: البيانات الشخصية والاتصال</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">الاسم الكامل بالعربية *</label>
                <input
                  type="text"
                  placeholder="مثال: م. طارق الشناوي"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">البريد الإلكتروني للعمل *</label>
                <input
                  type="email"
                  placeholder="t.elshinnawi@sotex.eg"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">رقم الهاتف المحمول</label>
                <input
                  type="text"
                  placeholder="+20 100 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">كود الموظف التعريفي</label>
                <input
                  type="text"
                  disabled
                  value={formData.code}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container font-mono text-xs text-right text-outline"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-on-surface">الخطوة 2: القسم الإداري والفرع الرئيسي</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">القسم</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none"
                >
                  <option value="الإنتاج والتصنيع">الإنتاج والتصنيع</option>
                  <option value="المخازن والمستودعات">المخازن والمستودعات</option>
                  <option value="الحسابات والمالية">الحسابات والمالية</option>
                  <option value="توكيد الجودة">توكيد الجودة</option>
                  <option value="المبيعات والتصدير">المبيعات والتصدير</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">الفرع الرئيسي</label>
                <select
                  value={formData.facilityId}
                  onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none"
                >
                  {FACILITIES.map((f) => (
                    <option key={f.id} value={f.id}>{f.nameAr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-on-surface">الخطوة 3: تعيين أحد الأدوار الـ 4 الأساسية</h3>
            <p className="text-xs text-on-surface-variant">اختر الدور الوظيفي الذي يحدد شاشات وصلاحيات الموظف:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(CORE_ROLES) as RoleKey[]).map((rk) => {
                const r = CORE_ROLES[rk];
                const selected = formData.role === rk;
                return (
                  <div
                    key={rk}
                    onClick={() => setFormData({ ...formData, role: rk })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selected ? "border-primary bg-primary/5 shadow-xs" : "border-outline-variant/40 hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-on-surface">{r.nameAr}</span>
                      <span className="material-symbols-outlined text-[18px] text-primary">{r.icon}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{r.descriptionAr}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-on-surface">الخطوة 4: تحديد نطاق الوصول للبيانات (Data Scope)</h3>
            <p className="text-xs text-on-surface-variant">حدد الصلاحيات الجغرافية ومخازن الأقمشة والمنتج التام المصرح له بها:</p>
            <div className="space-y-2">
              {["مستودع الأقمشة المركزي - المحلة الكبرى", "مستودع الإكسسوارات والخيوط - المحلة الكبرى", "مستودع المنتج التام والتعبئة - المحلة الكبرى", "صالة الفحص وشحن الصادرات - المحلة الكبرى"].map((wh) => (
                <label key={wh} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer text-xs">
                  <input type="checkbox" defaultChecked className="rounded accent-primary" />
                  <span>{wh}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-on-surface">الخطوة 5: مراجعة البيانات واعتماد الإضافة</h3>
            <div className="p-4 rounded-xl bg-surface-container-low space-y-2 text-xs">
              <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                <span className="text-outline">الاسم:</span>
                <span className="font-bold text-on-surface">{formData.nameAr || "م. طارق الشناوي"}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                <span className="text-outline">البريد الإلكتروني:</span>
                <span className="font-mono text-on-surface">{formData.email || "t.elshinnawi@sotex.eg"}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/30 pb-2">
                <span className="text-outline">الدور الوظيفي:</span>
                <span className="font-bold text-primary">{CORE_ROLES[formData.role].nameAr}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-outline">الفرع الرئيسي:</span>
                <span className="text-on-surface">مجمع ومصانع سوتكس المركزي - المحلة الكبرى</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="px-4 py-2 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface"
            >
              الخطوة السابقة
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors"
            >
              التالي
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>حفظ واعتماد الحساب</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

