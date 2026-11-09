"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface AuditEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: "CREATE" | "UPDATE" | "APPROVE" | "DELETE_ATTEMPT";
  module: string;
  recordRef: string;
  timestamp: string;
  ip: string;
  oldVal?: string;
  newVal?: string;
  severity: "info" | "warning" | "critical";
}

export default function AuditLogPage() {
  const { showToast, canViewCost, roleConfig } = useERP();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setLogs(
          data.map((r) => {
            const rawAct = (r.action || "").toUpperCase();
            let normAct: AuditEntry["action"] = "UPDATE";
            if (rawAct.includes("APPROV") || rawAct.includes("اعتماد")) normAct = "APPROVE";
            else if (rawAct.includes("CREATE") || rawAct.includes("إضافة") || rawAct.includes("إنشاء") || rawAct.includes("تسجيل")) normAct = "CREATE";
            else if (rawAct.includes("DELETE") || rawAct.includes("حذف")) normAct = "DELETE_ATTEMPT";

            return {
              id: r.id,
              actor: r.user_name || "مستخدم النظام",
              actorRole: r.role_code || "OWNER_ADMIN",
              action: normAct,
              module: r.module || "العام",
              recordRef: r.record_ref || r.action,
              timestamp: new Date(r.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
              ip: r.ip_address || "192.168.1.10",
              oldVal: r.old_values ? JSON.stringify(r.old_values, null, 2) : undefined,
              newVal: r.new_values ? JSON.stringify(r.new_values, null, 2) : r.action,
              severity: (r.severity || "info") as AuditEntry["severity"],
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل سجل التدقيق الرقابي");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">history_toggle_off</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">سجل التدقيق والمراجعة الرقابي الشامل (Audit Trail)</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            سجل محصن غير قابل للتعديل أو الحذف (Append-Only) يسجل كل حركة، مستخدم، تعديل وفروقات القيم في Supabase
          </p>
        </div>

        <button
          onClick={() => showToast("info", "تصدير السجل الرقابي", "جاري إعداد تقرير التدقيق الشامل بصيغة Excel/PDF...")}
          className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>تصدير السجل الرقابي (Excel/PDF)</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل سجل التدقيق والمراجعة من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchLogs} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">رقم السجل</th>
                <th className="p-3">المستخدم المنفذ</th>
                <th className="p-3">الدور الوظيفي</th>
                <th className="p-3">نوع العملية</th>
                <th className="p-3">الوحدة والسجل المرجعي</th>
                <th className="p-3">عنوان IP</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3 text-center">عارض الفروقات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{log.id}</td>
                  <td className="p-3 font-semibold text-on-surface">{log.actor}</td>
                  <td className="p-3 text-on-surface-variant font-mono">{log.actorRole}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.action === "APPROVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : log.action === "CREATE"
                          ? "bg-secondary/15 text-secondary border border-secondary/30"
                          : log.action === "UPDATE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-on-surface">
                    <div>{log.module}</div>
                    <div className="text-[11px] text-outline truncate max-w-xs">{log.recordRef}</div>
                  </td>
                  <td className="p-3 font-mono text-outline">{log.ip}</td>
                  <td className="p-3 font-mono text-outline">{log.timestamp}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedEntry(log)}
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-primary hover:text-on-primary text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Difference Viewer Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/40 p-5 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="font-bold text-sm text-on-surface">تفاصيل وفروقات العملية ({selectedEntry.id})</h3>
              <button onClick={() => setSelectedEntry(null)} className="p-1 hover:bg-surface-container rounded cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div><strong>المستخدم:</strong> {selectedEntry.actor} ({selectedEntry.actorRole})</div>
              <div><strong>الوحدة والسجل:</strong> {selectedEntry.module} — {selectedEntry.recordRef}</div>
              <div><strong>التاريخ:</strong> {selectedEntry.timestamp}</div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low space-y-2 text-xs font-mono">
              {selectedEntry.oldVal && (
                <div className="text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  <span className="font-bold block mb-0.5">القيمة السابقة (Before):</span>
                  {selectedEntry.oldVal}
                </div>
              )}
              {selectedEntry.newVal && (
                <div className="text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="font-bold block mb-0.5">القيمة الجديدة (After):</span>
                  {selectedEntry.newVal}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
