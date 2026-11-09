"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

interface AccessRequestRecord {
  id: string;
  requester_name: string;
  role_key: string;
  module: string;
  duration: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AccessRequestPage() {
  const router = useRouter();
  const { roleConfig, currentUser, activeRole, showToast } = useERP();
  const [module, setModule] = useState("المالية والتكاليف");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("temporary");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRequests(data);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const id = `REQ-${Math.floor(100 + Math.random() * 900)}`;
      const durationLabel =
        duration === "temporary"
          ? "مؤقتة (24 ساعة / لمهمة محددة)"
          : "دائمة (تعديل دائم بالدور)";

      const { error } = await supabase.from("access_requests").insert({
        id,
        user_id: currentUser.id,
        requester_name: currentUser.nameAr,
        role_key: activeRole,
        module,
        duration: durationLabel,
        reason,
        status: "PENDING",
      });

      if (error) throw error;

      await logAuditAction({
        actor: currentUser.nameAr,
        actorRole: roleConfig.nameAr,
        action: "رفع طلب صلاحية استثنائية",
        module: "الأمان والحوكمة",
        recordRef: id,
        newVal: `${module} (${durationLabel})`,
        severity: "WARNING",
      });

      showToast(
        "success",
        "تم تسجيل طلب الصلاحية في Supabase",
        "تم رفع الطلب لمدير النظام ومالك المصنع في مركز الموافقات!"
      );
      router.push("/approvals");
    } catch (err: any) {
      showToast("error", "تعذر إرسال الطلب", err?.message || "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-gutter max-w-2xl mx-auto space-y-space-md text-right">
      <div className="pb-3 border-b border-outline-variant/30">
        <h1 className="font-headline-md text-2xl font-bold text-on-surface">طلب صلاحية إضافية أو مؤقتة</h1>
        <p className="font-body-sm text-sm text-on-surface-variant">رفع طلب رسمي لمدير النظام لاعتماد الوصول لشاشة أو مخزن محدد</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-4 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">دورك الحالي</label>
          <input
            type="text"
            disabled
            value={roleConfig.nameAr}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container text-xs text-right font-bold text-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">الوحدة أو الشاشة المطلوب صلاحيتها</label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none"
          >
            <option value="المالية والتكاليف">المالية والقيود والتكاليف</option>
            <option value="أرصدة الأقمشة والخامات">أرصدة الأقمشة ومخازن التوريد</option>
            <option value="عروض الأسعار والتصدير">عروض الأسعار والتوكيلات الخارجية</option>
            <option value="محرر شجرة المواد BOM">محرر شجرة المواد BOM</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">مدة الصلاحية المطلوبة</label>
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="dur"
                value="temporary"
                checked={duration === "temporary"}
                onChange={() => setDuration("temporary")}
                className="accent-primary"
              />
              <span>مؤقتة (24 ساعة / لمهمة محددة)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="dur"
                value="permanent"
                checked={duration === "permanent"}
                onChange={() => setDuration("permanent")}
                className="accent-primary"
              />
              <span>دائمة (تعديل دائم بالدور)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">مبرر وأسباب العمل *</label>
          <textarea
            required
            rows={3}
            placeholder="اشرح حاجة العمل لطلب الصلاحية والمهمة المرتبطة بها..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <span>إرسال الطلب للاعتماد</span>
            )}
          </button>
        </div>
      </form>

      {/* Previous Access Requests from Supabase */}
      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-on-surface">سجل طلبات الصلاحيات السابقة</h3>
        {loadingList ? (
          <div className="py-6 text-center text-xs text-outline">جاري تحميل سجل الطلبات من قاعدة البيانات...</div>
        ) : requests.length === 0 ? (
          <div className="py-6 text-center text-xs text-outline">لا توجد طلبات سابقة</div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[11px] text-outline ml-2">{r.id}</span>
                  <span className="font-bold text-on-surface">{r.module}</span>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">{r.reason}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  r.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {r.status === "APPROVED" ? "معتمد" : "قيد المراجعة"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
