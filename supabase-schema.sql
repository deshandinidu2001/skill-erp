-- Skill ERP initial Supabase schema
-- Paste this whole file into Supabase SQL Editor and run it once on a new project.

create extension if not exists "pgcrypto";

do $$
begin
  create type user_role as enum ('super_admin','hr_manager','hr_executive','marketing_manager','marketing_executive','qs_manager','qs_engineer','stock_manager','store_keeper','project_manager','technical_officer','accountant','finance_manager','vehicle_manager','viewer','client_user');
exception when duplicate_object then null; end $$;

do $$
begin
  create type project_type as enum ('drawing_only','2d_3d','construction_only','full_project');
exception when duplicate_object then null; end $$;

do $$
begin
  create type lead_status as enum ('new','under_review','qs_estimation_pending','quotation_submitted','client_discussion','approved','rejected','closed');
exception when duplicate_object then null; end $$;

do $$
begin
  create type priority_level as enum ('low','medium','high','urgent');
exception when duplicate_object then null; end $$;

do $$
begin
  create type estimation_status as enum ('draft','in_progress','ready_for_quotation','quotation_submitted','revision_requested','approved_baseline');
exception when duplicate_object then null; end $$;

do $$
begin
  create type quotation_status as enum ('draft','under_review','submitted','client_sent','revision_requested','approved','rejected','expired','archived');
exception when duplicate_object then null; end $$;

do $$
begin
  create type project_status as enum ('draft','created','assigned','in_progress','on_hold','completed','cancelled','closed');
exception when duplicate_object then null; end $$;

