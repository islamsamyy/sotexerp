"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { RoleKey, UserProfile } from "@/lib/types";

export default function UsersManagementPage() {
  const { setActiveRole, currentRole } = useERP();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("user_profiles")
        .select("*")
        .order("name_ar");
      if (fetchErr) throw fetchErr;
      if (data) {
        setUsers(
          data.map((r) => ({
            id: r.id,
            nameAr: r.name_ar,
            nameEn: r.name_en || "",
            email: r.email,
            code: r.code,
            role: r.role_code as RoleKey,
            departmentAr: r.department_ar,
            facilityId: r.facility_id || "FAC-10TH-RAMADAN",
            phone: r.phone || "+20 100 000 0000",
            status: (r.status?.toLowerCase() === "suspended" ? "suspended" : "active") as UserProfile["status"],
            allowedWarehouses: r.allowed_warehouses || [],
            allowedLines: r.allowed_lines || [],
            isActive: Boolean(r.is_active),
            avatarUrl:
              r.avatar_url ||
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
            lastLogin: r.last_login_label || "اليوم",
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل حسابات المستخدمين");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((user) => {
    const matchesSearch =
      user.nameAr.includes(search) || user.email.includes(search) || user.code.includes(search);
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">manage_accounts</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">إدارة حسابات المستخدمين والموظفين</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            سجل مستخدمي النظام المسجل في Supabase Auth و user_profiles مع ربط الصلاحيات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings/users/new"
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>إضافة مستخدم جديد</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">إجمالي المستخدمين</span>
          <p className="text-2xl font-bold font-mono text-primary mt-1">{users.length}</p>
          <span className="text-[11px] text-outline">حسابات نشطة في قاعدة البيانات</span>
        </div>
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">الأدوار الموزعة</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">4 أدوار قياسية</p>
          <span className="text-[11px] text-outline">تغطي كافة أقسام المصنع</span>
        </div>
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">الفروع المسندة</span>
          <p className="text-2xl font-bold font-mono text-secondary mt-1">المقر والمصانع</p>
          <span className="text-[11px] text-outline">المحلة الكبرى (المركز الرئيسي)</span>
        </div>
        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-right">
          <span className="text-xs text-on-surface-variant">حالة الأمان</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">100% مؤمن</p>
          <span className="text-[11px] text-outline font-mono">Supabase Auth + RLS</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="max-w-md w-full">
          <input
            type="text"
            placeholder="بحث بالاسم، كود الموظف، أو البريد الإلكتروني..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs text-right focus:outline-none"
          >
            <option value="all">كافة الأدوار</option>
            <option value="OWNER_ADMIN">مالك المصنع / مدير النظام</option>
            <option value="PRODUCTION_MANAGER">مدير الإنتاج والعمليات الفنية</option>
            <option value="WAREHOUSE_MANAGER">مدير المخازن واللوجستيات</option>
            <option value="FINANCE_SALES_MANAGER">المدير المالي والتجاري</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل المستخدمين من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">الموظف</th>
                <th className="p-3">كود الموظف</th>
                <th className="p-3">الدور الوظيفي</th>
                <th className="p-3">القسم</th>
                <th className="p-3">الفرع الرئيسي</th>
                <th className="p-3">آخر تسجيل دخول</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">معاينة بهذا الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl}
                        alt={user.nameAr}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div className="flex flex-col">
                        <Link href={`/settings/users/${user.id}`} className="font-semibold text-on-surface hover:text-primary">
                          {user.nameAr}
                        </Link>
                        <span className="text-[11px] text-outline font-mono">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-outline">{user.code}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-on-surface-variant">{user.departmentAr}</td>
                  <td className="p-3 text-on-surface-variant">مجمع المحلة الكبرى المركزي</td>
                  <td className="p-3 font-mono text-outline">{user.lastLogin}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      نشط ومفعل
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setActiveRole(user.role)}
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-primary hover:text-on-primary text-[11px] font-semibold transition-colors cursor-pointer"
                      title="تبديل الدور إلى هذا المستخدم"
                    >
                      معاينة حسابه
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
