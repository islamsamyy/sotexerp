"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CORE_ROLES } from "@/lib/constants";
import { useERP } from "@/lib/erp-context";
import { supabase, logAuditAction } from "@/lib/supabase";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setActiveRole, showToast, currentUser, roleConfig } = useERP();
  const userId = (params?.id as string) || "user-1";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUser(data);
      } else {
        setUser({
          id: userId,
          code: "EMP-1001",
          name_ar: "م. أحمد صادق",
          email: "ahmed.sadek@sotex.eg",
          phone: "01002345678",
          role: "OWNER_ADMIN",
          department_ar: "الإدارة العليا",
          facility_id: "fac-1",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          status: "ACTIVE",
          last_login: "الآن (نشط)",
        });
      }
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="p-gutter space-y-4 max-w-5xl mx-auto text-right">
        <div className="h-8 w-48 bg-surface-container animate-pulse rounded" />
        <div className="h-44 bg-surface-container-lowest border rounded-xl animate-pulse" />
      </div>
    );
  }

  const roleDef = CORE_ROLES[user.role as keyof typeof CORE_ROLES] || CORE_ROLES.OWNER_ADMIN;

  return (
    <div className="p-gutter space-y-space-md max-w-5xl mx-auto text-right">
      {/* Breadcrumb & Top Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 text-right">
        <div className="flex items-center gap-2 text-xs">
          <Link href="/settings/users" className="text-primary hover:underline">
            المستخدمين
          </Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-semibold">{user.name_ar}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/settings/users/${user.id}/edit`}
            className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>تعديل الصلاحيات</span>
          </Link>
          <button
            onClick={() => setActiveRole(user.role)}
            className="px-3.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>معاينة النظام بهذا الحساب</span>
          </button>
        </div>
      </div>

      {/* User Header Profile Card */}
      <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex flex-col sm:flex-row items-center gap-5 text-right shadow-xs">
        <img
          src={user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
          alt={user.name_ar}
          className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 shadow-sm shrink-0"
        />
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-on-surface">{user.name_ar}</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-primary text-on-primary">
              {roleDef.nameAr}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-100 text-emerald-800 font-bold">
              {user.status === "ACTIVE" ? "نشط ومفعل" : "معلق"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant font-mono">
            <span>
              كود الموظف: <strong>{user.code}</strong>
            </span>
            <span>البريد: {user.email}</span>
            <span>الهاتف: {user.phone}</span>
          </div>
          <p className="text-xs text-on-surface-variant pt-1">{roleDef.descriptionAr}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-1 text-xs">
        {[
          { key: "overview", label: "نظرة عامة والصلاحيات" },
          { key: "scope", label: "نطاق الوصول للبيانات (Data Scope)" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-t-lg transition-colors font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-primary text-primary font-bold bg-surface-container-low"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-4 text-xs shadow-xs">
          <h3 className="font-bold text-sm text-on-surface">صلاحيات الدور الوظيفي وسياسات الـ RLS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-surface-container-low flex justify-between items-center">
              <span>الاطلاع على تكاليف الإنتاج وهامش الربح:</span>
              <span className={`font-bold ${roleDef.canViewCost ? "text-emerald-700" : "text-rose-700"}`}>
                {roleDef.canViewCost ? "مصرح" : "محجوب"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low flex justify-between items-center">
              <span>اعتماد القيود المالية وأوامر الشراء:</span>
              <span className={`font-bold ${roleDef.canApproveFinancial ? "text-emerald-700" : "text-rose-700"}`}>
                {roleDef.canApproveFinancial ? "مصرح" : "محجوب"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low flex justify-between items-center">
              <span>إدارة وتعديل حسابات المستخدمين:</span>
              <span className={`font-bold ${roleDef.canManageUsers ? "text-emerald-700" : "text-rose-700"}`}>
                {roleDef.canManageUsers ? "مصرح" : "محجوب"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low flex justify-between items-center">
              <span>المسار الافتراضي للواجهة:</span>
              <span className="font-mono text-primary font-bold">{roleDef.defaultPath}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "scope" && (
        <div className="p-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest space-y-3 text-xs shadow-xs">
          <h3 className="font-bold text-sm text-on-surface">نطاق الفروع والمستودعات المصرح بالوصول إليها</h3>
          <p className="text-on-surface-variant">
            محدد بمجمع ومصانع سوتكس المركزي - المحلة الكبرى مع كامل سجلات أوامر التصنيع.
          </p>
        </div>
      )}
    </div>
  );
}
