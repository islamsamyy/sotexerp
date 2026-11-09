"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useERP } from "@/lib/erp-context";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  title: string;
  assignee: string;
  department: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  status: "todo" | "in_progress" | "done";
  progress: number;
}

export default function TasksPage() {
  const { currentUser, showToast } = useERP();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [filterDept, setFilterDept] = useState("all");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbErr) throw dbErr;

      setTasks(
        (data || []).map((t) => ({
          id: t.id,
          title: t.title,
          assignee: t.assignee,
          department: t.department,
          priority: t.priority.toLowerCase() as Task["priority"],
          dueDate: t.due_date,
          status:
            t.status === "COMPLETED"
              ? "done"
              : t.status === "IN_PROGRESS"
              ? "in_progress"
              : "todo",
          progress: Number(t.progress),
        }))
      );
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل المهام من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddQuickTask = async () => {
    const id = `TSK-${Math.floor(105 + Math.random() * 890)}`;
    const newTask: Task = {
      id,
      title: "مراجعة جاهزية خامات ومستلزمات خطوط التشغيل",
      assignee: currentUser.nameAr,
      department: "الإنتاج والباترون",
      priority: "high",
      dueDate: "اليوم - 05:00 م",
      status: "todo",
      progress: 0,
    };

    const { error: insertErr } = await supabase.from("tasks").insert({
      id: newTask.id,
      title: newTask.title,
      assignee: newTask.assignee,
      department: newTask.department,
      priority: "HIGH",
      due_date: newTask.dueDate,
      status: "PENDING",
      progress: 0,
      facility_id: "fac-1",
    });

    if (insertErr) {
      showToast("error", "تعذر إضافة المهمة", insertErr.message);
      return;
    }

    setTasks((prev) => [newTask, ...prev]);
    showToast("success", "تمت إضافة المهمة في Supabase", `تم تكليف ${newTask.assignee} بالمهمة #${id}`);
  };

  const filteredTasks = filterDept === "all"
    ? tasks
    : tasks.filter((t) => t.department.includes(filterDept));

  const getPriorityBadge = (p: Task["priority"]) => {
    switch (p) {
      case "high": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error text-on-error">عاجلة</span>;
      case "medium": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">متوسطة</span>;
      case "low": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container">عادية</span>;
    }
  };

  const columns = [
    { key: "todo", title: "قيد الانتظار والتكليف", count: filteredTasks.filter(t => t.status === "todo").length },
    { key: "in_progress", title: "جاري التنفيذ والتشغيل", count: filteredTasks.filter(t => t.status === "in_progress").length },
    { key: "done", title: "مكتملة ومُعتمدة", count: filteredTasks.filter(t => t.status === "done").length },
  ];

  return (
    <div className="p-gutter space-y-space-md">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">assignment</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">المهام التشغيلية وصالات المصنع</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            متابعة المهام اليومية لخطوط الخياطة، المخازن، توكيد الجودة، والحسابات
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-surface-container rounded-lg p-1 border border-outline-variant/40">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                viewMode === "kanban" ? "bg-primary text-on-primary font-bold shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>لوحة كانبان</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                viewMode === "table" ? "bg-primary text-on-primary font-bold shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>عرض الجدول</span>
            </button>
          </div>

          <button
            onClick={handleAddQuickTask}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            <span>مهمة تشغيلية جديدة</span>
          </button>
        </div>
      </div>

      {/* Filter by Department */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {["all", "الإنتاج", "مخازن", "الجودة", "الخزينة"].map((dept) => (
          <button
            key={dept}
            onClick={() => setFilterDept(dept)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterDept === dept
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            {dept === "all" ? "كافة الأقسام" : dept}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-10 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-xs text-on-surface-variant">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل المهام من قاعدة بيانات Supabase...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-error/40 bg-error/10 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchTasks} className="px-3 py-1.5 rounded-lg bg-error text-on-error font-bold">إعادة المحاولة</button>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-surface-container-low/60 rounded-xl p-3 border border-outline-variant/30 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-outline-variant/30 text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-on-surface">{col.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-xs font-mono text-on-surface">
                      {col.count}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 hover:border-primary/50 shadow-xs transition-all space-y-2.5 text-right"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-outline">{task.id}</span>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <h4 className="font-semibold text-xs text-on-surface leading-snug">{task.title}</h4>
                      
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-outline">
                          <span>نسبة الإنجاز</span>
                          <span className="font-mono">{task.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${task.progress === 100 ? 'bg-emerald-600' : 'bg-primary'}`} 
                            style={{ width: `${task.progress}%` }} 
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          <span>{task.assignee}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-outline">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          <span>{task.dueDate}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/30">
              <tr>
                <th className="p-3">كود المهمة</th>
                <th className="p-3">عنوان المهمة</th>
                <th className="p-3">القسم</th>
                <th className="p-3">المسؤول المكلف</th>
                <th className="p-3">الأولوية</th>
                <th className="p-3">الإنجاز</th>
                <th className="p-3">موعد التسليم</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-surface-container/40 transition-colors">
                  <td className="p-3 font-mono text-outline">{task.id}</td>
                  <td className="p-3 font-semibold text-on-surface">{task.title}</td>
                  <td className="p-3 text-on-surface-variant">{task.department}</td>
                  <td className="p-3 text-on-surface">{task.assignee}</td>
                  <td className="p-3">{getPriorityBadge(task.priority)}</td>
                  <td className="p-3 font-mono">{task.progress}%</td>
                  <td className="p-3 font-mono text-outline">{task.dueDate}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      task.status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                      task.status === 'in_progress' ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'done' ? 'مكتملة' : task.status === 'in_progress' ? 'قيد التنفيذ' : 'معلقة'}
                    </span>
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
