"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useERP } from "@/lib/erp-context";

interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "delivery" | "production" | "shift" | "maintenance";
  facility: string;
  status: "upcoming" | "completed" | "delayed";
}

export default function CalendarPage() {
  const { activeFacility, showToast } = useERP();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("calendar_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (dbErr) throw dbErr;

      setEvents(
        (data || []).map((e) => ({
          id: e.id,
          title: e.title,
          date: e.event_date,
          time: e.time_ar,
          type:
            e.type === "DELIVERY"
              ? "delivery"
              : e.type === "MAINTENANCE"
              ? "maintenance"
              : e.type === "QUALITY" || e.type === "FINANCE"
              ? "shift"
              : "production",
          facility: e.facility,
          status:
            e.status === "COMPLETED"
              ? "completed"
              : "upcoming",
        }))
      );
    } catch (err: any) {
      setError(err?.message || "تعذر تحميل التقويم من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEvent = async () => {
    const id = `EVT-${Math.floor(10 + Math.random() * 89)}`;
    const newEvt = {
      id,
      title: "موعد فحص وتجهيز شحنة ملابس جاهزة للتصدير",
      event_date: "2026-11-22",
      time_ar: "10:30 ص",
      type: "DELIVERY",
      facility: activeFacility.nameAr,
      facility_id: activeFacility.id,
      status: "UPCOMING",
    };

    const { error: insertErr } = await supabase.from("calendar_events").insert(newEvt);
    if (insertErr) {
      showToast("error", "تعذر إضافة الموعد", insertErr.message);
      return;
    }

    showToast("success", "تمت إضافة الموعد في Supabase", `تمت جدولة: ${newEvt.title}`);
    fetchEvents();
  };

  const filtered = selectedFilter === "all"
    ? events
    : events.filter((e) => e.type === selectedFilter);

  const getTypeBadge = (type: ScheduleEvent["type"]) => {
    switch (type) {
      case "delivery":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">شحن وتسليم</span>;
      case "production":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#262B34]/15 text-[#262B34] border border-[#262B34]/30">إنتاج وتشغيل</span>;
      case "shift":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">فحص واستحقاقات</span>;
      case "maintenance":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">صيانة ماكينات</span>;
    }
  };

  return (
    <div className="p-gutter space-y-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">calendar_month</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">تقويم الوردية والتسليم والتشغيل</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            مواعيد تسليم طلبيات التصدير، جداول الورديات، ومواعيد تشغيل أوامر التصنيع
          </p>
        </div>

        <button
          onClick={handleAddEvent}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>إضافة موعد أو وردية</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "كافة المواعيد" },
          { key: "delivery", label: "مواعيد الشحن والتسليم" },
          { key: "production", label: "أوامر الإنتاج" },
          { key: "shift", label: "الورديات والفحص" },
          { key: "maintenance", label: "صيانة الماكينات" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFilter === tab.key
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Timeline / List */}
      {loading ? (
        <div className="p-10 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center gap-3 text-xs text-on-surface-variant">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل جدول المواعيد من قاعدة بيانات Supabase...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-error/40 bg-error/10 text-error text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchEvents} className="px-3 py-1.5 rounded-lg bg-error text-on-error font-bold">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50 transition-all text-right space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-outline">{evt.id}</span>
                {getTypeBadge(evt.type)}
              </div>
              <h3 className="font-semibold text-sm text-on-surface">{evt.title}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
                <span className="flex items-center gap-1 font-mono text-primary font-bold">
                  <span className="material-symbols-outlined text-[14px]">event</span>
                  <span>{evt.date}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-outline">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>{evt.time}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span>{evt.facility}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
