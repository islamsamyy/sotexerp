"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase, logAuditAction } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Employee {
  id: string;
  name: string;
  code: string;
  role: string;
  line: string;
  skill: string;
  efficiency: number;
  dailyTarget: number;
  completedToday: number;
  status: "active" | "break" | "absent";
  avatar: string;
}

export default function EmployeesPage() {
  const { openModal, showToast, currentRole, currentUser } = useERP();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: "",
    code: "",
    role: "فني خياطة سنجل وأوفرلوك",
    line: "خط الخياطة A1",
    skill: "درز الياقات والأكمام الحساسة",
    dailyTarget: 400,
  });

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("employees")
        .select("*")
        .order("code");
      if (fetchErr) throw fetchErr;
      if (data) {
        setEmployees(
          data.map((r) => ({
            id: r.id,
            name: r.name,
            code: r.code,
            role: r.role,
            line: r.line,
            skill: r.skill,
            efficiency: Number(r.efficiency || 90),
            dailyTarget: Number(r.daily_target || 400),
            completedToday: Number(r.completed_today || 380),
            status: (r.status?.toLowerCase() === "absent" ? "absent" : "active") as Employee["status"],
            avatar:
              r.avatar ||
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
          }))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل تحميل سجل العمالة");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name) return;
    setIsSubmitting(true);
    const empCode = newEmp.code || `OP-${Math.floor(400 + Math.random() * 599)}`;
    const empId = `emp-${Math.floor(100 + Math.random() * 899)}`;
    try {
      const { error: insertErr } = await supabase.from("employees").insert({
        id: empId,
        code: empCode,
        name: newEmp.name,
        role: newEmp.role,
        line: newEmp.line,
        skill: newEmp.skill,
        efficiency: 95,
        daily_target: Number(newEmp.dailyTarget),
        completed_today: 0,
        status: "ACTIVE",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        check_in_time: "07:00 ص",
        attendance_status: "حاضر بالموعد",
        work_hours: "8 ساعات",
        piece_qty_str: "0 قطعة",
        piece_rate_str: "0.50 ج.م",
        piece_bonus_str: "0 ج.م",
        base_salary_str: "1,200 ج.م",
        net_pay_str: "1,200 ج.م",
      });
      if (insertErr) throw insertErr;
      await logAuditAction({
        userName: currentUser.nameAr,
        roleCode: currentRole,
        action: `تسجيل فني جديد: ${newEmp.name} (${empCode}) على ${newEmp.line}`,
        module: "الموارد البشرية",
        severity: "normal",
      });
      showToast("success", "تم تسجيل الفني", `تمت إضافة ${newEmp.name} بنجاح إلى قاعدة بيانات العمالة.`);
      setShowAddForm(false);
      setNewEmp({
        name: "",
        code: "",
        role: "فني خياطة سنجل وأوفرلوك",
        line: "خط الخياطة A1",
        skill: "درز الياقات والأكمام الحساسة",
        dailyTarget: 400,
      });
      await fetchEmployees();
    } catch (err: unknown) {
      showToast("error", "تعذر تسجيل الفني", err instanceof Error ? err.message : "خطأ في الصلاحيات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered =
    selectedLine === "all" ? employees : employees.filter((e) => e.line.includes(selectedLine));

  return (
    <div className="p-gutter space-y-space-md text-right">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30 bg-surface-container-lowest p-5 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[24px]">group</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              سجل الفنيين والعمالة ومشرفي الصالات
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            إدارة توزيع العمالة على خطوط الخياطة والقص، متابعة مصفوفة المهارات، ومعدل إنجاز كل فني
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ تسجيل فني جديد</span>
          </button>

          <Link
            href="/hr/attendance"
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>حضور وورديات اليوم</span>
          </Link>

          <Link
            href="/hr/payroll"
            className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>مسير حوافز القطعة</span>
          </Link>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddEmployee} className="p-4 rounded-xl border border-primary/30 bg-surface-container-lowest space-y-3 text-right shadow-sm">
          <h3 className="text-xs font-bold text-primary">تسجيل بيانات فني جديد على خطوط الإنتاج</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              required
              placeholder="اسم الفني بالكامل"
              value={newEmp.name}
              onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              placeholder="كود الفني (اختياري، OP-405)"
              value={newEmp.code}
              onChange={(e) => setNewEmp({ ...newEmp, code: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <input
              placeholder="المسمى الوظيفي"
              value={newEmp.role}
              onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <select
              value={newEmp.line}
              onChange={(e) => setNewEmp({ ...newEmp, line: e.target.value })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            >
              <option value="خط الخياطة A1">خط الخياطة A1</option>
              <option value="خط الخياطة B1">خط الخياطة B1</option>
              <option value="صالة القص الرئيسية">صالة القص الرئيسية</option>
              <option value="خط التشطيب والكي">خط التشطيب والكي</option>
            </select>
            <input
              placeholder="المهارة الفنية"
              value={newEmp.skill}
              onChange={(e) => setNewEmp({ ...newEmp, skill: e.target.value })}
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low"
            />
            <input
              type="number"
              placeholder="المستهدف اليومي (قطعة)"
              value={newEmp.dailyTarget}
              onChange={(e) => setNewEmp({ ...newEmp, dailyTarget: Number(e.target.value) })}
              className="px-3 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-low font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
              >
                {isSubmitting ? "جاري الحفظ..." : "حفظ الفني"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-1">
          <span className="text-xs text-on-surface-variant font-medium">إجمالي القوة العاملة المسجلة</span>
          <div className="text-2xl font-bold text-primary">{employees.length} فنياً</div>
          <span className="text-[11px] text-emerald-600 font-semibold">حضور اليوم: 98% في الصالات</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-1">
          <span className="text-xs text-on-surface-variant font-medium">متوسط كفاءة الفرد (Individual Efficiency)</span>
          <div className="text-2xl font-bold text-primary">
            {employees.length > 0
              ? `${(employees.reduce((acc, e) => acc + e.efficiency, 0) / employees.length).toFixed(1)}%`
              : "95%"}
          </div>
          <span className="text-[11px] text-on-surface-variant">مستهدف الوردية: 90%</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-1">
          <span className="text-xs text-on-surface-variant font-medium">الإنتاج بالقطعة المحقق اليوم</span>
          <div className="text-2xl font-bold text-emerald-700">
            {employees.reduce((acc, e) => acc + e.completedToday, 0).toLocaleString()} قطعة
          </div>
          <span className="text-[11px] text-on-surface-variant">عبر خطوط الخياطة والقص</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-1">
          <span className="text-xs text-on-surface-variant font-medium">ساعات عمل إضافية مجدولة</span>
          <div className="text-2xl font-bold text-amber-600">48 ساعة</div>
          <span className="text-[11px] text-on-surface-variant">لإنهاء طلبيات التصدير</span>
        </div>
      </div>

      {isLoading && (
        <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span>جاري تحميل سجل الفنيين والعمالة من قاعدة البيانات...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-error/40 bg-error/5 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchEmployees} className="px-3 py-1 rounded bg-error text-white font-bold">إعادة المحاولة</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
            <h2 className="text-base font-bold text-on-surface">قائمة العمالة ومعدل إنجاز اليوم</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-xs"
              >
                <option value="all">كافة الخطوط والصالات</option>
                <option value="خط الخياطة A1">خط الخياطة A1</option>
                <option value="صالة القص">صالة القص الكبرى</option>
                <option value="التشطيب">خط التشطيب والكي</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
                <tr>
                  <th className="py-2.5 px-3">العامل / الفني</th>
                  <th className="py-2.5 px-3">الكود والخط</th>
                  <th className="py-2.5 px-3">المهارة التخصصية</th>
                  <th className="py-2.5 px-3">الهدف اليومي</th>
                  <th className="py-2.5 px-3">المنجز اليوم</th>
                  <th className="py-2.5 px-3">معدل الكفاءة</th>
                  <th className="py-2.5 px-3 text-center">الحالة</th>
                  <th className="py-2.5 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img src={emp.avatar} alt={emp.name} className="w-9 h-9 rounded-full object-cover border" />
                        <div>
                          <span className="font-bold text-on-surface block">{emp.name}</span>
                          <span className="text-[11px] text-on-surface-variant">{emp.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-primary block">{emp.code}</span>
                      <span className="text-[11px] text-on-surface-variant">{emp.line}</span>
                    </td>
                    <td className="py-3 px-3 text-on-surface font-medium">{emp.skill}</td>
                    <td className="py-3 px-3 font-mono font-semibold">{emp.dailyTarget} قطعة</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">{emp.completedToday} قطعة</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{emp.efficiency}%</span>
                        <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${emp.efficiency}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={emp.status === "active" ? "success" : "warning"}>
                        {emp.status === "active" ? "على خط العمل" : "غياب / استئذان"}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => showToast("info", "عرض بطاقة الأداء", `الفني: ${emp.name}`)}>
                            <span className="material-symbols-outlined text-[16px]">badge</span>
                            <span>بطاقة الفني وسجل التدريب</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openModal({ type: "shift_redirect", title: `نقل الفني ${emp.name} لخط آخر` })}>
                            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                            <span>إعادة تعيين الخط والوردية</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
