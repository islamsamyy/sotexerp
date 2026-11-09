"use client";

import React, { useState } from "react";
import { useERP } from "@/lib/erp-context";

export default function ApprovalsPage() {
  const { approvals, handleApproval, roleConfig } = useERP();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = approvals.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          تم الاعتماد
        </span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">cancel</span>
          مرفوض
        </span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
          بانتظار الاعتماد
        </span>;
    }
  };

  return (
    <div className="p-gutter space-y-space-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">rule</span>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface">مركز الموافقات والاعتمادات الإدارية والمالية</h1>
          </div>
          <p className="font-body-sm text-sm text-on-surface-variant">
            سجل طلبات الاعتماد لأذون الصرف، أوامر الشراء، خصومات الأسعار، والتسويات الجردية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">
            صلاحيتك الحالية: <strong className="text-primary">{roleConfig.nameAr}</strong>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-on-surface ml-1">نوع الطلب:</span>
          {[
            { key: "all", label: "كافة الطلبات" },
            { key: "stock_issue", label: "أذون صرف خامات" },
            { key: "purchase_order", label: "أوامر شراء خامات" },
            { key: "discount", label: "خصومات مبيعات" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === t.key ? "bg-primary text-on-primary font-bold shadow-xs" : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-on-surface">الحالة:</span>
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s ? "bg-secondary text-on-secondary font-bold" : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              {s === "all" ? "الكل" : s === "pending" ? "معلق" : s === "approved" ? "معتمد" : "مرفوض"}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant/30">
            لا توجد طلبات اعتماد مطابقة للفلاتر المحددة
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-right shadow-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-on-surface">{item.title}</span>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    <span>مقدم الطلب: <strong className="text-on-surface">{item.requester}</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">apartment</span>
                    <span>القسم: {item.department}</span>
                  </span>
                  {item.amount && (
                    <span className="flex items-center gap-1 font-mono text-primary font-bold">
                      <span className="material-symbols-outlined text-[14px]">payments</span>
                      <span>القيمة: {item.amount}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-outline font-mono">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>{item.date}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {item.status === "pending" ? (
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleApproval(item.id, "approved")}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>اعتماد الطلب</span>
                  </button>
                  <button
                    onClick={() => handleApproval(item.id, "rejected")}
                    className="px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    <span>رفض مع ذكر السبب</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-outline font-mono self-end md:self-center">
                  تم اتخاذ القرار
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

