-- Skill ERP complete database schema with 65 tables
-- Recreated with complete column mappings for all frontend modules

-- Drop triggers if they exist
do $$
declare
  t_name text;
begin
  for t_name in select table_name from information_schema.tables where table_schema = 'public'
  loop
    execute format('drop trigger if exists trg_%I_updated_at on %I', t_name, t_name);
  end loop;
end $$;

-- Drop all 65 tables (with CASCADE to handle constraints automatically)
drop table if exists departments cascade;
drop table if exists positions cascade;
drop table if exists work_roles cascade;
drop table if exists app_users cascade;
drop table if exists employees cascade;
drop table if exists customers cascade;
drop table if exists leads cascade;
drop table if exists lead_communications cascade;
drop table if exists lead_status_logs cascade;
drop table if exists estimations cascade;
drop table if exists estimation_lines cascade;
drop table if exists projects cascade;
drop table if exists quotations cascade;
drop table if exists sites cascade;
drop table if exists suppliers cascade;
drop table if exists units_of_measure cascade;
drop table if exists materials cascade;
drop table if exists site_inventory cascade;
drop table if exists stock_requests cascade;
drop table if exists stock_request_items cascade;
drop table if exists purchase_orders cascade;
drop table if exists purchase_order_items cascade;
drop table if exists goods_receipts cascade;
drop table if exists goods_receipt_items cascade;
drop table if exists stock_movements cascade;
drop table if exists attendance cascade;
drop table if exists leave_requests cascade;
drop table if exists payroll_batches cascade;
drop table if exists payroll_lines cascade;
drop table if exists vehicles cascade;
drop table if exists vehicle_assignments cascade;
drop table if exists vehicle_fuel_logs cascade;
drop table if exists vehicle_maintenance_logs cascade;
drop table if exists vehicle_meter_logs cascade;
drop table if exists accounts cascade;
drop table if exists journal_entries cascade;
drop table if exists journal_lines cascade;
drop table if exists bank_accounts cascade;
drop table if exists expense_categories cascade;
drop table if exists project_expenses cascade;
drop table if exists petty_cash cascade;
drop table if exists client_payments cascade;
drop table if exists taxes cascade;
drop table if exists tax_entries cascade;
drop table if exists file_attachments cascade;
drop table if exists client_access_tokens cascade;
drop table if exists client_responses cascade;
drop table if exists audit_logs cascade;
drop table if exists boq_import_mappings cascade;
drop table if exists boqs cascade;
drop table if exists boq_sections cascade;
drop table if exists boq_items cascade;
drop table if exists boq_item_breakdowns cascade;
drop table if exists bsr_rates cascade;
drop table if exists bsr_analysis cascade;
drop table if exists material_aliases cascade;
drop table if exists unit_aliases cascade;
drop table if exists project_activity_logs cascade;
drop table if exists project_milestones cascade;
drop table if exists project_status_logs cascade;
drop table if exists project_team_assignments cascade;
drop table if exists site_progress_updates cascade;
drop table if exists purchase_approvals cascade;
drop table if exists supplier_performance cascade;
drop table if exists employee_site_assignments cascade;

-- Drop all custom enum types
drop type if exists user_role cascade;
drop type if exists project_type cascade;
drop type if exists lead_status cascade;
drop type if exists priority_level cascade;
drop type if exists estimation_status cascade;
drop type if exists quotation_status cascade;
drop type if exists project_status cascade;
drop type if exists stock_request_status cascade;
drop type if exists approval_status cascade;
drop type if exists po_status cascade;
drop type if exists supplier_status cascade;
drop type if exists salary_type cascade;
drop type if exists attendance_status cascade;
drop type if exists payroll_status cascade;
drop type if exists vehicle_ownership cascade;
drop type if exists vehicle_status cascade;
drop type if exists account_type cascade;
drop type if exists journal_status cascade;
drop type if exists petty_cash_status cascade;
drop type if exists source_module cascade;
drop type if exists communication_type cascade;

-- Enable pgcrypto extension for UUIDs and random generation
create extension if not exists "pgcrypto";