do $$
begin
  create type stock_request_status as enum ('draft','submitted','qs_review','approved','rejected','converted_to_po','partially_fulfilled','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$
begin
  create type approval_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$
begin
  create type po_status as enum ('draft','pending_approval','approved','issued','partially_received','fully_received','cancelled','closed');
exception when duplicate_object then null; end $$;

do $$
begin
  create type supplier_status as enum ('active','inactive');
exception when duplicate_object then null; end $$;

do $$
begin
  create type salary_type as enum ('monthly','daily','hourly');
exception when duplicate_object then null; end $$;

do $$
begin
  create type attendance_status as enum ('present','absent','leave','unpaid');
exception when duplicate_object then null; end $$;

do $$
begin
  create type payroll_status as enum ('draft','prepared','approved','processed','paid','locked','cancelled');
exception when duplicate_object then null; end $$;

do $$
begin
  create type vehicle_ownership as enum ('owned','leased');
exception when duplicate_object then null; end $$;

do $$
begin
  create type vehicle_status as enum ('available','assigned','under_maintenance','unavailable','retired');
exception when duplicate_object then null; end $$;

do $$
begin
  create type account_type as enum ('asset','liability','income','expense','equity');
exception when duplicate_object then null; end $$;

do $$
begin
  create type journal_status as enum ('draft','posted','reversed');
exception when duplicate_object then null; end $$;

do $$
begin
  create type petty_cash_status as enum ('issued','pending','settled');
exception when duplicate_object then null; end $$;

do $$
begin
  create type source_module as enum ('project_expense','petty_cash','client_payment','system');
exception when duplicate_object then null; end $$;

do $$
begin
  create type communication_type as enum ('call','email','meeting','whatsapp','note');
exception when duplicate_object then null; end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists departments (
  id bigserial primary key,
  name text not null unique,
  code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists positions (
  id bigserial primary key,
  department_id bigint references departments(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work_roles (
  id bigserial primary key,
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
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

create table if not exists employees (
  id bigserial primary key,
  user_id uuid references app_users(id) on delete set null,
  employee_code text not null unique,
  full_name text not null,
  email text,
  phone text,
  department_id bigint references departments(id) on delete set null,
  position_id bigint references positions(id) on delete set null,
  salary_type salary_type not null default 'monthly',
  base_salary numeric(14,2) not null default 0,
  joined_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id bigserial primary key,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leads (
  id bigserial primary key,
  customer_id bigint references customers(id) on delete set null,
  title text not null,
  client_name text,
  email text,
  phone text,
  project_type project_type not null default 'full_project',
  status lead_status not null default 'new',
  priority priority_level not null default 'medium',
  estimated_budget numeric(14,2),
  assigned_to uuid references app_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_communications (
  id bigserial primary key,
  lead_id bigint not null references leads(id) on delete cascade,
  type communication_type not null default 'note',
  subject text,
  notes text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists lead_status_logs (
  id bigserial primary key,
  lead_id bigint not null references leads(id) on delete cascade,
  from_status lead_status,
  to_status lead_status not null,
  changed_by uuid references app_users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists estimations (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete set null,
  title text not null,
  status estimation_status not null default 'draft',
  prepared_by uuid references app_users(id) on delete set null,
  subtotal numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists estimation_lines (
  id bigserial primary key,
  estimation_id bigint not null references estimations(id) on delete cascade,
  item_code text,
  description text not null,
  unit text,
  quantity numeric(14,3) not null default 0,
  rate numeric(14,2) not null default 0,
  amount numeric(14,2) generated always as (quantity * rate) stored,
  sort_order integer not null default 0
);

create table if not exists projects (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete set null,
  customer_id bigint references customers(id) on delete set null,
  name text not null,
  project_type project_type not null default 'full_project',
  status project_status not null default 'created',
  start_date date,
  end_date date,
  budget numeric(14,2) not null default 0,
  manager_id uuid references app_users(id) on delete set null,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quotations (
  id bigserial primary key,
  lead_id bigint references leads(id) on delete set null,
  estimation_id bigint references estimations(id) on delete set null,
  project_id bigint references projects(id) on delete set null,
  quotation_no text unique,
  title text not null,
  status quotation_status not null default 'draft',
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  valid_until date,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sites (
  id bigserial primary key,
  project_id bigint not null references projects(id) on delete cascade,
  name text not null,
  address text,
  supervisor_id uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id bigserial primary key,
  name text not null,
  status supplier_status not null default 'active',
  contact_person text,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists units_of_measure (
  id bigserial primary key,
  code text not null unique,
  name text not null
);

create table if not exists materials (
  id bigserial primary key,
  sku text unique,
  name text not null,
  unit_id bigint references units_of_measure(id) on delete set null,
  reorder_level numeric(14,3) not null default 0,
  standard_rate numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_inventory (
  id bigserial primary key,
  site_id bigint references sites(id) on delete cascade,
  material_id bigint not null references materials(id) on delete cascade,
  quantity numeric(14,3) not null default 0,
  unique(site_id, material_id)
);

create table if not exists stock_requests (
  id bigserial primary key,
  project_id bigint references projects(id) on delete set null,
  site_id bigint references sites(id) on delete set null,
  requested_by uuid references app_users(id) on delete set null,
  status stock_request_status not null default 'draft',
  required_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_request_items (
  id bigserial primary key,
  stock_request_id bigint not null references stock_requests(id) on delete cascade,
  material_id bigint references materials(id) on delete set null,
  description text not null,
  unit text,
  quantity numeric(14,3) not null default 0
);

create table if not exists purchase_orders (
  id bigserial primary key,
  po_no text unique,
  supplier_id bigint references suppliers(id) on delete set null,
  stock_request_id bigint references stock_requests(id) on delete set null,
  status po_status not null default 'draft',
  order_date date not null default current_date,
  expected_date date,
  subtotal numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id bigserial primary key,
  purchase_order_id bigint not null references purchase_orders(id) on delete cascade,
  material_id bigint references materials(id) on delete set null,
  description text not null,
  unit text,
  quantity numeric(14,3) not null default 0,
  rate numeric(14,2) not null default 0,
  amount numeric(14,2) generated always as (quantity * rate) stored
);

create table if not exists goods_receipts (
  id bigserial primary key,
  purchase_order_id bigint references purchase_orders(id) on delete set null,
  grn_no text unique,
  received_date date not null default current_date,
  received_by uuid references app_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists goods_receipt_items (
  id bigserial primary key,
  goods_receipt_id bigint not null references goods_receipts(id) on delete cascade,
  purchase_order_item_id bigint references purchase_order_items(id) on delete set null,
  material_id bigint references materials(id) on delete set null,
  quantity_received numeric(14,3) not null default 0
);

create table if not exists stock_movements (
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

create table if not exists attendance (
  id bigserial primary key,
  employee_id bigint not null references employees(id) on delete cascade,
  work_date date not null,
  status attendance_status not null default 'present',
  check_in time,
  check_out time,
  notes text,
  unique(employee_id, work_date)
);

create table if not exists leave_requests (
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

create table if not exists payroll_batches (
  id bigserial primary key,
  period_start date not null,
  period_end date not null,
  status payroll_status not null default 'draft',
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payroll_lines (
  id bigserial primary key,
  payroll_batch_id bigint not null references payroll_batches(id) on delete cascade,
  employee_id bigint not null references employees(id) on delete cascade,
  gross_pay numeric(14,2) not null default 0,
  deductions numeric(14,2) not null default 0,
  net_pay numeric(14,2) not null default 0
);

create table if not exists vehicles (
  id bigserial primary key,
  registration_no text not null unique,
  make text,
  model text,
  ownership vehicle_ownership not null default 'owned',
  status vehicle_status not null default 'available',
  current_meter numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicle_assignments (
  id bigserial primary key,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  employee_id bigint references employees(id) on delete set null,
  project_id bigint references projects(id) on delete set null,
  assigned_from date not null default current_date,
  assigned_to date
);

create table if not exists vehicle_fuel_logs (
  id bigserial primary key,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  fuel_date date not null default current_date,
  liters numeric(14,3) not null default 0,
  cost numeric(14,2) not null default 0,
  meter_reading numeric(14,2),
  created_at timestamptz not null default now()
);

create table if not exists vehicle_maintenance_logs (
  id bigserial primary key,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  service_date date not null default current_date,
  description text not null,
  cost numeric(14,2) not null default 0,
  next_service_date date,
  created_at timestamptz not null default now()
);

create table if not exists vehicle_meter_logs (
  id bigserial primary key,
  vehicle_id bigint not null references vehicles(id) on delete cascade,
  logged_at timestamptz not null default now(),
  meter_reading numeric(14,2) not null,
  notes text
);

create table if not exists accounts (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  type account_type not null,
  parent_id bigint references accounts(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists journal_entries (
  id bigserial primary key,
  entry_no text unique,
  entry_date date not null default current_date,
  status journal_status not null default 'draft',
  memo text,
  source source_module not null default 'system',
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists journal_lines (
  id bigserial primary key,
  journal_entry_id bigint not null references journal_entries(id) on delete cascade,
  account_id bigint not null references accounts(id) on delete restrict,
  debit numeric(14,2) not null default 0,
  credit numeric(14,2) not null default 0,
  description text
);

create table if not exists bank_accounts (
  id bigserial primary key,
  account_name text not null,
  bank_name text,
  account_number text,
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expense_categories (
  id bigserial primary key,
  name text not null unique,
  account_id bigint references accounts(id) on delete set null
);

create table if not exists project_expenses (
  id bigserial primary key,
  project_id bigint references projects(id) on delete set null,
  category_id bigint references expense_categories(id) on delete set null,
  expense_date date not null default current_date,
  amount numeric(14,2) not null default 0,
  description text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists petty_cash (
  id bigserial primary key,
  issued_to uuid references app_users(id) on delete set null,
  amount numeric(14,2) not null default 0,
  status petty_cash_status not null default 'issued',
  purpose text,
  issued_at timestamptz not null default now(),
  settled_at timestamptz
);

create table if not exists client_payments (
  id bigserial primary key,
  project_id bigint references projects(id) on delete set null,
  customer_id bigint references customers(id) on delete set null,
  payment_date date not null default current_date,
  amount numeric(14,2) not null default 0,
  method text,
  reference_no text,
  created_at timestamptz not null default now()
);

create table if not exists taxes (
  id bigserial primary key,
  name text not null,
  rate numeric(7,4) not null default 0,
  is_active boolean not null default true
);

create table if not exists tax_entries (
  id bigserial primary key,
  tax_id bigint references taxes(id) on delete set null,
  source source_module not null default 'system',
  source_id bigint,
  taxable_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists file_attachments (
  id bigserial primary key,
  bucket text not null default 'attachments',
  path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  entity_type text,
  entity_id bigint,
  uploaded_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists client_access_tokens (
  id bigserial primary key,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  customer_id bigint references customers(id) on delete cascade,
  project_id bigint references projects(id) on delete cascade,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists client_responses (
  id bigserial primary key,
  token_id bigint references client_access_tokens(id) on delete set null,
  project_id bigint references projects(id) on delete set null,
  response_type text not null,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  actor_id uuid references app_users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Compatibility/support tables used by the app type map.
create table if not exists boq_import_mappings (id bigserial primary key, name text, mapping jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists boqs (id bigserial primary key, project_id bigint references projects(id) on delete cascade, title text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists boq_sections (id bigserial primary key, boq_id bigint references boqs(id) on delete cascade, title text not null, sort_order integer not null default 0);
create table if not exists boq_items (id bigserial primary key, boq_section_id bigint references boq_sections(id) on delete cascade, description text not null, unit text, quantity numeric(14,3) not null default 0, rate numeric(14,2) not null default 0);
create table if not exists boq_item_breakdowns (id bigserial primary key, boq_item_id bigint references boq_items(id) on delete cascade, description text not null, amount numeric(14,2) not null default 0);
create table if not exists bsr_rates (id bigserial primary key, code text unique, description text not null, unit text, rate numeric(14,2) not null default 0);
create table if not exists bsr_analysis (id bigserial primary key, bsr_rate_id bigint references bsr_rates(id) on delete cascade, data jsonb not null default '{}'::jsonb);
create table if not exists material_aliases (id bigserial primary key, material_id bigint references materials(id) on delete cascade, alias text not null);
create table if not exists unit_aliases (id bigserial primary key, unit_id bigint references units_of_measure(id) on delete cascade, alias text not null);
create table if not exists project_activity_logs (id bigserial primary key, project_id bigint references projects(id) on delete cascade, message text not null, created_by uuid references app_users(id) on delete set null, created_at timestamptz not null default now());
create table if not exists project_milestones (id bigserial primary key, project_id bigint references projects(id) on delete cascade, title text not null, due_date date, completed_at timestamptz);
create table if not exists project_status_logs (id bigserial primary key, project_id bigint references projects(id) on delete cascade, from_status project_status, to_status project_status not null, changed_by uuid references app_users(id) on delete set null, created_at timestamptz not null default now());
create table if not exists project_team_assignments (id bigserial primary key, project_id bigint references projects(id) on delete cascade, user_id uuid references app_users(id) on delete cascade, role text, unique(project_id, user_id));
create table if not exists site_progress_updates (id bigserial primary key, site_id bigint references sites(id) on delete cascade, progress_percent numeric(5,2) not null default 0, notes text, created_at timestamptz not null default now());
create table if not exists purchase_approvals (id bigserial primary key, purchase_order_id bigint references purchase_orders(id) on delete cascade, status approval_status not null default 'pending', approved_by uuid references app_users(id) on delete set null, notes text, created_at timestamptz not null default now());
create table if not exists supplier_performance (id bigserial primary key, supplier_id bigint references suppliers(id) on delete cascade, rating numeric(3,2), notes text, created_at timestamptz not null default now());
create table if not exists employee_site_assignments (id bigserial primary key, employee_id bigint references employees(id) on delete cascade, site_id bigint references sites(id) on delete cascade, assigned_from date not null default current_date, assigned_to date);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'departments','positions','work_roles','app_users','employees','customers','leads','estimations','projects','quotations','sites','suppliers','materials',
    'stock_requests','purchase_orders','leave_requests','payroll_batches','vehicles','accounts','journal_entries','bank_accounts','boqs'
  ]
  loop
    execute format('drop trigger if exists trg_%I_updated_at on %I', table_name, table_name);
    execute format('create trigger trg_%I_updated_at before update on %I for each row execute function set_updated_at()', table_name, table_name);
  end loop;
end $$;

create index if not exists idx_app_users_role on app_users(role);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_stock_requests_status on stock_requests(status);
create index if not exists idx_purchase_orders_status on purchase_orders(status);
create index if not exists idx_file_attachments_entity on file_attachments(entity_type, entity_id);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);

alter table departments enable row level security;
alter table positions enable row level security;
alter table work_roles enable row level security;
alter table app_users enable row level security;
alter table employees enable row level security;
alter table customers enable row level security;
alter table leads enable row level security;
alter table lead_communications enable row level security;
alter table lead_status_logs enable row level security;
alter table estimations enable row level security;
alter table estimation_lines enable row level security;
alter table quotations enable row level security;
alter table projects enable row level security;
alter table sites enable row level security;
alter table suppliers enable row level security;
alter table units_of_measure enable row level security;
alter table materials enable row level security;
alter table site_inventory enable row level security;
alter table stock_requests enable row level security;
alter table stock_request_items enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table goods_receipts enable row level security;
alter table goods_receipt_items enable row level security;
alter table stock_movements enable row level security;
alter table attendance enable row level security;
alter table leave_requests enable row level security;
alter table payroll_batches enable row level security;
alter table payroll_lines enable row level security;
alter table vehicles enable row level security;
alter table vehicle_assignments enable row level security;
alter table vehicle_fuel_logs enable row level security;
alter table vehicle_maintenance_logs enable row level security;
alter table vehicle_meter_logs enable row level security;
alter table accounts enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;
alter table bank_accounts enable row level security;
alter table expense_categories enable row level security;
alter table project_expenses enable row level security;
alter table petty_cash enable row level security;
alter table client_payments enable row level security;
alter table taxes enable row level security;
alter table tax_entries enable row level security;
alter table file_attachments enable row level security;
alter table client_access_tokens enable row level security;
alter table client_responses enable row level security;
alter table audit_logs enable row level security;

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

insert into units_of_measure (code, name) values
  ('nos','Numbers'),
  ('m','Meter'),
  ('m2','Square meter'),
  ('m3','Cubic meter'),
  ('kg','Kilogram'),
  ('bag','Bag'),
  ('l','Liter')
on conflict (code) do nothing;

insert into taxes (name, rate) values
  ('VAT', 18.0000),
  ('Zero rated', 0.0000);

insert into accounts (code, name, type) values
  ('1000','Cash and Bank','asset'),
  ('1100','Accounts Receivable','asset'),
  ('2000','Accounts Payable','liability'),
  ('4000','Project Income','income'),
  ('5000','Project Expenses','expense'),
  ('3000','Owner Equity','equity')
on conflict (code) do nothing;

insert into expense_categories (name)
values ('Materials'), ('Labour'), ('Transport'), ('Subcontract'), ('Other')
on conflict (name) do nothing;

-- Create Supabase Auth users separately, then insert matching app_users rows using auth.users.id.
-- Example:
-- insert into app_users (id, full_name, email, role)
-- values ('AUTH_USER_UUID_HERE', 'Admin User', 'admin@example.com', 'super_admin');
