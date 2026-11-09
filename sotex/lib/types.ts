export type RoleKey =
  | "OWNER_ADMIN"
  | "PRODUCTION_MANAGER"
  | "WAREHOUSE_MANAGER"
  | "FINANCE_SALES_MANAGER";

export interface RoleDefinition {
  key: RoleKey;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  descriptionAr: string;
  defaultPath: string;
  canViewCost: boolean;
  canViewMargins: boolean;
  canApproveFinancial: boolean;
  canManageUsers: boolean;
  badgeColor: string;
  icon: string;
  allowedNavPrefixes: string[];
}

export interface Facility {
  id: string;
  code?: string;
  nameAr: string;
  type: "factory" | "warehouse" | "branch";
  city: string;
  status?: string;
}

export interface UserProfile {
  id: string;
  authUserId?: string | null;
  code: string;
  nameAr: string;
  email: string;
  phone: string;
  role: RoleKey;
  departmentAr: string;
  facilityId: string;
  avatarUrl: string;
  status: "active" | "suspended" | "pending";
  lastLogin: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "warning" | "info" | "urgent" | "success";
  link?: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  requester: string;
  department: string;
  amount?: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  type: "purchase_order" | "stock_issue" | "discount" | "leave";
}

export type ModalType =
  | "new_work_order"
  | "new_stock_movement"
  | "new_stock_transfer"
  | "new_product_quick"
  | "new_sales_order"
  | "new_po"
  | "new_inspection"
  | "new_rfq"
  | "new_journal_entry"
  | "export_report"
  | "tech_pack_view"
  | "barcode_scan"
  | "shift_redirect"
  | "pay_approval"
  | "new_employee"
  | "new_workflow_rule";

export interface ActiveModalState {
  type: ModalType;
  title: string;
  description?: string;
  payload?: any;
}

// ============================================================
// SUPABASE DATABASE ROW INTERFACES (SOTEX ERP SCHEMA)
// ============================================================

export interface DbProductRow {
  id: string;
  sku_code: string;
  barcode: string;
  name_ar: string;
  model_subtitle: string;
  season: string;
  category_ar: string;
  fabric_spec: string;
  colors_json: { name: string; hex: string }[];
  sizes: string[];
  cost_price: number;
  raw_cost: number;
  labor_cost: number;
  wholesale_price: number;
  retail_price: number;
  export_price_usd: number;
  min_qty_wholesale: number;
  available_qty: number;
  wip_qty: number;
  reserved_qty: number;
  status: "IN_STOCK" | "LOW_STOCK" | "IN_PRODUCTION";
  image_url: string;
}

