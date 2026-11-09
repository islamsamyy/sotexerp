"use client";

import React, { useEffect } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-emerald-900 border-emerald-700 text-white",
          icon: "check_circle",
          iconColor: "text-emerald-400",
        };
      case "error":
        return {
          bg: "bg-rose-950 border-rose-800 text-white",
          icon: "cancel",
          iconColor: "text-rose-400",
        };
      case "warning":
        return {
          bg: "bg-amber-950 border-amber-800 text-white",
          icon: "warning",
          iconColor: "text-amber-400",
        };
      default:
        return {
          bg: "bg-surface-container-high border-outline-variant text-on-surface",
          icon: "info",
          iconColor: "text-primary",
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 text-right ${style.bg}`}
    >
      <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${style.iconColor}`}>
        {style.icon}
      </span>
      <div className="flex-1 space-y-0.5">
        <h5 className="font-semibold text-xs">{toast.title}</h5>
        {toast.message && <p className="text-[11px] opacity-80 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/60 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

