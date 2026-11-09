"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  RoleKey,
  RoleDefinition,
  Facility,
  UserProfile,
  NotificationItem,
  ApprovalItem,
  ActiveModalState,
} from "./types";
import { CORE_ROLES, FACILITIES, INITIAL_USERS } from "./constants";
import { supabase, setSupabaseRoleHeader, logAuditAction } from "./supabase";
import ToastContainer, { ToastMessage } from "@/components/Toast";
import { ActionModal } from "@/components/ui/action-modal";

export interface WorkOrderItem {
  code: string;
  id?: string;
  productNameAr: string;
  productName?: string;
  customerAr: string;
  targetQty: number;
  completedQty: number;
  lineId: string;
  lineNameAr: string;
  line?: string;
  sku?: string;
  stage?: string;
  facility?: string;
  status: "cutting" | "sewing" | "finishing" | "completed" | "delayed";
  dueDate: string;
  efficiency: number;
}

export interface StockMovementItem {
  id?: string;
  type: "issue" | "receipt" | "return";
  materialNameAr: string;
  qty: number;
  unit: string;
  warehouse: string;
  batchNo: string;
  referenceNo: string;
  date: string;
}

export interface StockTransferItem {
  code: string;
  fromFacility: string;
  toFacility: string;
  itemsCount: number;
  driverName: string;
  status: "in_transit" | "received" | "pending";
  date: string;
}

export interface JournalEntryItem {
  code: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  costCenter: string;
  narration: string;
  date: string;
}

export interface InspectionRecordItem {
  id?: string;
  workOrder: string;
  stage: string;
  sampleSize: number;
  defectsFound: number;
  aqlStatus: "passed" | "rejected";
  inspector: string;
}

interface ERPContextType {
  activeRole: RoleKey;
  currentRole: RoleKey;
  roleConfig: RoleDefinition;
  setActiveRole: (role: RoleKey) => void;
  currentUser: UserProfile;
  users: UserProfile[];
  facilities: Facility[];
  activeFacility: Facility;
  setActiveFacility: (facility: Facility) => void;
  getRoleDefaultPath: (role?: RoleKey) => string;

  // Loading & Error states from Supabase
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;

  // Modals & Drawers
  activeModal: ActiveModalState | null;
  openModal: (modal: ActiveModalState) => void;
  closeModal: () => void;

  // Real-time data lists backed by Supabase
  workOrders: WorkOrderItem[];
  addWorkOrder: (order: WorkOrderItem) => Promise<void>;
  stockMovements: StockMovementItem[];
  addStockMovement: (mov: StockMovementItem) => Promise<void>;
  stockTransfers: StockTransferItem[];
  addStockTransfer: (trans: StockTransferItem) => Promise<void>;
  journalEntries: JournalEntryItem[];
  addJournalEntry: (entry: JournalEntryItem) => Promise<void>;
  inspectionRecords: InspectionRecordItem[];
  addInspectionRecord: (rec: InspectionRecordItem) => Promise<void>;

  // Notifications & Approvals backed by Supabase
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => Promise<void>;
  unreadNotificationsCount: number;
  approvals: ApprovalItem[];
  handleApproval: (id: string, decision: "approved" | "rejected") => Promise<void>;
  pendingApprovalsCount: number;