-- Recreate custom enum types
create type user_role as enum ('super_admin','hr_manager','hr_executive','marketing_manager','marketing_executive','qs_manager','qs_engineer','stock_manager','store_keeper','project_manager','technical_officer','accountant','finance_manager','vehicle_manager','viewer','client_user');
create type project_type as enum ('drawing_only','2d_3d','construction_only','full_project');
create type lead_status as enum ('new','under_review','qs_estimation_pending','quotation_submitted','client_discussion','approved','rejected','closed','revision_requested');
create type priority_level as enum ('low','medium','high','urgent');
create type estimation_status as enum ('draft','in_progress','ready_for_quotation','quotation_submitted','revision_requested','approved_baseline');
create type quotation_status as enum ('draft','under_review','submitted','client_sent','revision_requested','approved','rejected','expired','archived');
create type project_status as enum ('draft','created','assigned','in_progress','on_hold','completed','cancelled','closed');
create type stock_request_status as enum ('draft','submitted','qs_review','approved','rejected','converted_to_po','partially_fulfilled','completed','cancelled');
create type approval_status as enum ('pending','approved','rejected');
create type po_status as enum ('draft','pending_approval','approved','issued','partially_received','fully_received','cancelled','closed','partially_fulfilled');
create type supplier_status as enum ('active','inactive');
create type salary_type as enum ('monthly','daily','hourly');
create type attendance_status as enum ('present','absent','leave','unpaid');
create type payroll_status as enum ('draft','prepared','approved','processed','paid','locked','cancelled');
create type vehicle_ownership as enum ('owned','leased');
create type vehicle_status as enum ('available','assigned','under_maintenance','unavailable','retired');
create type account_type as enum ('asset','liability','income','expense','equity');
create type journal_status as enum ('draft','posted','reversed');
create type petty_cash_status as enum ('issued','pending','settled');
create type source_module as enum ('project_expense','petty_cash','client_payment','system');
create type communication_type as enum ('call','email','meeting','whatsapp','note');

