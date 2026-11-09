import { Facility, RoleDefinition, RoleKey, UserProfile, NotificationItem, ApprovalItem } from "./types";

export const CORE_ROLES: Record<RoleKey, RoleDefinition> = {
  OWNER_ADMIN: {
    key: "OWNER_ADMIN",
    nameAr: "المدير التنفيذي / الإدارة العليا",
    nameEn: "Executive Manager & Owner",
    categoryAr: "الإدارة التنفيذية والتحكم الشامل",
    descriptionAr: "صلاحية شاملة على جميع إدارات المصنع، والبيانات المالية، وتعيين الصلاحيات وإعدادات الأمان.",
    defaultPath: "/dashboard",
    canViewCost: true,
    canViewMargins: true,
    canApproveFinancial: true,
    canManageUsers: true,
    badgeColor: "bg-primary text-on-primary",
    icon: "admin_panel_settings",
    allowedNavPrefixes: ["*"], // all
  },
  PRODUCTION_MANAGER: {
    key: "PRODUCTION_MANAGER",
    nameAr: "مدير المصنع والإنتاج",
    nameEn: "Factory & Production Manager",
    categoryAr: "التصنيع والتشغيل وخطوط الصالات",
    descriptionAr: "متابعة أوامر التشغيل، كفاءة الخطوط OEE، مراحل القص والخياطة، وقوائم BOM وفحص الجودة AQL.",
    defaultPath: "/production",
    canViewCost: false,
    canViewMargins: false,
    canApproveFinancial: false,
    canManageUsers: false,
    badgeColor: "bg-[#262B34] text-white border border-[#3E4552]",
    icon: "precision_manufacturing",
    allowedNavPrefixes: ["/", "/dashboard", "/production", "/quality", "/inventory", "/alerts", "/tasks", "/calendar", "/hr"],
  },
  WAREHOUSE_MANAGER: {
    key: "WAREHOUSE_MANAGER",
    nameAr: "الميرشندايز وسلاسل الإمداد",
    nameEn: "Merchandiser & Supply Chain",
    categoryAr: "المخازن وسلاسل الإمداد وتتبع الطلبيات",
    descriptionAr: "متابعة أوامر التوريد، تتبع طلبيات الأقمشة والإكسسوارات، أذون الاستلام والصرف والتحويلات.",
    defaultPath: "/inventory",
    canViewCost: false,
    canViewMargins: false,
    canApproveFinancial: false,
    canManageUsers: false,
    badgeColor: "bg-[#059669] text-white",
    icon: "warehouse",
    allowedNavPrefixes: ["/", "/dashboard", "/inventory", "/procurement", "/alerts", "/tasks", "/products"],
  },
  FINANCE_SALES_MANAGER: {
    key: "FINANCE_SALES_MANAGER",
    nameAr: "المدير المالي والتجاري",
    nameEn: "Financial Director",
    categoryAr: "الإدارة المالية والمبيعات والتصدير",
    descriptionAr: "إدارة عروض الأسعار، طلبات البيع والتصدير، القيود اليومية، الخزينة، التكاليف واعتماد الخصومات.",
    defaultPath: "/finance",
    canViewCost: true,
    canViewMargins: true,
    canApproveFinancial: true,
    canManageUsers: false,
    badgeColor: "bg-[#D97706] text-white",
    icon: "account_balance",
    allowedNavPrefixes: ["/", "/dashboard", "/sales", "/finance", "/procurement", "/products", "/approvals", "/alerts", "/reports"],
  },
};

export const FACILITIES: Facility[] = [
  {
    id: "fac-1",
    code: "STX-MHL-HQ",
    nameAr: "مجمع ومصانع سوتكس المركزي - المحلة الكبرى",
    type: "factory",
    city: "المحلة الكبرى",
    status: "active",
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "usr-1",
    code: "EMP-1001",
    nameAr: "م. إسلام",
    email: "islam@sotex.eg",
    phone: "+20 100 234 5678",
    role: "OWNER_ADMIN",
    departmentAr: "الإدارة التنفيذية والعليا",
    facilityId: "fac-1",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "متصل الآن",
  },
  {
    id: "usr-2",
    code: "EMP-1002",
    nameAr: "م. محمد السيد",
    email: "mohamed.elsayed@sotex.eg",
    phone: "+20 101 987 6543",
    role: "PRODUCTION_MANAGER",
    departmentAr: "إدارة المصنع والإنتاج",
    facilityId: "fac-1",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "اليوم 09:15 ص",
  },
  {
    id: "usr-3",
    code: "EMP-1003",
    nameAr: "أ. مصطفى عبد العزيز",
    email: "mostafa.abdelaziz@sotex.eg",
    phone: "+20 102 345 6789",
    role: "WAREHOUSE_MANAGER",
    departmentAr: "الميرشندايز وسلاسل الإمداد",
    facilityId: "fac-1",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "أمس 04:30 م",
  },
  {
    id: "usr-4",
    code: "EMP-1004",
    nameAr: "مستر حسين",
    email: "hussein@sotex.eg",
    phone: "+20 109 876 5432",
    role: "FINANCE_SALES_MANAGER",
    departmentAr: "الإدارة المالية والحسابات",
    facilityId: "fac-1",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    status: "active",
    lastLogin: "اليوم 10:00 ص",
  },
];

export const DEFAULT_USER_PASSWORDS: Record<string, string> = {
  "islam@sotex.eg": "Islam@2026!",
  "mohamed.elsayed@sotex.eg": "Mohamed@2026!",
  "mostafa.abdelaziz@sotex.eg": "Mostafa@2026!",
  "hussein@sotex.eg": "Hussein@2026!",
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "notif-1", title: "انخفاض رصيد خام حرج", message: "رصيد قماش قطن سنجل ليكرا (كحلي 402) أقل من حد الأمان (متبقي 120 متر)", time: "منذ 15 دقيقة", read: false, type: "urgent", link: "/inventory/fabrics" },
  { id: "notif-2", title: "اعتماد أمر تشغيل", message: "أمر إنتاج قميص أكسفورد صيفي #ORD-8841 جاهز لبدء مرحلة القص", time: "منذ 40 دقيقة", read: false, type: "info", link: "/production" },
  { id: "notif-3", title: "فحص جودة واردات", message: "تم الانتهاء من فحص شحنة أزرار صدفية بمعدل قبول 98.5%", time: "منذ ساعتين", read: true, type: "success", link: "/quality/inspections" },
  { id: "notif-4", title: "طلب اعتماد مالي معلق", message: "خصم كمية بنسبة 8% لعميل توكيل الإسكندرية بانتظار الموافقة", time: "منذ 3 ساعات", read: false, type: "warning", link: "/approvals" },
];

export const INITIAL_APPROVALS: ApprovalItem[] = [
  { id: "app-1", title: "طلب صرف خامات قماش صوف معالج للتشغيل", requester: "م. محمد السيد", department: "الإنتاج", amount: "48,500 ج.م", date: "اليوم 09:30 ص", status: "pending", type: "stock_issue" },
  { id: "app-2", title: "أمر شراء خيوط قطنية وسحابات مستوردة", requester: "أ. مصطفى عبد العزيز", department: "المشتريات والميرشندايز", amount: "124,000 ج.م", date: "اليوم 10:15 ص", status: "pending", type: "purchase_order" },
  { id: "app-3", title: "اعتماد خصم استثنائي لطلب تصدير السعودية", requester: "مستر حسين", department: "المالية والمبيعات", amount: "18,200 ج.م", date: "أمس", status: "pending", type: "discount" },
];

