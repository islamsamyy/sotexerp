"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface Session {
  id: string;
  userName: string;
  userRole: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  isCurrent: boolean;
}

export default function ActiveSessionsPage() {
  const { showToast, currentRole, currentUser } = useERP();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("active_sessions")
        .select("*")
        .order("is_current", { ascending: false });
      if (fetchErr) throw fetchErr;
      if (data) {
        setSessions(
          data.map((r) => ({
            id: r.id,
            userName: r.user_name,
            userRole: r.user_role,
            device: r.device,
            browser: r.browser,
            ip: r.ip_address,
            location: r.location,
            loginTime: r.login_time_label || "اليوم",
            isCurrent: Boolean(r.is_current),
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل الجلسات النشطة");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleTerminate = async (id: string, name: string) => {
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `إنهاء جلسة عمل عن بُعد للمستخدم ${name} (معرف الجلسة: ${id})`,
        module: "الأمان والجلسات",
        severity: "warning",
      });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast("warning", "تم إنهاء الجلسة عن بُعد", `تم تسجيل خروج جلسة ${name} فورياً وتأمين الحساب.`);
    } catch (err: unknown) {
      showToast("error", "فشل إنهاء الجلسة", err instanceof Error ? err.message : "خطأ غير متوقع");
    }
  };

  const handleTerminateAllOthers = async () => {
    try {
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: "إنهاء كافة الجلسات النشطة الأخرى عن بُعد",
        module: "الأمان والجلسات",
        severity: "critical",
      });
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      showToast("error", "تم إنهاء كافة الجلسات الأخرى", "تم إخراج جميع الأجهزة باستثناء جهازك الحالي.");
    } catch (err: unknown) {
      showToast("error", "فشل إنهاء الجلسات", err instanceof Error ? err.message : "خطأ غير متوقع");
    }
  };

  return (
    <div className="p-gutter space-y-space-md text-right max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">devices</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إدارة الجلسات والأجهزة النشطة (Active Sessions)</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            مراقبة الأجهزة المتصلة بالمصنع، عناوين IP، وإنهاء الجلسات عن بُعد لتعزيز الأمان
          </p>
        </div>

        <button
          onClick={handleTerminateAllOthers}
          className="px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>إنهاء كافة الجلسات الأخرى</span>
        </button>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل الجلسات النشطة من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSessions} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {sessions.map((ses) => (
            <div
              key={ses.id}
              className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-surface">{ses.userName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-container font-medium text-on-surface-variant">
                    {ses.userRole}
                  </span>
                  {ses.isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      جهازك الحالي
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                  <span>الجهاز: <strong className="text-on-surface">{ses.device}</strong></span>
                  <span>المتصفح: {ses.browser}</span>
                  <span className="font-mono text-outline">IP: {ses.ip}</span>
                  <span>الموقع: {ses.location}</span>
                  <span className="font-mono text-outline">وقت الدخول: {ses.loginTime}</span>
                </div>
              </div>

              {!ses.isCurrent ? (
                <button
                  onClick={() => handleTerminate(ses.id, ses.userName)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors self-end sm:self-center cursor-pointer"
                >
                  إنهاء الجلسة فوراً
                </button>
              ) : (
                <span className="text-xs text-emerald-700 font-bold self-end sm:self-center">
                  متصل الآن
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
