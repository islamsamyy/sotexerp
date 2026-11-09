-- ==============================================================================
-- SOTEX Garment Manufacturing ERP — Database Schema
-- Architecture: 4-Layer RBAC + ABAC Scopes + Maker-Checker + Manufacturing Domain
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'locked', 'pending');
CREATE TYPE severity_level AS ENUM ('info', 'warning', 'critical');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'escalated');
CREATE TYPE production_order_status AS ENUM ('draft', 'planned', 'cutting', 'sewing', 'finishing', 'completed', 'cancelled');
CREATE TYPE quality_decision AS ENUM ('passed', 'rework', 'second_grade', 'rejected');

-- 3. ORGANIZATIONAL STRUCTURE
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    warehouse_type VARCHAR(50) NOT NULL DEFAULT 'raw_materials', -- raw_materials, fabrics, wip, finished_goods
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    line_type VARCHAR(50) NOT NULL DEFAULT 'sewing', -- cutting, sewing, finishing, packing
    daily_target_pieces INT DEFAULT 500,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 4-LAYER RBAC & SECURITY TABLES
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- OWNER_ADMIN, PRODUCTION_MANAGER, WAREHOUSE_MANAGER, FINANCE_SALES_MANAGER
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    category_ar VARCHAR(100) NOT NULL,
    description_ar TEXT,
    hierarchy_level INT DEFAULT 1,
    is_system_role BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name_ar VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    job_title_ar VARCHAR(150),
    department_id UUID REFERENCES public.departments(id),
    primary_branch_id UUID REFERENCES public.branches(id),
    status user_status DEFAULT 'active',
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.user_data_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    scope_type VARCHAR(50) NOT NULL DEFAULT 'BRANCH', -- COMPANY_WIDE, BRANCH, WAREHOUSE, PRODUCTION_LINE
    allowed_branch_ids UUID[] DEFAULT '{}',
    allowed_warehouse_ids UUID[] DEFAULT '{}',
    allowed_production_line_ids UUID[] DEFAULT '{}',
    can_view_cost_price BOOLEAN DEFAULT false,
    can_view_profit_margin BOOLEAN DEFAULT false,
    max_discount_percent NUMERIC(5,2) DEFAULT 0.00,
    max_approval_amount NUMERIC(14,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDIT LOG (APPEND-ONLY WITH TRIGGER LOCK)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role VARCHAR(100),
    action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, APPROVE, REJECT, EXPORT, LOGIN
    module_key VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    record_reference VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    severity severity_level DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent UPDATE or DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are append-only. Modification or deletion is strictly prohibited by compliance policy.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_lock ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_lock
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- 6. MANUFACTURING ERP DOMAIN TABLES
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    season VARCHAR(50) NOT NULL,
    cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    wholesale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'نشط',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity_required INT NOT NULL,
    quantity_produced INT DEFAULT 0,
    status production_order_status DEFAULT 'planned',
    priority VARCHAR(50) DEFAULT 'medium',
    production_line_id UUID REFERENCES public.production_lines(id),
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.materials_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- fabric, thread, button, zipper, packaging
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(30) NOT NULL, -- meters, rolls, kg, pieces
    reorder_level NUMERIC(12,2) NOT NULL DEFAULT 100.00,
    cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. APPROVAL WORKFLOWS & REQUESTS
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type VARCHAR(100) NOT NULL,
    reference_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    requester_id UUID REFERENCES public.profiles(id),
    amount NUMERIC(14,2),
    status approval_status DEFAULT 'pending',
    reviewer_id UUID REFERENCES public.profiles(id),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS VARCHAR AS $$
    SELECT r.code 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND ur.is_primary = true
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Public read policies for authenticated users
CREATE POLICY "Allow authenticated read branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read production_lines" ON public.production_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read production_orders" ON public.production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read materials" ON public.materials_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read approvals" ON public.approval_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow read audit logs for owner_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.get_auth_role() = 'OWNER_ADMIN');

