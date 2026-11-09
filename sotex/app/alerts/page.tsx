"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface AlertItem {
  id: string;
  title: string;
  category: "materials" | "production" | "quality" | "financial";
  categoryAr: string;
  severity: "urgent" | "warning" | "info";
  time: string;
  description: string;
  location: string;
  actionText: string;
  actionHref: string;
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbErr) throw dbErr;

      setAlerts(
        (data || []).map((a) => ({
          id: a.id,
          title: a.title,
          category:
            a.category === "inventory"
              ? "materials"
              : a.category === "finance"
              ? "financial"
              : (a.category as AlertItem["category"]),
          categoryAr: a.category_ar,
          severity:
            a.severity === "critical"
              ? "urgent"
              : (a.severity as AlertItem["severity"]),
          time: a.time_ar,
          description: a.description,
          location: a.location,
          actionText: a.action_text,
          actionHref: a.action_href,
        }))
      );
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل التنبيهات من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const filtered = filter === "all"
    ? alerts
    : alerts.filter((a) => a.category === filter);

  return (
    <div className="p-gutter space-y-space-md">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-error text-[24px]">warning</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">التنبيهات العاجلة ونواقص المصنع</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            متابعة فورية للأعطال، نقص الخامات، انحرافات الجودة والاعتمادات المعلقة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            className="px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>تحديث التنبيهات</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {[
          { key: "all", label: "كافة التنبيهات", count: alerts.length },
          { key: "materials", label: "نواقص الخامات والأقمشة", count: alerts.filter(a => a.category === "materials").length },
          { key: "production", label: "خطوط الإنتاج والتشغيل", count: alerts.filter(a => a.category === "production").length },
          { key: "quality", label: "انحرافات الجودة AQL", count: alerts.filter(a => a.category === "quality").length },
          { key: "financial", label: "الموافقات والمالية", count: alerts.filter(a => a.category === "financial").length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              filter === tab.key
                ? "bg-primary text-on-primary font-bold shadow-sm"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filter === tab.key ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-10 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-xs text-on-surface-variant">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل التنبيهات من قاعدة بيانات Supabase...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-error/40 bg-error/10 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAlerts} className="px-3 py-1.5 rounded-lg bg-error text-on-error font-bold">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const isUrgent = alert.severity === "urgent";
            const isWarning = alert.severity === "warning";

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border bg-surface-container-lowest transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-right ${
                  isUrgent
                    ? "border-error/40 bg-error/5"
                    : isWarning
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-outline-variant/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isUrgent
                      ? "bg-error text-on-error"
                      : isWarning
                      ? "bg-amber-500 text-white"
                      : "bg-primary text-on-primary"
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {isUrgent ? "error" : isWarning ? "warning" : "info"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-on-surface">{alert.title}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        {alert.categoryAr}
                      </span>
                      <span className="text-[11px] text-outline font-mono">{alert.time}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-outline">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span>{alert.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link
                    href={alert.actionHref}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>{alert.actionText}</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
