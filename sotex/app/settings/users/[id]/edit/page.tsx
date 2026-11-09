"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { CORE_ROLES } from "@/lib/constants";
import { RoleKey } from "@/lib/types";
import { supabase, logAuditAction } from "@/lib/supabase";

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast, currentUser, roleConfig } = useERP();
  const id = (params?.id as string) || "user-1";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleKey>("PRODUCTION_MANAGER");
  const [status, setStatus] = useState("ACTIVE");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setName(data.name_ar || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setRole((data.role as RoleKey) || "PRODUCTION_MANAGER");
        setStatus(data.status || "ACTIVE");
      } else {
        setName("م. إسلام");
        setEmail("islam@sotex.eg");
        setPhone("01002345678");
        setRole("OWNER_ADMIN");
        setStatus("ACTIVE");
      }
    } catch (err: any) {
      console.error("Failed to load user for editing:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          name_ar: name,
          email,
          phone,
          role,
          status,
        })
        .eq("id", id);

      if (error) throw error;

      await logAuditAction({
        userName: currentUser.nameAr,
        userRole: roleConfig.nameAr,
        action: "تعديل بيانات وحساب مستخدم",
        entityType: "user_profiles",
        entityId: id,
        entityName: name,
        details: { newRole: role, newStatus: status },
        severity: "WARNING",
      });

      showToast("success", "تم تحديث بيانات المستخدم في Supabase", `تم حفظ التعديلات للمستخدم: ${name}`);
      setTimeout(() => {
        router.push(`/settings/users/${id}`);
      }, 400);
    } catch (err: any) {
      showToast("error", "فشل تحديث المستخدم", err?.message || "خطأ أثناء الحفظ في قاعدة البيانات");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-gutter space-y-4 max-w-4xl mx-auto text-right">
        <div className="h-8 w-48 bg-surface-container animate-pulse rounded" />
        <div className="h-64 bg-surface-container-lowest border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-gutter space-y-space-md text-right max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              تعديل بيانات وصلاحيات المستخدم: {name}
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            تحديث الدور الوظيفي، بيانات التواصل، وحالة تنشيط الحساب في Supabase
          </p>
        </div>

        <Link
          href={`/settings/users/${id}`}
          className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface self-start md:self-auto"
        >
          إلغاء والعودة للملف
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">الاسم الكامل بالعربية *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">البريد الإلكتروني للعمل *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">رقم الهاتف *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">الدور الوظيفي وصلاحيات الـ RLS</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleKey)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs"
            >
              {Object.entries(CORE_ROLES).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.nameAr} ({def.categoryAr})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">حالة الحساب</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs"
            >
              <option value="ACTIVE">نشط ومفعل (Active)</option>
              <option value="SUSPENDED">معلق وموقوف (Suspended)</option>
              <option value="PENDING">بانتظار التأكيد (Pending)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
          <Link
            href={`/settings/users/${id}`}
            className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-secondary to-[#1E232B] text-white border border-brand-gold/40 hover:border-brand-gold text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>حفظ التعديلات في Supabase</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