  // App navigation, Theme & Security
  theme: "dark" | "light";
  toggleTheme: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  canViewCost: boolean;
  canAccessRoute: (route: string) => boolean;
  showToast: (type: "success" | "error" | "info" | "warning", title: string, message?: string) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

function mapDbWorkOrderStatus(status: string): WorkOrderItem["status"] {
  const s = status.toUpperCase();
  if (s === "CUTTING") return "cutting";
  if (s === "SEWING" || s === "DELAYED") return "sewing";
  if (s === "COMPLETED" || s === "READY") return "completed";
  return "finishing";
}

function mapDbMovementType(type: string): StockMovementItem["type"] {
  const t = type.toUpperCase();
  if (t === "INBOUND" || t === "FINISHED_RECEIPT") return "receipt";
  if (t === "RETURN") return "return";
  return "issue";
}

function mapDbTransferStatus(status: string): StockTransferItem["status"] {
  const s = status.toUpperCase();
  if (s === "DELIVERED") return "received";
  if (s === "PENDING_DISPATCH") return "pending";
  return "in_transit";
}

function mapDbApprovalType(type: string): ApprovalItem["type"] {
  const t = type.toUpperCase();
  if (t === "PO") return "purchase_order";
  if (t === "DISCOUNT") return "discount";
  if (t === "PAYROLL") return "leave";
  return "stock_issue";
}

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeRole, setActiveRoleState] = useState<RoleKey>("OWNER_ADMIN");
  const [rolesMap, setRolesMap] = useState<Record<RoleKey, RoleDefinition>>(CORE_ROLES);
  const [facilities, setFacilities] = useState<Facility[]>(FACILITIES);
  const [activeFacility, setActiveFacilityState] = useState<Facility>(FACILITIES[0]);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementItem[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransferItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryItem[]>([]);
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecordItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeModal, setActiveModal] = useState<ActiveModalState | null>(null);

  const showToast = useCallback(
    (type: "success" | "error" | "info" | "warning", title: string, message?: string) => {
      const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5);
      setToasts((prev) => [...prev, { id, type, title, message }]);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const saved = localStorage.getItem("sotex_theme") as "dark" | "light" | null;
    const initial = saved || "dark";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");

    const savedRole = localStorage.getItem("sotex_active_role") as RoleKey | null;
    if (savedRole && CORE_ROLES[savedRole]) {
      setActiveRoleState(savedRole);
      setSupabaseRoleHeader(savedRole);
    } else {
      setSupabaseRoleHeader("OWNER_ADMIN");
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        rolesRes,
        facRes,
        usersRes,
        notifRes,
        appRes,
        woRes,
        movRes,
        trfRes,
        jvRes,
        insRes,
      ] = await Promise.all([
        supabase.from("roles").select("*"),
        supabase.from("facilities").select("*").order("id"),
        supabase.from("user_profiles").select("*").order("id"),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
        supabase.from("approvals").select("*").order("created_at", { ascending: false }),
        supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("stock_movements").select("*").order("created_at", { ascending: false }),
        supabase.from("stock_transfers").select("*").order("created_at", { ascending: false }),
        supabase.from("journal_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("quality_inspections").select("*").order("created_at", { ascending: false }),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (facRes.error) throw facRes.error;
      if (usersRes.error) throw usersRes.error;

      if (rolesRes.data && rolesRes.data.length > 0) {
        const nextRoles = { ...CORE_ROLES };
        for (const r of rolesRes.data) {
          const rk = r.key as RoleKey;
          if (nextRoles[rk]) {
            nextRoles[rk] = {
              ...nextRoles[rk],
              nameAr: r.name_ar,
              nameEn: r.name_en,
              categoryAr: r.category_ar,
              descriptionAr: r.description_ar,
              defaultPath: r.default_path,
              canViewCost: r.can_view_cost,
              canViewMargins: r.can_view_margins,
              canApproveFinancial: r.can_approve_financial,
              canManageUsers: r.can_manage_users,
              allowedNavPrefixes: r.allowed_nav_prefixes || nextRoles[rk].allowedNavPrefixes,
            };
          }
        }
        setRolesMap(nextRoles);
      }

      if (facRes.data && facRes.data.length > 0) {
        const activeOnly = facRes.data.filter((f) => f.id === "fac-1" || (f.status === "ACTIVE" && f.city?.includes("المحلة")));
        const listToUse = activeOnly.length > 0 ? activeOnly : facRes.data.filter((f) => f.id === "fac-1");
        const mappedFacilities: Facility[] = (listToUse.length > 0 ? listToUse : facRes.data).map((f) => ({
          id: f.id,
          code: f.code,
          nameAr: f.name_ar,
          type:
            f.type === "FACTORY"
              ? "factory"
              : f.type === "WAREHOUSE"
              ? "warehouse"
              : "branch",
          city: f.city,
          status: f.status,
        }));
        setFacilities(mappedFacilities);
        setActiveFacilityState(mappedFacilities[0]);
      }

      if (usersRes.data && usersRes.data.length > 0) {
        setUsers(
          usersRes.data.map((u) => ({
            id: u.id,
            authUserId: u.auth_user_id,
            code: u.code,
            nameAr: u.name_ar,
            email: u.email,
            phone: u.phone,
            role: u.role as RoleKey,
            departmentAr: u.department_ar,
            facilityId: u.facility_id,
            avatarUrl: u.avatar_url,
            status:
              u.status === "ACTIVE"
                ? "active"
                : u.status === "SUSPENDED"
                ? "suspended"
                : "pending",
            lastLogin: u.last_login,
          }))
        );
      }

      if (notifRes.data) {
        setNotifications(
          notifRes.data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: n.time_ar,
            read: n.read,
            type:
              n.type === "alert"
                ? "urgent"
                : n.type === "warning"
                ? "warning"
                : n.type === "success"
                ? "success"
                : "info",
            link: n.link || undefined,
          }))
        );
      }

      if (appRes.data) {
        setApprovals(
          appRes.data.map((a) => ({
            id: a.id,
            title: a.title,
            requester: a.requester,
            department: a.department,
            amount: a.amount,
            date: a.date_ar,
            status:
              a.status === "APPROVED"
                ? "approved"
                : a.status === "REJECTED"
                ? "rejected"
                : "pending",
            type: mapDbApprovalType(a.type),
          }))
        );
      }

      if (woRes.data) {
        setWorkOrders(
          woRes.data.map((w) => ({
            code: w.code,
            id: w.code,
            productNameAr: w.product_name_ar,
            productName: w.product_name_ar,
            customerAr: w.customer_ar,
            targetQty: Number(w.target_qty),
            completedQty: Number(w.completed_qty),
            lineId: w.line_id || "line-1",
            lineNameAr: w.line_name_ar,
            line: w.line_name_ar,
            sku: w.sku_code || "STX-TSH-NVY-01",
            stage: w.stage || "الخياطة والتجميع",
            facility: "مجمع العاشر من رمضان",
            status: mapDbWorkOrderStatus(w.status),
            dueDate: w.due_date,
            efficiency: Number(w.efficiency),
          }))
        );
      }

      if (movRes.data) {
        setStockMovements(
          movRes.data.map((m) => ({
            id: m.id,
            type: mapDbMovementType(m.type),
            materialNameAr: m.material_name_ar,
            qty: Number(m.qty),
            unit: m.unit,
            warehouse: m.warehouse,
            batchNo: m.batch_no,
            referenceNo: m.reference_no,
            date: m.date_ar,
          }))
        );
      }

      if (trfRes.data) {
        setStockTransfers(
          trfRes.data.map((t) => ({
            code: t.code,
            fromFacility: t.from_facility,
            toFacility: t.to_facility,
            itemsCount: Number(t.items_count),
            driverName: `${t.driver_name} (${t.vehicle_number})`,
            status: mapDbTransferStatus(t.status),
            date: t.date_ar,
          }))
        );
      }

      if (jvRes.data) {
        setJournalEntries(
          jvRes.data.map((j) => ({
            code: j.code,
            debitAccount: j.debit_account,
            creditAccount: j.credit_account,
            amount: Number(j.amount),
            costCenter: j.cost_center,
            narration: j.narration,
            date: j.date_ar,
          }))
        );
      }

      if (insRes.data) {
        setInspectionRecords(
          insRes.data.map((ins) => ({
            id: ins.id,
            workOrder: ins.work_order,
            stage: ins.stage,
            sampleSize: Number(ins.sample_size),
            defectsFound: Number(ins.defects_found),
            aqlStatus: ins.decision === "REJECTED" ? "rejected" : "passed",
            inspector: ins.inspector,
          }))
        );
      }
    } catch (err: any) {
      console.error("Failed to fetch ERP context from Supabase:", err);
      setError(err?.message || "تعذر الاتصال بقاعدة بيانات Supabase");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("sotex_theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      showToast(
        "info",
        next === "dark"
          ? "تم تفعيل الوضع الداكن الفاخر (SOTEX Dark)"
          : "تم تفعيل الوضع الفاتح (SOTEX Light)",
        next === "dark"
          ? "تم تطبيق باليتة الفحمي والذهبي الرسمية لعلامة سوتكس"
          : "تم تطبيق واجهة الإضاءة النهارية المريحة"
      );
      return next;
    });
  };

  const currentUser = users.find((u) => u.role === activeRole) || users[0] || INITIAL_USERS[0];
  const roleConfig = rolesMap[activeRole] || CORE_ROLES[activeRole];

  const getRoleDefaultPath = (roleKey?: RoleKey): string => {
    const target = roleKey || activeRole;
    return rolesMap[target]?.defaultPath || CORE_ROLES[target]?.defaultPath || "/dashboard";
  };

  const openModal = (modal: ActiveModalState) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const addWorkOrder = async (order: WorkOrderItem) => {
    const dbStatus =
      order.status === "cutting"
        ? "CUTTING"
        : order.status === "sewing"
        ? "SEWING"
        : order.status === "completed"
        ? "COMPLETED"
        : "FINISHING";

    const { error: insertErr } = await supabase.from("work_orders").insert({
      code: order.code,
      product_id: "prod-1",
      product_name_ar: order.productNameAr,
      customer_ar: order.customerAr,
      target_qty: order.targetQty,
      completed_qty: order.completedQty,
      line_id: order.lineId,
      line_name_ar: order.lineNameAr,
      status: dbStatus,
      due_date: order.dueDate,
      efficiency: order.efficiency,
      start_date: "اليوم",
      days_required: 6,
      workers_count: 30,
      bottleneck: "لا يوجد اختناق",
    });

    if (insertErr) {
      showToast("error", "خطأ في الصلاحيات أو قاعدة البيانات", insertErr.message);
      throw insertErr;
    }

    setWorkOrders((prev) => [order, ...prev]);
    await logAuditAction({
      actor: currentUser.nameAr,
      actorRole: roleConfig.nameAr,
      action: "إطلاق أمر تشغيل وإنتاج جديد",
      module: "الإنتاج",
      recordRef: order.code,
      newVal: `${order.targetQty} قطعة - ${order.productNameAr}`,
    });
  };

  const addStockMovement = async (mov: StockMovementItem) => {
    const id = `MOV-${Date.now().toString().slice(-6)}`;
    const dbType =
      mov.type === "receipt"
        ? "INBOUND"
        : mov.type === "return"
        ? "RETURN"
        : "ISSUE_TO_PROD";
    const typeAr =
      mov.type === "receipt"
        ? "توريد مشتريات خارجية"
        : mov.type === "return"
        ? "مرتجع فائض خامات من الصالة"
        : "صرف خامات للإنتاج";

    const { error: insertErr } = await supabase.from("stock_movements").insert({
      id,
      type: dbType,
      type_ar: typeAr,
      material_name_ar: mov.materialNameAr,
      qty: mov.qty,
      unit: mov.unit,
      warehouse: mov.warehouse,
      batch_no: mov.batchNo,
      reference_no: mov.referenceNo,
      officer: currentUser.nameAr,
      date_ar: mov.date || "الآن",
      status: "COMPLETED",
    });

    if (insertErr) {
      showToast("error", "خطأ في توثيق الحركة المخزنية", insertErr.message);
      throw insertErr;
    }

    setStockMovements((prev) => [{ ...mov, id }, ...prev]);
    await logAuditAction({
      actor: currentUser.nameAr,
      actorRole: roleConfig.nameAr,
      action: `تسجيل حركة مخزنية (${typeAr})`,
      module: "المخازن",
      recordRef: id,
      newVal: `${mov.qty} ${mov.unit} - ${mov.materialNameAr}`,
    });
  };

  const addStockTransfer = async (trans: StockTransferItem) => {
    const { error: insertErr } = await supabase.from("stock_transfers").insert({
      code: trans.code,
      from_facility: trans.fromFacility,
      to_facility: trans.toFacility,
      items_count: trans.itemsCount,
      total_qty_desc: `${trans.itemsCount} بنود محولة`,
      driver_name: trans.driverName,
      vehicle_number: "سوتكس نقل",
      status: "IN_TRANSIT",
      date_ar: trans.date || "الآن",
    });

    if (insertErr) {
      showToast("error", "تعذر إنشاء التحويلة المخزنية", insertErr.message);
      throw insertErr;
    }

    setStockTransfers((prev) => [trans, ...prev]);
    await logAuditAction({
      actor: currentUser.nameAr,
      actorRole: roleConfig.nameAr,
      action: "إصدار بوليصة تحويل مخزني بين الفروع",
      module: "المخازن واللوجستيات",
      recordRef: trans.code,
      newVal: `${trans.fromFacility} -> ${trans.toFacility}`,
    });
  };

  const addJournalEntry = async (entry: JournalEntryItem) => {
    const { error: insertErr } = await supabase.from("journal_entries").insert({
      code: entry.code,
      debit_account: entry.debitAccount,
      credit_account: entry.creditAccount,
      amount: entry.amount,
      cost_center: entry.costCenter,
      narration: entry.narration,
      date_ar: entry.date || "اليوم",
    });

    if (insertErr) {
      showToast("error", "غير مصرح بترحيل قيود مالية لهذا الدور", insertErr.message);
      throw insertErr;
    }

    setJournalEntries((prev) => [entry, ...prev]);
    await logAuditAction({
      actor: currentUser.nameAr,
      actorRole: roleConfig.nameAr,
      action: "ترحيل قيد يومية محاسبي",
      module: "الإدارة المالية",
      recordRef: entry.code,
      newVal: `${entry.amount.toLocaleString()} ج.م`,
    });
  };

  const addInspectionRecord = async (rec: InspectionRecordItem) => {
    const id = `INS-${Date.now().toString().slice(-5)}`;
    const decision = rec.aqlStatus === "rejected" ? "REJECTED" : "PASSED";
    const { error: insertErr } = await supabase.from("quality_inspections").insert({
      id,
      work_order: rec.workOrder,
      type: "INLINE",
      type_ar: "فحص جودة تشغيلي AQL",
      stage: rec.stage,
      sample_name: `عينة أمر تشغيل ${rec.workOrder}`,
      batch_qty: rec.sampleSize * 10,
      sample_size: rec.sampleSize,
      defects_found: rec.defectsFound,
      aql_status: decision === "PASSED" ? "مقبول (AQL 1.5)" : "مرفوض",
      decision,
      inspector: rec.inspector || currentUser.nameAr,
      date_ar: "الآن",
    });

    if (insertErr) {
      showToast("error", "تعذر تسجيل الفحص في قاعدة البيانات", insertErr.message);
      throw insertErr;
    }

    setInspectionRecords((prev) => [{ ...rec, id }, ...prev]);
    await logAuditAction({
      actor: currentUser.nameAr,
      actorRole: roleConfig.nameAr,
      action: "توثيق تقرير فحص جودة AQL",
      module: "الجودة",
      recordRef: id,
      newVal: `${rec.workOrder} (${decision})`,
    });
  };

  const setActiveRole = (role: RoleKey) => {
    setActiveRoleState(role);
    setSupabaseRoleHeader(role);
    const newRole = rolesMap[role] || CORE_ROLES[role];
    showToast(
      "info",
      `تم التحويل إلى دور: ${newRole.nameAr}`,
      `تم تطبيق صلاحيات RLS ونطاق بيانات: ${newRole.categoryAr}`
    );
  };

  const setActiveFacility = (facility: Facility) => {
    setActiveFacilityState(facility);
    showToast("success", "تم تغيير المنشأة النشطة", `المنشأة الحالية: ${facility.nameAr}`);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const handleApproval = async (id: string, decision: "approved" | "rejected") => {
    const dbStatus = decision === "approved" ? "APPROVED" : "REJECTED";
    const { error: updateErr } = await supabase
      .from("approvals")
      .update({ status: dbStatus })
      .eq("id", id);

    if (updateErr) {
      showToast(
        "error",
        "غير مصرح باعتماد الطلبات المالية",
        "يتطلب هذا الإجراء صلاحية المالك أو المدير المالي وفق سياسات RLS."
      );
      return;
    }

    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: decision } : a)));
    await logAuditAction({
      actor: currentUser.nameAr,
      actorRole: roleConfig.nameAr,
      action: decision === "approved" ? "اعتماد طلب مالي/تشغيلي" : "رفض طلب",
      module: "الاعتمادات",
      recordRef: id,
      oldVal: "PENDING",
      newVal: dbStatus,
      severity: decision === "approved" ? "INFO" : "WARNING",
    });

    if (decision === "approved") {
      showToast("success", "تم اعتماد الطلب بنجاح", "تم توثيق الاعتماد في Supabase وترحيل المعاملة في سجل التدقيق.");
    } else {
      showToast("error", "تم رفض الطلب", "تم تحديث حالة الطلب في قاعدة البيانات وإشعار مقدم الطلب.");
    }
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === "pending").length;

  const canViewCost = roleConfig.canViewCost;

  const canAccessRoute = (route: string) => {
    if (roleConfig.allowedNavPrefixes.includes("*")) return true;
    return roleConfig.allowedNavPrefixes.some(
      (prefix) => route === prefix || route.startsWith(prefix === "/" ? "/dashboard" : prefix)
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ERPContext.Provider
      value={{
        activeRole,
        currentRole: activeRole,
        roleConfig,
        setActiveRole,
        currentUser,
        users,
        facilities,
        activeFacility,
        setActiveFacility,
        getRoleDefaultPath,
        isLoading,
        error,
        refreshData,
        activeModal,
        openModal,
        closeModal,
        workOrders,
        addWorkOrder,
        stockMovements,
        addStockMovement,
        stockTransfers,
        addStockTransfer,
        journalEntries,
        addJournalEntry,
        inspectionRecords,
        addInspectionRecord,
        notifications,
        markNotificationAsRead,
        unreadNotificationsCount,
        approvals,
        handleApproval,
        pendingApprovalsCount,
        theme,
        toggleTheme,
        searchOpen,
        setSearchOpen,
        canViewCost,
        canAccessRoute,
        showToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ActionModal />
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error("useERP must be used within an ERPProvider");
  }
  return context;
}
