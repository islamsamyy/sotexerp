"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CommandPalette from "@/components/CommandPalette";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has an active session flag in localStorage
    const authFlag = localStorage.getItem("sotex_auth");
    const hasRole = localStorage.getItem("sotex_active_role");

    if (authFlag === "true" || (authFlag !== "false" && hasRole)) {
      setIsAuthenticated(true);
      // Auto-set sotex_auth if role was already present
      if (authFlag !== "true") {
        localStorage.setItem("sotex_auth", "true");
      }
    } else {
      setIsAuthenticated(false);
      if (pathname !== "/login") {
        router.replace("/login");
      }
    }
  }, [pathname, router]);

  // If on login page, render full screen without ERP sidebar or header
  if (pathname === "/login") {
    return <main className="min-h-screen bg-[#202528]">{children}</main>;
  }

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#202528] flex flex-col items-center justify-center text-center p-6 text-white">
        <div className="w-16 h-16 rounded-2xl bg-[#C8B276] p-3 shadow-2xl shadow-[#C8B276]/30 border border-[#9E7A3F] mb-4 flex items-center justify-center animate-bounce">
          <img src="/logo.png" alt="SOTEX" className="w-full h-full object-contain brightness-0 invert" />
        </div>
        <h2 className="text-xl font-extrabold text-[#C8B276] tracking-wide">SOTEX GARMENT ERP</h2>
        <p className="text-xs text-[#A3ACB2] mt-1">مجمع ومصانع سوتكس المركزي — المحلة الكبرى</p>
        <div className="flex items-center gap-2 mt-4 text-xs text-[#D1D5DB]">
          <span className="w-4 h-4 border-2 border-[#C8B276] border-t-transparent rounded-full animate-spin" />
          <span>جاري التحقق من هوية تسجيل الدخول...</span>
        </div>
      </div>
    );
  }

  // If not authenticated and not on login, redirect is handled by useEffect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#202528] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C8B276] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated ERP Shell (Sidebar + Clean Single Top Header + Main Content)
  return (
    <>
      <Sidebar />
      <div className="pr-72 min-h-screen flex flex-col bg-surface transition-colors duration-200">
        <Header />
        <main className="flex-1 pb-16">
          {children}
        </main>
      </div>
      <CommandPalette />
    </>
  );
}
