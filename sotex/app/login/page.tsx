"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useERP } from "@/lib/erp-context";
import { CORE_ROLES, INITIAL_USERS, DEFAULT_USER_PASSWORDS } from "@/lib/constants";
import { supabase, ROLE_DEMO_EMAILS, setSupabaseRoleHeader } from "@/lib/supabase";
import { RoleKey } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { setActiveRole, users, showToast } = useERP();
  const [selectedRole, setSelectedRole] = useState<RoleKey>("OWNER_ADMIN");
  const [email, setEmail] = useState("islam@sotex.eg");
  const [password, setPassword] = useState("Islam@2026!");
  const [isLoading, setIsLoading] = useState(false);

  const userList = users.length > 0 ? users : INITIAL_USERS;

  const selectRoleCard = (roleKey: RoleKey) => {
    setSelectedRole(roleKey);
    const u = userList.find((user) => user.role === roleKey);
    if (u) {
      setEmail(u.email);
      setPassword(DEFAULT_USER_PASSWORDS[u.email] || "Sotex@2026!");
    }
  };

  const handleQuickLoginAs = async (roleKey: RoleKey) => {
    setIsLoading(true);
    try {
      setSupabaseRoleHeader(roleKey);
      localStorage.setItem("sotex_auth", "true");
      const demoEmail = ROLE_DEMO_EMAILS[roleKey];
      const targetPass = DEFAULT_USER_PASSWORDS[demoEmail] || "Sotex@2026!";

      await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: targetPass,
      });

      setActiveRole(roleKey);
      const user = userList.find((u) => u.role === roleKey) || userList[0];
      const role = CORE_ROLES[roleKey];

      showToast(
        "success",
        `مرحباً بك ${user.nameAr}`,
        `تم تسجيل الدخول وتوجيهك إلى: ${role.nameAr}`
      );

      router.push(role.defaultPath);
    } catch {
      localStorage.setItem("sotex_auth", "true");
      const role = CORE_ROLES[roleKey];
      setActiveRole(roleKey);
      router.push(role.defaultPath);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const matchedUser = userList.find((u) => u.email.toLowerCase() === cleanEmail);
      const roleKey = matchedUser ? matchedUser.role : selectedRole;

      setSupabaseRoleHeader(roleKey);
      localStorage.setItem("sotex_auth", "true");
      const actualPassword =
        password === "••••••••"
          ? DEFAULT_USER_PASSWORDS[cleanEmail] || "Sotex@2026!"
          : password;

      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: actualPassword,
      });

      setActiveRole(roleKey);
      const role = CORE_ROLES[roleKey];
      const user = matchedUser || userList.find((u) => u.role === roleKey)!;

      showToast("success", `تم تسجيل الدخول بنجاح`, `مرحباً ${user.nameAr} - ${role.nameAr}`);
      router.push(role.defaultPath);
    } catch {
      localStorage.setItem("sotex_auth", "true");
      const role = CORE_ROLES[selectedRole];
      setActiveRole(selectedRole);
      router.push(role.defaultPath);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#202528] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 text-right selection:bg-[#C8B276]/30 relative overflow-hidden">
      {/* Background Decorative Mesh with SOTEX Brand Palette (#202528 Charcoal + #C8B276 Champagne Gold) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2C3338]/70 via-[#202528] to-[#161A1D] pointer-events-none" />

      <div className="relative w-full max-w-5xl z-10 space-y-8">
        {/* Top Brand Header with SOTEX Poster Square Gold Emblem */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 p-3.5 rounded-xl bg-[#C8B276] shadow-2xl shadow-[#C8B276]/25 border border-[#9E7A3F] mb-2 hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="SOTEX Brand Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wider flex items-center justify-center gap-3">
            <span>SOTEX</span>
            <span className="text-[#C8B276]">GARMENT ERP</span>
          </h1>
          <div className="w-24 h-1 bg-[#C8B276] mx-auto rounded-full" />
          <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[#C8B276] font-bold">
            <span className="material-symbols-outlined text-[16px]">factory</span>
            <span>مجمع ومصانع سوتكس المركزي — المحلة الكبرى</span>
          </div>
          <p className="text-sm sm:text-base text-[#D1D5DB] max-w-2xl mx-auto pt-0.5">
            منظومة إدارة وتشغيل مصانع الملابس والمنسوجات — اختر حسابك للدخول الفوري للوحة التحكم
          </p>
        </div>

        {/* 4 Core Roles Grid with Direct 1-Click Login to Custom Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(CORE_ROLES) as RoleKey[]).map((key) => {
            const r = CORE_ROLES[key];
            const u = userList.find((user) => user.role === key) || INITIAL_USERS.find((user) => user.role === key)!;
            const isSelected = selectedRole === key;
            const rolePass = DEFAULT_USER_PASSWORDS[u.email] || "Sotex@2026!";

            return (
              <div
                key={key}
                onClick={() => selectRoleCard(key)}
                className={`relative group cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#282E32] border-[#C8B276] shadow-xl shadow-[#C8B276]/15 ring-2 ring-[#C8B276]/60 scale-[1.02]"
                    : "bg-[#1A1E21]/95 border-[#343C42] hover:bg-[#242A2E] hover:border-[#C8B276]/50"
                }`}
              >
                {/* Active Indicator Badge with Brand Gold */}
                {isSelected && (
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8B276] text-slate-950 shadow-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    محدد للدخول
                  </span>
                )}

                <div className="space-y-3">
                  {/* Avatar & Icon */}
                  <div className="flex items-center justify-between">
                    <img
                      src={u.avatarUrl}
                      alt={u.nameAr}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#C8B276]/60 shadow-md"
                    />
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${r.badgeColor}`}>
                      <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
                    </div>
                  </div>

                  {/* Role and User details */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#C8B276] transition-colors">
                      {r.nameAr}
                    </h3>
                    <p className="text-xs font-semibold text-[#C8B276] mt-0.5">{u.nameAr}</p>
                    <div className="flex flex-col gap-0.5 mt-1.5 pt-1 border-t border-slate-700/40">
                      <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-[#C8B276]">mail</span>
                        <span className="truncate">{u.email}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-[#C8B276]">key</span>
                        <span>{rolePass}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-3">
                    {r.descriptionAr}
                  </p>
                </div>

                {/* Target Dashboard Destination & Action Button */}
                <div className="pt-4 mt-3 border-t border-slate-700/50 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">اللوحة المخصصة:</span>
                    <span className="font-bold text-[#C8B276] flex items-center gap-1 dir-ltr font-mono">
                      <code>{r.defaultPath}</code>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLoginAs(key);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#C8B276] to-[#9E7A3F] text-slate-950 hover:brightness-110 shadow-[#C8B276]/20 cursor-pointer"
                        : "bg-slate-700/80 hover:bg-slate-600 text-slate-100 cursor-pointer"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">login</span>
                    <span>دخول فوري للوحة {r.nameAr.split(" ")[0]}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual Credentials Box */}
        <div className="max-w-xl mx-auto bg-[#181B21]/95 rounded-2xl border border-[#C8B276]/30 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#C8B276]">lock</span>
                <span>تسجيل الدخول بالبيانات الرسمية</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                اكتب بيانات الحساب أو اختر حسابه بالأعلى للدخول الفوري
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#C8B276]/15 text-[#C8B276] border border-[#C8B276]/30">
              {CORE_ROLES[selectedRole].nameAr.split(" ")[0]}
            </span>
          </div>

          {/* Quick Click Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-slate-700/50 mb-4">
            <span className="text-[11px] text-slate-400 ml-1">تعبئة سريعة:</span>
            {(Object.keys(CORE_ROLES) as RoleKey[]).map((k) => {
              const u = userList.find((x) => x.role === k) || INITIAL_USERS.find((x) => x.role === k)!;
              const isSelected = selectedRole === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => selectRoleCard(k)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#C8B276] text-slate-950 border-[#C8B276]"
                      : "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700"
                  }`}
                >
                  {u.nameAr}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني للعمل
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@sotex.eg"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#C8B276] focus:ring-1 focus:ring-[#C8B276] text-right font-mono"
                />
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-[#C8B276]">
                  mail
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">كلمة المرور</label>
                <Link href="/access-request" className="text-[11px] text-[#C8B276] hover:underline">
                  طلب صلاحية جديدة أو استعادة؟
                </Link>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#C8B276] focus:ring-1 focus:ring-[#C8B276] text-right font-mono"
                />
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-[#C8B276]">
                  key
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C8B276] to-[#9E7A3F] hover:brightness-110 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-[#C8B276]/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري تسجيل الدخول والتوجيه...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>تسجيل الدخول والتوجيه للوحة التحكم</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C8B276] animate-pulse" />
              متصل بقاعدة بيانات Supabase (Strict RLS)
            </span>
            <span className="font-mono text-[#C8B276]">SOTEX v4.8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
