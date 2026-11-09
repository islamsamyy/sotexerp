import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { RoleKey } from "./types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qxyyfaeggspoalbogpfu.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eXlmYWVnZ3Nwb2FsYm9ncGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxOTIyMjMsImV4cCI6MjEwOTc2ODIyM30.x_ATQwR_4YiUzmoMCRkdyn2UpiXIv3WCXMX_KHkHq4s";

// Track active role header so PostgreSQL RLS policies (`public.get_current_user_role()`)
// evaluate strict role-based permissions on every SELECT / INSERT / UPDATE / DELETE.
let currentActiveRoleHeader: RoleKey = "OWNER_ADMIN";

export function setSupabaseRoleHeader(role: RoleKey) {
  currentActiveRoleHeader = role;
  if (typeof window !== "undefined") {
    localStorage.setItem("sotex_active_role", role);
  }
}

export function getSupabaseRoleHeader(): RoleKey {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("sotex_active_role") as RoleKey | null;
    if (saved) {
      currentActiveRoleHeader = saved;
    }
  }
  return currentActiveRoleHeader;
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options = {}) => {
      const headers = new Headers(options.headers);
      headers.set("x-sotex-role", getSupabaseRoleHeader());
      return fetch(url, {
        ...options,
        headers,
      });
    },
  },
});

export const ROLE_DEMO_EMAILS: Record<RoleKey, string> = {
  OWNER_ADMIN: "islam@sotex.eg",
  PRODUCTION_MANAGER: "mohamed.elsayed@sotex.eg",
  WAREHOUSE_MANAGER: "mostafa.abdelaziz@sotex.eg",
  FINANCE_SALES_MANAGER: "hussein@sotex.eg",
};

/**
 * Helper to append an immutable record to `public.audit_logs` in Supabase.
 */
export async function logAuditAction(params: {
  actor?: string;
  actorRole?: string;
  userName?: string;
  userRole?: string;
  roleCode?: string;
  action: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  recordRef?: string;
  oldVal?: string;
  newVal?: string;
  severity?: "INFO" | "WARNING" | "CRITICAL" | "normal" | "warning" | "critical" | string;
}) {
  try {
    const id = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;
    const user = params.actor || params.userName || "مستخدم النظام";
    const role = params.actorRole || params.userRole || params.roleCode || "OWNER_ADMIN";
    const mod = params.module || params.entityType || "النظام";
    const rawSev = (params.severity || "INFO").toUpperCase();
    const normSev = rawSev === "CRITICAL" ? "CRITICAL" : rawSev === "WARNING" ? "WARNING" : "INFO";

    await supabase.from("audit_logs").insert({
      id,
      actor: user,
      actor_role: role,
      action: params.action,
      module: mod,
      record_ref: params.recordRef || params.entityId || params.entityName || params.action,
      timestamp_ar: "الآن",
      ip: "192.168.1.10",
      old_val: params.oldVal || "-",
      new_val: params.newVal || (params.details ? JSON.stringify(params.details) : "-"),
      severity: normSev,
    });
  } catch (err) {
    console.warn("Audit log insert warning:", err);
  }
}
