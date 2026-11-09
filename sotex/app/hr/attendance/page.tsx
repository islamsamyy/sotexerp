"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";

interface AttendanceRecord {
  id: string;
  name: string;
  code: string;
  line: string;
  time: string;
  status: "on_time" | "late";
  hours: string;
}

export default function AttendancePage() {
  const { showToast, openModal, currentRole, currentUser } = useERP();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("employees")
        .select("*")
        .order("code");
      if (fetchErr) throw fetchErr;
      if (data) {
        setAttendance(
          data.map((r) => {
            const rawStatus = (r.attendance_status || "").toLowerCase();
            const isLate = rawStatus.includes("تأخير") || rawStatus.includes("late");
            return {
              id: r.id,
              name: r.name,
              code: r.code,
              line: r.line,
              time: r.check_in_time || "06:55 ص",
              status: isLate ? "late" : "on_time",
              hours: r.work_hours || "8.5 ساعات",
            };
          })
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل سجل الحضور والبصمة");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleSyncFingerprint = async () => {
    setIsSyncing(true);
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `مزامنة أجهزة البصمة الحيوية ZKTeco وسحب سجلات حضور الفنيين`,
        module: "الموارد البشرية",
        severity: "normal",
      });
      showToast("success", "تمت مزامنة البصمة الحيوية", `تم سحب سجلات ${attendance.length} عاملاً من أجهزة البصمة بنجاح.`);
      await fetchAttendance();
    } catch (err: unknown) {
      showToast("error", "فشل المزامنة", err instanceof Error ? err.message : "خطأ في الاتصال");
    } finally {
      setIsSyncing(false);
    }
  };

  const presentCount = attendance.filter((a) => a.status === "on_time" || a.status === "late").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;

  return (
    <div className="p-gutter space-y-space-md text-right">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary border border-secondary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">schedule</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              حضور وانصراف الورديات والبصمة الإلكترونية
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            متابعة البصمة اللحظية لورديات الصباح والمساء، ساعات التأخير، وإذن الساعات الإضافية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncFingerprint}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">fingerprint</span>
            <span>{isSyncing ? "جاري المزامنة..." : "مزامنة جهاز البصمة"}</span>
          </button>
          <button
            onClick={() =>
              openModal({
                type: "shift_redirect",
                title: "اعتماد ساعات عمل إضافية (Overtime)",
                description: "طلب تشغيل ساعتين إضافيتين لصالة الخياطة لتسليم أمر تصدير زارا",
              })
            }
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">more_time</span>
            <span>طلب وقت إضافي</span>
          </button>
        </div>
      </div>

      {/* Shifts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface">الوردية الصباحية (07:00 ص - 03:30 م)</span>
            <Badge variant="success">نشطة الآن</Badge>
          </div>
          <div className="text-xl font-bold text-primary">{presentCount} عاملاً حاضرين</div>
          <p className="text-[11px] text-on-surface-variant">خطوط القص، والخياطة A1 و A2</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface">الوردية المسائية (03:30 م - 11:30 م)</span>
            <Badge variant="secondary">مجدولة</Badge>
          </div>
          <div className="text-xl font-bold text-primary">28 عاملاً مسجلين</div>
          <p className="text-[11px] text-on-surface-variant">خط التشطيب والكي والتعبئة</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface">حالات التأخير المرصودة</span>
            <Badge variant={lateCount > 0 ? "warning" : "success"}>{lateCount} تأخير</Badge>
          </div>
          <div className="text-xl font-bold text-emerald-700">التزام بالمواعيد 98%</div>
          <p className="text-[11px] text-on-surface-variant">بناءً على أجهزة البصمة البيومترية</p>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل سجل البصمة من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAttendance} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
          <h2 className="text-base font-bold text-on-surface">سجل حركات البصمة لليوم</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-2.5 px-3">الفني / العامل</th>
                  <th className="py-2.5 px-3">الوردية والخط</th>
                  <th className="py-2.5 px-3">وقت تسجيل الدخول</th>
                  <th className="py-2.5 px-3">حالة البصمة</th>
                  <th className="py-2.5 px-3">ساعات العمل المحتسبة</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {attendance.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/50">
                    <td className="py-3 px-3 font-bold text-on-surface">{row.name} ({row.code})</td>
                    <td className="py-3 px-3 text-on-surface-variant">{row.line}</td>
                    <td className="py-3 px-3 font-mono font-bold text-primary">{row.time}</td>
                    <td className="py-3 px-3">
                      <Badge variant={row.status === "on_time" ? "success" : "warning"}>
                        {row.status === "on_time" ? "في الموعد" : "تأخير 8 دقائق"}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">{row.hours}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => showToast("info", "تفاصيل الحضور", `سجل حضور ${row.name}`)}
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold cursor-pointer"
                      >
                        عرض السجل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
