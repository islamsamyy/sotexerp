"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export default function UserActivityLogPage() {
  const params = useParams();
  const id = (params?.id as string) || "user-1";

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("المستخدم");
  const [activities, setActivities] = useState<any[]>([]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from("user_profiles")
        .select("name_ar")
        .eq("id", id)
        .maybeSingle();

      if (userData?.name_ar) setUserName(userData.name_ar);

      const { data: auditData, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(auditData || []);
    } catch (err) {
      console.error("Failed to load user activity logs:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="p-gutter space-y-space-md text-right max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              سجل نشاط وحركات المستخدم: {userName}
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            سجل التدقيق الأمني (Audit Log) الموثق لكل العمليات والتعديلات في Supabase
          </p>
        </div>

        <Link
          href={`/settings/users/${id}`}
          className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface"
        >
          العودة لملف المستخدم
        </Link>
      </div>

      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">جاري تحميل سجل النشاط...</div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-xs text-on-surface-variant">لا توجد حركات مسجلة حالياً لهذا المستخدم.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-2.5 px-3">العملية والإجراء</th>
                  <th className="py-2.5 px-3">الوحدة / الجدول</th>
                  <th className="py-2.5 px-3">عنوان IP</th>
                  <th className="py-2.5 px-3">التوقيت</th>
                  <th className="py-2.5 px-3">الحالة / الخطورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-mono">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-surface-container-low/50">
                    <td className="py-2.5 px-3 font-sans font-bold text-on-surface">{act.action}</td>
                    <td className="py-2.5 px-3 font-sans text-outline">{act.entity_type || "نظام"}</td>
                    <td className="py-2.5 px-3 text-outline">{act.ip_address || "127.0.0.1"}</td>
                    <td className="py-2.5 px-3 text-outline">
                      {new Date(act.created_at).toLocaleString("ar-EG")}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          act.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : act.severity === "WARNING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {act.severity || "INFO"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
