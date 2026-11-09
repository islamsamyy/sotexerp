-- ==============================================================================
-- SOTEX Garment Manufacturing ERP — Seed Data
-- ==============================================================================

-- 1. SEED BRANCHES
INSERT INTO public.branches (id, code, name_ar, name_en, city, address, phone)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'BR-10-RAMADAN', 'فرع العاشر من رمضان - المصنع الرئيسي', '10th of Ramadan Main Plant', 'العاشر من رمضان', 'المنطقة الصناعية الثالثة B4', '+20 15 365 4001'),
  ('22222222-2222-2222-2222-222222222222', 'BR-OCTOBER', 'مستودع الأقمشة والإمداد - 6 أكتوبر', '6th of October Logistics Hub', 'السادس من أكتوبر', 'المنطقة الصناعية الأولى', '+20 2 383 1200'),
  ('33333333-3333-3333-3333-333333333333', 'BR-CAIRO', 'معرض التوزيع المركزي - القاهرة', 'Cairo Central Showroom', 'القاهرة', 'مدينة نصر - المنطقة الأولى', '+20 2 226 0988')
ON CONFLICT (code) DO NOTHING;

-- 2. SEED DEPARTMENTS
INSERT INTO public.departments (id, code, name_ar, name_en, branch_id)
VALUES
  ('aaaa1111-aaaa-1111-aaaa-111111111111', 'DEP-EXEC', 'الإدارة العليا والتشغيل', 'Executive & Operations', '11111111-1111-1111-1111-111111111111'),
  ('aaaa2222-aaaa-2222-aaaa-222222222222', 'DEP-PROD', 'إدارة الإنتاج والتصنيع', 'Production & Manufacturing', '11111111-1111-1111-1111-111111111111'),
  ('aaaa3333-aaaa-3333-aaaa-333333333333', 'DEP-WH', 'إدارة المخازن والمستودعات', 'Warehousing & Inventory', '11111111-1111-1111-1111-111111111111'),
  ('aaaa4444-aaaa-4444-aaaa-444444444444', 'DEP-FIN', 'الإدارة المالية والحسابات', 'Finance & Accounting', '11111111-1111-1111-1111-111111111111'),
  ('aaaa5555-aaaa-5555-aaaa-555555555555', 'DEP-QC', 'إدارة توكيد ورقابة الجودة', 'Quality Assurance & Control', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (code) DO NOTHING;

-- 3. SEED WAREHOUSES
INSERT INTO public.warehouses (id, code, name_ar, branch_id, warehouse_type)
VALUES
  ('bbbb1111-bbbb-1111-bbbb-111111111111', 'WH-FAB-01', 'مخزن الأقمشة الخام الرئيسي', '11111111-1111-1111-1111-111111111111', 'fabrics'),
  ('bbbb2222-bbbb-2222-bbbb-222222222222', 'WH-ACC-01', 'مخزن الإكسسوارات والخيوط والأزرار', '11111111-1111-1111-1111-111111111111', 'raw_materials'),
  ('bbbb3333-bbbb-3333-bbbb-333333333333', 'WH-FG-01', 'مخزن المنتج التام والتعبئة', '11111111-1111-1111-1111-111111111111', 'finished_goods')
ON CONFLICT (code) DO NOTHING;

-- 4. SEED PRODUCTION LINES
INSERT INTO public.production_lines (id, code, name_ar, branch_id, line_type, daily_target_pieces)
VALUES
  ('cccc1111-cccc-1111-cccc-111111111111', 'LINE-CUT-01', 'صالة القص الآلي والليزر', '11111111-1111-1111-1111-111111111111', 'cutting', 1500),
  ('cccc2222-cccc-2222-cccc-222222222222', 'LINE-SEW-01', 'خط خياطة وتجميع القمصان A', '11111111-1111-1111-1111-111111111111', 'sewing', 450),
  ('cccc3333-cccc-3333-cccc-333333333333', 'LINE-SEW-02', 'خط خياطة وتجميع البناطيل B', '11111111-1111-1111-1111-111111111111', 'sewing', 400),
  ('cccc4444-cccc-4444-cccc-444444444444', 'LINE-FIN-01', 'خط الكي والتشطيب والتعبئة', '11111111-1111-1111-1111-111111111111', 'finishing', 800)
ON CONFLICT (code) DO NOTHING;

-- 5. SEED THE 4 CORE STARTER ROLES
INSERT INTO public.roles (id, code, name_ar, name_en, category_ar, description_ar, hierarchy_level, is_system_role)
VALUES
  ('dddd1111-dddd-1111-dddd-111111111111', 'OWNER_ADMIN', 'مالك المصنع / مدير النظام', 'Factory Owner & System Admin', 'الإدارة العليا والتحكم', 'صلاحية شاملة على جميع إدارات المصنع، البيانات المالية، تعيين الصلاحيات وإعدادات الأمان.', 10, true),
  ('dddd2222-dddd-2222-dddd-222222222222', 'PRODUCTION_MANAGER', 'مدير الإنتاج والجودة', 'Production & Quality Manager', 'التصنيع والتشغيل', 'متابعة أوامر التشغيل، كفاءة الخطوط OEE، مراحل القص والخياطة، وقوائم BOM وفحص الجودة AQL.', 7, true),
  ('dddd3333-dddd-3333-dddd-333333333333', 'WAREHOUSE_MANAGER', 'مدير المخازن والمستودعات', 'Warehouse & Inventory Manager', 'المخازن وسلاسل الإمداد', 'إدارة أرصدة الأقمشة والإكسسوارات، أذون الاستلام والصرف، التحويلات، الجرد الدوري والباركود.', 6, true),
  ('dddd4444-dddd-4444-dddd-444444444444', 'FINANCE_SALES_MANAGER', 'المدير المالي والمبيعات', 'Finance & Sales Manager', 'الإدارة المالية والمبيعات', 'إدارة عروض الأسعار، طلبات البيع والتصدير، القيود اليومية، الخزينة، التكاليف واعتماد الخصومات.', 8, true)
ON CONFLICT (code) DO NOTHING;

-- 6. SEED PRODUCTS
INSERT INTO public.products (sku, name_ar, category, season, cost_price, wholesale_price, retail_price, stock_quantity, status)
VALUES
  ('SOT-SH-8841', 'قميص أكسفورد كلاسيكي قطن 100%', 'قمصان رجالي', 'صيف 2026', 145.00, 240.00, 395.00, 1850, 'نشط'),
  ('SOT-TR-5520', 'بنطلون جبردين إيطالي سليم فيت', 'بناطيل كاجوال', 'صيف 2026', 190.00, 310.00, 520.00, 1200, 'نشط'),
  ('SOT-PL-3310', 'بولو شيرت بيكيه قطن سوبريم مطرز', 'ملابس رياضية', 'صيف 2026', 115.00, 185.00, 320.00, 2400, 'نشط'),
  ('SOT-JK-9912', 'جاكيت صوف فاخر شتوي مبطن', 'ملابس شتوية', 'شتاء 2026', 380.00, 620.00, 980.00, 650, 'نشط')
ON CONFLICT (sku) DO NOTHING;