-- Recreate set_updated_at helper function
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. departments
create table departments (
  id bigserial primary key,
  name text not null unique,
  code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. positions
create table positions (
  id bigserial primary key,
  department_id bigint references departments(id) on delete set null,
  title text not null,
  name text, -- alias
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. work_roles
create table work_roles (
  id bigserial primary key,
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. app_users
create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_code text unique,
  full_name text not null,
  role user_role not null default 'viewer',
  department_id bigint references departments(id) on delete set null,
  email text unique,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. employees
create table employees (
  id bigserial primary key,
  user_id uuid references app_users(id) on delete set null,
  employee_code text not null unique,
  full_name text not null,
  email text,
  phone text,
  nic text,
  address text,
  department_id bigint references departments(id) on delete set null,
  position_id bigint references positions(id) on delete set null,
  work_role_id bigint references work_roles(id) on delete set null,
  salary_type salary_type not null default 'monthly',
  base_salary numeric(14,2) not null default 0,
  basic_salary numeric(14,2) not null default 0,
  joined_on date,
  joining_date date,
  allowances jsonb not null default '[]'::jsonb,
  deductions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. customers
create table customers (
  id bigserial primary key,
  customer_code text unique,
  name text,
  customer_type text not null default 'individual',
  display_name text not null,
  company_name text,
  primary_contact text,
  primary_phone text,
  secondary_phone text,
  phone text,
  email text,
  address text,
  address_line1 text,
  address_line2 text,
  city text,
  district text,
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. leads
create table leads (
  id bigserial primary key,
  lead_code text unique,
  customer_id bigint references customers(id) on delete set null,
  title text not null,
  client_name text,
  email text,
  phone text,
  project_type project_type not null default 'full_project',
  status lead_status not null default 'new',
  priority priority_level not null default 'medium',
  estimated_budget numeric(14,2),
  estimated_budget_range text,
  preferred_start_date date,
  assigned_to uuid references app_users(id) on delete set null,
  assigned_marketing_owner_id uuid references app_users(id) on delete set null,
  lead_source text,
  project_location text,
  requirement_description text,
  drawing_requirements text,
  construction_requirements text,
  additional_notes text,
  rejection_reason text,
  sent_to_qs_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. lead_communications
create table lead_communications (
  id bigserial primary key,
  lead_id bigint not null references leads(id) on delete cascade,
  type communication_type not null default 'note',
  subject text,
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 9. lead_status_logs
create table lead_status_logs (
  id bigserial primary key,
  lead_id bigint not null references leads(id) on delete cascade,
  from_status lead_status,
  to_status lead_status not null,
  changed_by uuid references app_users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- 10. estimations
create table estimations (
  id bigserial primary key,
  estimation_code text unique,
  lead_id bigint references leads(id) on delete set null,
  title text not null,
  status estimation_status not null default 'draft',
  prepared_by uuid references app_users(id) on delete set null,
  assigned_qs_engineer uuid references app_users(id) on delete set null,
  material_cost_total numeric(14,2) not null default 0,
  labour_cost_total numeric(14,2) not null default 0,
  equipment_cost_total numeric(14,2) not null default 0,
  overhead_cost_total numeric(14,2) not null default 0,
  profit_margin_pct numeric(5,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  profit_margin_value numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  notes text,
  revision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. estimation_lines
create table estimation_lines (
  id bigserial primary key,
  estimation_id bigint not null references estimations(id) on delete cascade,
  item_code text,
  description text not null,
  category text,
  unit text,
  quantity numeric(14,3) not null default 0,
  rate numeric(14,2) not null default 0,
  amount numeric(14,2) generated always as (quantity * rate) stored,
  sort_order integer not null default 0,
  remarks text
);

-- 12. projects
create table projects (
  id bigserial primary key,
  project_code text unique,
  lead_id bigint references leads(id) on delete set null,
  customer_id bigint references customers(id) on delete set null,
  name text not null,
  project_name text,
  project_type project_type not null default 'full_project',
  status project_status not null default 'created',
  start_date date,
  end_date date,
  budget numeric(14,2) not null default 0,
  budget_amount numeric(14,2) not null default 0,
  manager_id uuid references app_users(id) on delete set null,
  assigned_project_manager_id uuid references app_users(id) on delete set null,
  assigned_technical_officer_id uuid references app_users(id) on delete set null,
  boq_id bigint, -- FK set up later
  quotation_id bigint, -- FK set up later
  site_id bigint, -- FK set up later
  priority priority_level not null default 'medium',
  progress_percent numeric(5,2) not null default 0,
  cancellation_reason text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 13. quotations
create table quotations (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete set null,
  estimation_id bigint references estimations(id) on delete set null,
  project_id bigint references projects(id) on delete set null,
  boq_id bigint, -- FK set up later
  quotation_no text unique,
  quotation_code text,
  title text not null,
  status quotation_status not null default 'draft',
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  discount_value numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  tax_value numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  valid_until date,
  issue_date date not null default current_date,
  sent_at timestamptz,
  payment_terms_text text,
  notes_and_exclusions text,
  version_number integer not null default 1,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. sites
create table sites (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  name text not null,
  site_name text,
  site_code text unique,
  address text,
  supervisor_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. suppliers
create table suppliers (
  id bigserial primary key,
  name text not null,
  supplier_code text unique,
  category text,
  status supplier_status not null default 'active',
  contact_person text,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16. units_of_measure
create table units_of_measure (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  abbreviation text
);

-- 17. materials
create table materials (
  id bigserial primary key,
  sku text unique,
  material_code text unique,
  category text,
  name text not null,
  unit_id bigint references units_of_measure(id) on delete set null,
  reorder_level numeric(14,3) not null default 0,
  standard_rate numeric(14,2) not null default 0,
  standard_cost numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18. site_inventory
create table site_inventory (
  id bigserial primary key,
  site_id bigint references sites(id) on delete cascade,
  material_id bigint not null references materials(id) on delete cascade,
  quantity numeric(14,3) not null default 0,
  current_balance numeric(14,3) not null default 0,
  unique(site_id, material_id)
);

-- 19. stock_requests
create table stock_requests (
  id bigserial primary key,
  request_code text unique,
  project_id bigint references projects(id) on delete set null,
  site_id bigint references sites(id) on delete set null,
  requested_by uuid references app_users(id) on delete set null,
  status stock_request_status not null default 'draft',
  required_on date,
  required_by_date date,
  request_date date not null default current_date,
  notes text,
  remarks text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 20. stock_request_items
create table stock_request_items (
  id bigserial primary key,
  stock_request_id bigint not null references stock_requests(id) on delete cascade,
  material_id bigint references materials(id) on delete set null,
  description text not null,
  unit text,
  quantity numeric(14,3) not null default 0,
  purpose text,
  estimated_price numeric(14,2) not null default 0
);

-- 21. purchase_orders
create table purchase_orders (
  id bigserial primary key,
  po_no text unique,
  po_number text,
  supplier_id bigint references suppliers(id) on delete set null,
  stock_request_id bigint references stock_requests(id) on delete set null,
  status po_status not null default 'draft',
  order_date date not null default current_date,
  issue_date date,
  expected_date date,
  expected_delivery_date date,
  subtotal numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 22. purchase_order_items
create table purchase_order_items (
  id bigserial primary key,
  purchase_order_id bigint not null references purchase_orders(id) on delete cascade,
  material_id bigint references materials(id) on delete set null,
  description text not null,
  unit text,
  quantity numeric(14,3) not null default 0,
  rate numeric(14,2) not null default 0,
  amount numeric(14,2) generated always as (quantity * rate) stored,
  tax_amount numeric(14,2) not null default 0,
  received_quantity numeric(14,3) not null default 0
);

-- 23. goods_receipts
create table goods_receipts (
  id bigserial primary key,
  purchase_order_id bigint references purchase_orders(id) on delete set null,
  grn_no text unique,
  received_date date not null default current_date,
  received_by uuid references app_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- 24. goods_receipt_items
create table goods_receipt_items (
  id bigserial primary key,
  goods_receipt_id bigint not null references goods_receipts(id) on delete cascade,
  purchase_order_item_id bigint references purchase_order_items(id) on delete set null,
  material_id bigint references materials(id) on delete set null,
  quantity_received numeric(14,3) not null default 0,
  received_quantity numeric(14,3) not null default 0,
  damaged_quantity numeric(14,3) not null default 0
);

-- 25. stock_movements
create table stock_movements (
  id bigserial primary key,
  material_id bigint not null references materials(id) on delete cascade,
  site_id bigint references sites(id) on delete set null,
  movement_type text not null,
  quantity numeric(14,3) not null,
  reference_type text,
  reference_id bigint,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 26. attendance
create table attendance (
  id bigserial primary key,
  employee_id bigint not null references employees(id) on delete cascade,
  site_id bigint references sites(id) on delete set null,
  work_date date not null,
  attendance_date date,
  status attendance_status not null default 'present',
  check_in time,
  check_out time,
  notes text,
  unique(employee_id, work_date)
);

-- 27. leave_requests
create table leave_requests (
  id bigserial primary key,
  employee_id bigint not null references employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  status approval_status not null default 'pending',
  approved_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 28. payroll_batches
create table payroll_batches (
  id bigserial primary key,
  batch_code text unique,
  period_start date not null,
  period_end date not null,
  status payroll_status not null default 'draft',
  locked_at timestamptz,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 29. payroll_lines
create table payroll_lines (
  id bigserial primary key,
  payroll_batch_id bigint not null references payroll_batches(id) on delete cascade,
  employee_id bigint not null references employees(id) on delete cascade,
  gross_pay numeric(14,2) not null default 0,
  basic_salary numeric(14,2) not null default 0,
  attendance_adjustment numeric(14,2) not null default 0,
  allowances numeric(14,2) not null default 0,
  deductions numeric(14,2) not null default 0,
  advances_recovered numeric(14,2) not null default 0,
  payment_mode text not null default 'bank',
  net_pay numeric(14,2) not null default 0
);

-- 30. vehicles
create table vehicles (
  id bigserial primary key,
  registration_no text not null unique,
  registration_number text,
  vehicle_code text unique,
  make text,
  model text,
  category text,
  ownership vehicle_ownership not null default 'owned',
  ownership_status text,
  status vehicle_status not null default 'available',
  current_status text,
  current_meter numeric(14,2) not null default 0,
  current_meter_reading numeric(14,2),
  insurance_expiry date,
  license_expiry date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 31. vehicle_assignments
create table vehicle_assignments (
  id bigserial primary key,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  employee_id bigint references employees(id) on delete set null,
  project_id bigint references projects(id) on delete set null,
  assigned_from date not null default current_date,
  assigned_to date
);

-- 32. vehicle_fuel_logs
create table vehicle_fuel_logs (
  id bigserial primary key,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  fuel_date date not null default current_date,
  liters numeric(14,3) not null default 0,
  cost numeric(14,2) not null default 0,
  meter_reading numeric(14,2),
  station text,
  created_at timestamptz not null default now()
);

-- 33. vehicle_maintenance_logs
create table vehicle_maintenance_logs (
  id bigserial primary key,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  service_date date not null default current_date,
  description text not null,
  cost numeric(14,2) not null default 0,
  next_service_date date,
  created_at timestamptz not null default now()
);

-- 34. vehicle_meter_logs
create table vehicle_meter_logs (
  id bigserial primary key,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  meter_reading numeric(14,2) not null,
  notes text
);

-- 35. accounts
create table accounts (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  type account_type not null,
  parent_id bigint references accounts(id) on delete set null,
  is_cash_account boolean not null default false,
  is_bank_account boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 36. journal_entries
create table journal_entries (
  id bigserial primary key,
  entry_no text unique,
  reference_no text unique,
  entry_date date not null default current_date,
  transaction_date date,
  status journal_status not null default 'draft',
  memo text,
  description text,
  source source_module not null default 'system',
  project_id bigint references projects(id) on delete set null,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 37. journal_lines
create table journal_lines (
  id bigserial primary key,
  journal_entry_id bigint not null references journal_entries(id) on delete cascade,
  account_id bigint not null references accounts(id) on delete restrict,
  debit numeric(14,2) not null default 0,
  credit numeric(14,2) not null default 0,
  description text
);

-- 38. bank_accounts
create table bank_accounts (
  id bigserial primary key,
  account_name text not null,
  bank_name text,
  account_number text,
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 39. expense_categories
create table expense_categories (
  id bigserial primary key,
  name text not null unique,
  account_id bigint references accounts(id) on delete set null
);

-- 40. project_expenses
create table project_expenses (
  id bigserial primary key,
  project_id bigint references projects(id) on delete set null,
  category_id bigint references expense_categories(id) on delete set null,
  expense_date date not null default current_date,
  amount numeric(14,2) not null default 0,
  vendor_or_payee text,
  payment_method text,
  description text,
  approval_status approval_status not null default 'pending',
  is_void boolean not null default false,
  journal_entry_id bigint references journal_entries(id) on delete set null,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 41. petty_cash
create table petty_cash (
  id bigserial primary key,
  project_id bigint references projects(id) on delete set null,
  employee_id uuid references app_users(id) on delete set null,
  issued_to uuid references app_users(id) on delete set null,
  authorized_by uuid references app_users(id) on delete set null,
  amount numeric(14,2) not null default 0,
  allocated_amount numeric(14,2) not null default 0,
  settled numeric(14,2) not null default 0,
  status petty_cash_status not null default 'issued',
  notes text,
  purpose text,
  issued_at timestamptz not null default now(),
  settled_at timestamptz
);

-- 42. client_payments
create table client_payments (
  id bigserial primary key,
  project_id bigint references projects(id) on delete set null,
  customer_id bigint references customers(id) on delete set null,
  payment_date date not null default current_date,
  amount numeric(14,2) not null default 0,
  method text,
  payment_method text,
  reference_no text,
  milestone_ref text,
  notes text,
  journal_entry_id bigint references journal_entries(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 43. taxes
create table taxes (
  id bigserial primary key,
  name text not null,
  rate numeric(7,4) not null default 0,
  is_active boolean not null default true
);

-- 44. tax_entries
create table tax_entries (
  id bigserial primary key,
  tax_id bigint references taxes(id) on delete set null,
  source source_module not null default 'system',
  source_id bigint,
  taxable_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

-- 45. file_attachments
create table file_attachments (
  id bigserial primary key,
  bucket text not null default 'attachments',
  bucket_name text,
  path text not null,
  storage_path text,
  file_name text not null,
  original_name text,
  mime_type text,
  size_bytes bigint,
  file_size_bytes bigint,
  entity_type text,
  entity_id bigint,
  title text,
  is_client_visible boolean not null default false,
  uploaded_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 46. client_access_tokens
create table client_access_tokens (
  id bigserial primary key,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  customer_id bigint references customers(id) on delete cascade,
  project_id bigint references projects(id) on delete cascade,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 47. client_responses
create table client_responses (
  id bigserial primary key,
  token_id bigint references client_access_tokens(id) on delete set null,
  project_id bigint references projects(id) on delete set null,
  lead_id bigint references leads(id) on delete set null,
  quotation_id bigint references quotations(id) on delete set null,
  response text,
  response_type text,
  source text,
  message text,
  remarks text,
  created_at timestamptz not null default now()
);

-- 48. audit_logs
create table audit_logs (
  id bigserial primary key,
  actor_id uuid references app_users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 49. boq_import_mappings
create table boq_import_mappings (
  id bigserial primary key,
  name text,
  mapping jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 50. boqs
create table boqs (
  id bigserial primary key,
  project_id bigint references projects(id) on delete cascade,
  estimation_id bigint references estimations(id) on delete set null,
  quotation_id bigint references quotations(id) on delete set null,
  title text not null,
  boq_code text unique,
  version_number integer not null default 1,
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Establish cross references for boq_id and quotation_id in projects/quotations
alter table projects add constraint fk_projects_boq foreign key (boq_id) references boqs(id) on delete set null;
alter table projects add constraint fk_projects_quotation foreign key (quotation_id) references quotations(id) on delete set null;
alter table projects add constraint fk_projects_site foreign key (site_id) references sites(id) on delete set null;
alter table quotations add constraint fk_quotations_boq foreign key (boq_id) references boqs(id) on delete set null;

-- 51. boq_sections
create table boq_sections (
  id bigserial primary key,
  boq_id bigint references boqs(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0
);

-- 52. boq_items
create table boq_items (
  id bigserial primary key,
  boq_section_id bigint references boq_sections(id) on delete cascade,
  description text not null,
  unit text,
  quantity numeric(14,3) not null default 0,
  rate numeric(14,2) not null default 0
);

-- 53. boq_item_breakdowns
create table boq_item_breakdowns (
  id bigserial primary key,
  boq_item_id bigint references boq_items(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null default 0
);

-- 54. bsr_rates
create table bsr_rates (
  id bigserial primary key,
  code text unique,
  description text not null,
  unit text,
  rate numeric(14,2) not null default 0
);

-- 55. bsr_analysis
create table bsr_analysis (
  id bigserial primary key,
  bsr_rate_id bigint references bsr_rates(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

-- 56. material_aliases
create table material_aliases (
  id bigserial primary key,
  material_id bigint references materials(id) on delete cascade,
  alias text not null
);

-- 57. unit_aliases
create table unit_aliases (
  id bigserial primary key,
  unit_id bigint references units_of_measure(id) on delete cascade,
  alias text not null
);

-- 58. project_activity_logs
create table project_activity_logs (
  id bigserial primary key,
  project_id bigint references projects(id) on delete cascade,
  message text not null,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 59. project_milestones
create table project_milestones (
  id bigserial primary key,
  project_id bigint references projects(id) on delete cascade,
  title text not null,
  amount_due numeric(14,2) not null default 0,
  due_date date,
  completed_at timestamptz
);

-- 60. project_status_logs
create table project_status_logs (
  id bigserial primary key,
  project_id bigint references projects(id) on delete cascade,
  from_status project_status,
  to_status project_status not null,
  changed_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 61. project_team_assignments
create table project_team_assignments (
  id bigserial primary key,
  project_id bigint references projects(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  role text,
  unique(project_id, user_id)
);

-- 62. site_progress_updates
create table site_progress_updates (
  id bigserial primary key,
  site_id bigint references sites(id) on delete cascade,
  project_id bigint references projects(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0,
  percent_complete numeric(5,2) not null default 0,
  notes text,
  work_summary text,
  title text,
  client_visible boolean not null default false,
  update_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 63. purchase_approvals
create table purchase_approvals (
  id bigserial primary key,
  purchase_order_id bigint references purchase_orders(id) on delete cascade,
  status approval_status not null default 'pending',
  approved_by uuid references app_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- 64. supplier_performance
create table supplier_performance (
  id bigserial primary key,
  supplier_id bigint references suppliers(id) on delete cascade,
  rating numeric(3,2),
  average_rating numeric(3,2),
  total_orders integer not null default 0,
  on_time_deliveries integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- 65. employee_site_assignments
create table employee_site_assignments (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  site_id bigint references sites(id) on delete cascade,
  assigned_from date not null default current_date,
  from_date date,
  assigned_to date,
  to_date date,
  assigned_by uuid references app_users(id) on delete set null
);

-- Recreate trigger application logic
do $$
declare
  t_name text;
begin
  for t_name in select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'
  loop
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' and table_name = t_name and column_name = 'updated_at'
    ) then
      execute format('create trigger trg_%I_updated_at before update on %I for each row execute function set_updated_at()', t_name, t_name);
    end if;
  end loop;
end $$;

-- Indexes for performance
create index if not exists idx_app_users_role on app_users(role);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_stock_requests_status on stock_requests(status);
create index if not exists idx_purchase_orders_status on purchase_orders(status);
create index if not exists idx_file_attachments_entity on file_attachments(entity_type, entity_id);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- Enable RLS and add public permissive policies
do $$
declare
  t_name text;
begin
  for t_name in select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'
  loop
    execute format('alter table %I enable row level security', t_name);
    execute format('drop policy if exists "Allow public read/write" on %I', t_name);
    execute format('create policy "Allow public read/write" on %I for all using (true) with check (true)', t_name);
  end loop;
end $$;

-- Seed lookup values
insert into departments (name, code) values
  ('Administration','ADMIN'),
  ('Marketing','MKT'),
  ('Quantity Surveying','QS'),
  ('Projects','PRJ'),
  ('Stores','STK'),
  ('Finance','FIN'),
  ('Human Resources','HR'),
  ('Vehicle Management','VEH')
on conflict (name) do nothing;

insert into units_of_measure (code, name, abbreviation) values
  ('nos','Numbers','nos'),
  ('m','Meter','m'),
  ('m2','Square meter','m2'),
  ('m3','Cubic meter','m3'),
  ('kg','Kilogram','kg'),
  ('bag','Bag','bag'),
  ('l','Liter','l'),
  ('sheets','Sheets','sheets'),
  ('lengths','Lengths','lengths'),
  ('rolls','Rolls','rolls'),
  ('lot','Lot','lot')
on conflict (code) do nothing;

insert into taxes (name, rate) values
  ('VAT', 18.0000),
  ('Zero rated', 0.0000);

insert into accounts (code, name, type, is_cash_account, is_bank_account) values
  ('1000','Cash and Bank','asset', true, false),
  ('1100','Cash Account','asset', true, false),
  ('1200','Bank Account','asset', false, true),
  ('1300','Accounts Receivable','asset', false, false),
  ('2000','Accounts Payable','liability', false, false),
  ('3000','Owner Equity','equity', false, false),
  ('4000','Project Income','income', false, false),
  ('5000','Project Expenses','expense', false, false),
  ('5100','Material Expenses','expense', false, false),
  ('5200','Labour Expenses','expense', false, false),
  ('5300','Transport Expenses','expense', false, false),
  ('5400','Subcontract Expenses','expense', false, false),
  ('5500','Miscellaneous Expenses','expense', false, false)
on conflict (code) do nothing;

insert into expense_categories (name, account_id)
select 'Material', id from accounts where code = '5100'
union all select 'Labour', id from accounts where code = '5200'
union all select 'Transport', id from accounts where code = '5300'
union all select 'Subcontract', id from accounts where code = '5400'
union all select 'Miscellaneous', id from accounts where code = '5500'
on conflict (name) do nothing;