export interface DbProductSkuRow {
  sku: string;
  product_id: string;
  model_code: string;
  model_name: string;
  color_name: string;
  color_hex: string;
  size: string;
  stock_qty: number;
  barcode: string;
  warehouse: string;
  weight_grams: number;
  safety_threshold: number;
  status: "ACTIVE" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface DbBomItemRow {
  id: string;
  product_id: string | null;
  product_code: string;
  item_type: "FABRIC" | "ACCESSORY" | "PACKAGING" | "LABOR";
  item_type_ar: string;
  name: string;
  specification: string;
  consumption_per_piece: string;
  wastage_percent: number;
  total_for_1000_pieces: string;
  unit_cost_egp: number;
  required_qty_str: string;
  stock_qty_str: string;
  availability_pct: number;
  status_label: string;
}

export interface DbInventoryItemRow {
  code: string;
  barcode: string;
  name_ar: string;
  spec_ar: string;
  category: "RAW_FABRIC" | "ACCESSORIES" | "WIP" | "FINISHED_GOODS";
  warehouse_ar: string;
  location_ar: string;
  facility_id: string | null;
  actual_qty: number;
  reserved_qty: number;
  available_qty: number;
  in_transit_qty: number;
  unit: string;
  unit_cost: number;
  total_value: number;
  status: "OPTIMAL" | "LOW_STOCK" | "CRITICAL";
  image_url: string;
}

export interface DbFabricBatchRow {
  code: string;
  inventory_code: string | null;
  name: string;
  composition: string;
  color_name: string;
  color_code: string;
  rolls_count: number;
  total_meters: number;
  reserved_meters: number;
  available_meters: number;
  location: string;
  lot_number: string;
  supplier: string;
  status: "AVAILABLE" | "LOW_STOCK" | "RESERVED" | "QUARANTINE";
}

export interface DbStockCountSessionRow {
  id: string;
  name: string;
  warehouse: string;
  facility_id: string | null;
  session_date: string;
  counted_items: number;
  discrepancies_count: number;
  net_diff_amount: string;
  status: "APPROVED" | "PENDING_APPROVAL" | "IN_PROGRESS";
}

export interface DbProductionLineRow {
  id: string;
  line_code: string;
  line_name: string;
  facility_id: string | null;
  supervisor: string;
  current_product: string;
  active_order_code: string | null;
  workers_count: number;
  target_daily: number;
  actual_daily: number;
  planned_monthly: number;
  actual_monthly: number;
  availability: number;
  performance: number;
  quality: number;
  overall_oee: number;
  status: "RUNNING" | "BOTTLENECK" | "CHANGEOVER" | "MAINTENANCE" | "OPTIMAL" | "SLIGHT_DELAY";
}

export interface DbProductionStageRow {
  id: string;
  name: string;
  icon: string;
  supervisor: string;
  active_orders: number;
  completed_pieces: number;
  target_pieces: number;
  defect_rate: number;
  status: "OPTIMAL" | "BOTTLENECK";
  sort_order: number;
}

export interface DbQualityInlineStationRow {
  id: string;
  line_id: string | null;
  name: string;
  process: string;
  defect_rate: string;
  status: "SAFE" | "WARNING" | "CRITICAL";
  inspected: number;
  rejected: number;
}

export interface DbQualityDefectRow {
  id: string;
  defect_type: string;
  count: number;
  percentage: string;
  cumulative: string;
  capa_action: string;
  status: "IN_PROGRESS" | "RESOLVED" | "OPEN";
  sort_order: number;
}

export interface DbCustomerRow {
  id: string;
  name: string;
  type: "WHOLESALE" | "EXPORT" | "RETAIL_CHAIN";
  type_ar: string;
  country_or_city: string;
  total_orders_volume: string;
  outstanding_balance_egp: number;
  credit_limit_egp: number;
  contact_person: string;
  phone: string;
  aging_current: number;
  aging_30: number;
  aging_60: number;
  aging_90_plus: number;
  aging_status: "SAFE" | "WARNING" | "CRITICAL" | "SETTLED";
}

export interface DbSalesOrderRow {
  id: string;
  customer_id: string | null;
  client_name: string;
  order_type: "WHOLESALE" | "EXPORT" | "B2B_CONTRACT";
  order_type_ar: string;
  pieces_count: number;
  total_amount_egp: number;
  paid_amount_egp: number;
  delivery_date: string;
  status: "IN_PRODUCTION" | "READY_TO_SHIP" | "DELIVERED" | "PENDING_PAYMENT";
}

export interface DbSalesQuotationRow {
  id: string;
  customer_id: string | null;
  customer: string;
  models_summary: string;
  qty: number;
  total_egp: number;
  valid_until: string;
  status: "SENT" | "ACCEPTED" | "CONVERTED_TO_SO" | "EXPIRED";
}

export interface DbSupplierRow {
  id: string;
  name: string;
  category: string;
  city: string;
  contact_person: string;
  phone: string;
  rating: number;
  credit_days: number;
  open_orders_count: number;
  status: "PREFERRED" | "VERIFIED" | "UNDER_REVIEW";
  total_debt: number;
  aging_current: number;
  aging_30: number;
  aging_60: number;
  aging_90_plus: number;
}

export interface DbPurchaseOrderRow {
  id: string;
  supplier_id: string | null;
  supplier: string;
  items: string;
  total_egp: number;
  po_date: string;
  expected_delivery: string;
  status: "APPROVED" | "IN_TRANSIT" | "RECEIVED_PARTIAL" | "PENDING_APPROVAL" | "COMPLETED";
}

export interface DbProcurementRfqRow {
  id: string;
  title: string;
  created_date: string;
  due_date: string;
  status: "COMPARING" | "AWARDED";
  quotes_json: {
    supplier: string;
    pricePerUnit: string;
    total: string;
    deliveryDays: string;
    paymentTerms: string;
    recommended: boolean;
  }[];
}

export interface DbSupplierInvoiceRow {
  inv_no: string;
  supplier_id: string | null;
  supplier: string;
  po_no: string | null;
  grn_no: string;
  amount: string;
  matching: string;
  status: "MATCHED" | "DISCREPANCY";
  inv_date: string;
}

export interface DbChartOfAccountRow {
  code: string;
  name: string;
  type: "أصول" | "التزامات" | "حقوق ملكية" | "إيرادات" | "مصروفات";
  balance: number;
  level: number;
  has_children: boolean;
}

export interface DbTreasuryAccountRow {
  id: string;
  name: string;
  account_no: string;
  description: string;
  balance: number;
  type: "BANK" | "CASH_SAFE";
}

export interface DbChequeRow {
  cheque_no: string;
  type: "INWARD" | "OUTWARD";
  party: string;
  bank: string;
  amount: number;
  due_date: string;
  status: "UNDER_COLLECTION" | "COLLECTED" | "ISSUED" | "BOUNCED";
}

export interface DbEmployeeRow {
  id: string;
  code: string;
  name: string;
  role: string;
  line_id: string | null;
  line: string;
  skill: string;
  efficiency: number;
  daily_target: number;
  completed_today: number;
  status: "ACTIVE" | "BREAK" | "ABSENT";
  avatar: string;
  check_in_time: string;
  attendance_status: "حاضر بالموعد" | "تأخير" | "مأمورية خارجية" | "إجازة معتمدة";
  work_hours: string;
  piece_qty_str: string;
  piece_rate_str: string;
  piece_bonus_str: string;
  base_salary_str: string;
  net_pay_str: string;
}
