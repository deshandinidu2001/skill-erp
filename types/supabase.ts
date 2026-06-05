export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type AnyRow = { id?: string | number; [key: string]: any };

type Table<Row extends Record<string, any> = AnyRow> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      accounts: Table;
      app_users: Table<{
        id: string;
        employee_code?: string | null;
        full_name: string;
        role: Database["public"]["Enums"]["user_role"];
        department_id?: number | null;
        is_active: boolean;
        last_login_at?: string | null;
        email?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
      }>;
      attendance: Table;
      audit_logs: Table;
      bank_accounts: Table;
      boq_import_mappings: Table;
      boq_item_breakdowns: Table;
      boq_items: Table;
      boq_sections: Table;
      boqs: Table;
      bsr_analysis: Table;
      bsr_rates: Table;
      client_access_tokens: Table;
      client_payments: Table;
      client_responses: Table;
      customers: Table;
      departments: Table;
      employee_site_assignments: Table;
      employees: Table;
      estimation_lines: Table;
      estimations: Table;
      expense_categories: Table;
      file_attachments: Table;
      goods_receipt_items: Table;
      goods_receipts: Table;
      journal_entries: Table;
      journal_lines: Table;
      lead_communications: Table;
      lead_status_logs: Table;
      leads: Table;
      leave_requests: Table;
      material_aliases: Table;
      materials: Table;
      payroll_batches: Table;
      payroll_lines: Table;
      petty_cash: Table;
      positions: Table;
      project_activity_logs: Table;
      project_expenses: Table;
      project_milestones: Table;
      project_status_logs: Table;
      project_team_assignments: Table;
      projects: Table;
      purchase_approvals: Table;
      purchase_order_items: Table;
      purchase_orders: Table;
      site_inventory: Table;
      site_progress_updates: Table;
      sites: Table;
      stock_movements: Table;
      stock_request_items: Table;
      stock_requests: Table;
      supplier_performance: Table;
      suppliers: Table;
      tax_entries: Table;
      taxes: Table;
      unit_aliases: Table;
      units_of_measure: Table;
      vehicle_assignments: Table;
      vehicle_fuel_logs: Table;
      vehicle_maintenance_logs: Table;
      vehicle_meter_logs: Table;
      vehicles: Table;
      work_roles: Table;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_type: "asset" | "liability" | "income" | "expense" | "equity";
      approval_status: "pending" | "approved" | "rejected";
      attendance_status: "present" | "absent" | "leave" | "unpaid";
      communication_type: "call" | "email" | "meeting" | "whatsapp" | "note";
      estimation_status: "draft" | "in_progress" | "ready_for_quotation" | "quotation_submitted" | "revision_requested" | "approved_baseline";
      journal_status: "draft" | "posted" | "reversed";
      lead_status: "new" | "under_review" | "qs_estimation_pending" | "quotation_submitted" | "client_discussion" | "approved" | "rejected" | "closed";
      payroll_status: "draft" | "prepared" | "approved" | "processed" | "paid" | "locked" | "cancelled";
      petty_cash_status: "issued" | "pending" | "settled";
      po_status: "draft" | "pending_approval" | "approved" | "issued" | "partially_received" | "fully_received" | "cancelled" | "closed";
      priority_level: "low" | "medium" | "high" | "urgent";
      project_status: "draft" | "created" | "assigned" | "in_progress" | "on_hold" | "completed" | "cancelled" | "closed";
      project_type: "drawing_only" | "2d_3d" | "construction_only" | "full_project";
      quotation_status: "draft" | "under_review" | "submitted" | "client_sent" | "revision_requested" | "approved" | "rejected" | "expired" | "archived";
      salary_type: "monthly" | "daily" | "hourly";
      source_module: "project_expense" | "petty_cash" | "client_payment" | "system";
      stock_request_status: "draft" | "submitted" | "qs_review" | "approved" | "rejected" | "converted_to_po" | "partially_fulfilled" | "completed" | "cancelled";
      supplier_status: "active" | "inactive";
      user_role:
        | "super_admin"
        | "hr_manager"
        | "hr_executive"
        | "marketing_manager"
        | "marketing_executive"
        | "qs_manager"
        | "qs_engineer"
        | "stock_manager"
        | "store_keeper"
        | "project_manager"
        | "technical_officer"
        | "accountant"
        | "finance_manager"
        | "vehicle_manager"
        | "viewer"
        | "client_user";
      vehicle_ownership: "owned" | "leased";
      vehicle_status: "available" | "assigned" | "under_maintenance" | "unavailable" | "retired";
    };
    CompositeTypes: Record<string, never>;
  };
};
