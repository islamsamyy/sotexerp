"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";
import { supabase, logAuditAction } from "@/lib/supabase";

interface WorkflowStep {
  id: string;
  order: number;
  role: string;
  condition: string;
  timeoutHours: number;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const { showToast, currentUser, roleConfig } = useERP();
  const [name, setName] = useState("مسار اعتماد أوامر شراء الخامات الحساسة");
  const [module, setModule] = useState("procurement");
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: "s-1", order: 1, role: "مدير المخازن والمستودعات", condition: "تحقق من رصيد الأمان الحالي في المخزن", timeoutHours: 12 },
    { id: "s-2", order: 2, role: "المدير المالي والتجاري", condition: "إذا كان المبلغ > 50,000 ج.م ومطابق للموازنة", timeoutHours: 24 },
    { id: "s-3", order: 3, role: "مالك المصنع / رئيس مجلس الإدارة", condition: "إذا تجاوز المبلغ 250,000 ج.م", timeoutHours: 48 },
  ]);

  const handleAddStep = () => {
    const nextOrder = steps.length + 1;
    setSteps([
      ...steps,
      {
        id: `s-${Date.now()}`,
        order: nextOrder,
        role: "مشرف الجودة AQL",
        condition: "اعتماد المواصفة الفنية ومعاينة عينة المعمل",
        timeoutHours: 24,
      },
    ]);
    showToast("info", "تمت إضافة مرحلة جديدة", `المرحلة رقم ${nextOrder}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newId = `WF-2026-${Math.floor(100 + Math.random() * 900)}`;
      const { error } = await supabase.from("approval_workflows").insert({
        id: newId,
        name,
        module,
        levels_count: steps.length,
        threshold_egp: "50,000 ج.م",
        approver_role: steps[steps.length - 1]?.role || "مالك المصنع / رئيس مجلس الإدارة",
        status: "ACTIVE",
      });

      if (error) throw error;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "إنشاء مسار اعتماد إداري ومالي جديد",
        entityType: "approval_workflows",
        entityId: newId,
        entityName: name,
        details: { levelsCount: steps.length, module },
        severity: "INFO",
      });

      showToast("success", "تم حفظ وتفعيل مسار الاعتماد في Supabase", `تم نشر المسار (${name}) بنجاح.`);
      setTimeout(() => {
        router.push("/settings/approvals/workflows");
      }, 400);
    } catch (err: any) {
      showToast("error", "فشل حفظ مسار الاعتماد", err?.message || "خطأ في قاعدة البيانات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">account_tree</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              منشئ مسارات الموافقات والاعتمادات المرئي (Visual Workflow Builder)
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            تصميم شجرة الاعتماد المتعددة المستويات حسب الصلاحيات والمبالغ والمحددات التشغيلية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings/approvals/workflows"
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface"
          >
            رجوع للمسارات
          </Link>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>حفظ واعتماد المسار</span>
          </button>
        </div>
      </div>

      {/* Form and Visual Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form config */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-on-surface">بيانات المسار</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">اسم مسار الاعتماد</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">القسم / الإدارة المعنية</label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
              >
                <option value="procurement">إدارة المشتريات وسلاسل الإمداد</option>
                <option value="production">إدارة الإنتاج والتشغيل</option>
                <option value="finance">الإدارة المالية والخزينة</option>
                <option value="sales">المبيعات وعقود التصدير</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">سلوك التخطي عند انتهاء المهلة (SLA)</label>
              <select className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low">
                <option>تصعيد فوري للمستوى الأعلى مع إشعار عاجل</option>
                <option>إيقاف المعاملة وتنبيه المدير المباشر</option>
                <option>اعتماد تلقائي مشروط</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Visual Steps Nodes */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <h2 className="text-base font-bold text-on-surface">مخطط مراحل ومحطات الموافقة التتابعية</h2>
            <button
              onClick={handleAddStep}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-primary flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>+ إضافة مرحلة موافقة</span>
            </button>
          </div>

          <div className="space-y-4 py-2">
            {steps.map((st, idx) => (
              <div key={st.id} className="relative flex items-start gap-4 p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low/40">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {st.order}
                </div>
                <div className="space-y-1 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface text-sm">{st.role}</span>
                    <Badge variant="info">المهلة القصوى: {st.timeoutHours} ساعة</Badge>
                  </div>
                  <p className="text-on-surface-variant text-[11px] font-medium">شرط التفعيل: {st.condition}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="absolute -bottom-4 right-8 w-0.5 h-4 bg-primary/40 pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

