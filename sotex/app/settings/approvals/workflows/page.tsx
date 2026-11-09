"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface WorkflowItem {
  id: string;
  name: string;
  module: string;
  levelsCount: number;
  thresholdEGP?: string;
  approverRole: string;
  status: "active" | "inactive";
}

export default function ApprovalWorkflowsPage() {
  const { showToast, currentRole, currentUser } = useERP();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("approval_workflows")
        .select("*")
        .order("id");
      if (fetchErr) throw fetchErr;
      if (data) {
        setWorkflows(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            module: r.module,
            levelsCount: Number(r.levels_count || 1),
            thresholdEGP: r.threshold_egp || undefined,
            approverRole: r.approver_role,
            status: (r.status === "INACTIVE" ? "inactive" : "active") as WorkflowItem["status"],
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل مسارات الاعتماد");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">alt_route</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">مسارات الموافقات وفصل المهام (Maker-Checker)</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            ضبط مستويات الاعتماد التلقائي وحدود المبالغ المالية لمنع تضارب المصالح وفصل المهام الرقابية
          </p>
        </div>

        <button
          onClick={() => showToast("info", "إضافة مسار اعتماد", "تم فتح معالج إضافة مسار اعتماد جديد")}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>مسار اعتماد جديد</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل مسارات الاعتماد من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchWorkflows} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf.id} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">{wf.id}</span>
                  <span className="font-bold text-sm text-on-surface">{wf.name}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">نشط ومفعل</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                  <span>الوحدة: <strong className="text-on-surface">{wf.module}</strong></span>
                  <span>المستويات: <strong>{wf.levelsCount} مستويات</strong></span>
                  {wf.thresholdEGP && <span>الشرط المالي: <strong className="font-mono text-primary">{wf.thresholdEGP}</strong></span>}
                  <span>المعتمدون: <strong className="text-on-surface">{wf.approverRole}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => showToast("info", "تعديل المسار", `تعديل خطوات الاعتماد لـ ${wf.name}`)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold cursor-pointer"
                >
                  تعديل المسار
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
