import type {
  Account,
  AttendanceRecord,
  ClientPayment,
  Employee,
  Estimation,
  InventoryBalance,
  Lead,
  PayrollBatch,
  Project,
  ProjectExpense,
  PurchaseOrder,
  Quotation,
  StockItem,
  StockRequest,
  Supplier,
  Vehicle,
} from "@/types";
import { asNumber, getRelated, toDate } from "@/services/api/common";

type Row = Record<string, unknown>;

const projectTypeMap: Record<string, Lead["projectType"]> = {
  drawing_only: "DRAWING_ONLY",
  "2d_3d": "2D_3D",
  construction_only: "CONSTRUCTION_ONLY",
  full_project: "FULL_PROJECT",
};

const priorityMap: Record<string, Lead["priority"]> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  urgent: "URGENT",
};

export function mapLead(row: Row): Lead {
  const customer = getRelated(row, "customers");
  const owner = getRelated(row, "app_users");
  return {
    id: String(row.id),
    code: String(row.lead_code ?? ""),
    customerId: String(row.customer_id ?? ""),
    customerName: String(customer?.display_name ?? ""),
    phone: String(customer?.primary_phone ?? ""),
    email: customer?.email ? String(customer.email) : undefined,
    alternatePhone: customer?.secondary_phone ? String(customer.secondary_phone) : undefined,
    companyName: customer?.company_name ? String(customer.company_name) : undefined,
    title: String(row.requirement_description ?? row.project_location ?? ""),
    value: 0,
    status: String(row.status ?? "new") as Lead["status"],
    owner: String(owner?.full_name ?? ""),
    ownerId: row.assigned_marketing_owner_id ? String(row.assigned_marketing_owner_id) : undefined,
    source: String(row.lead_source ?? ""),
    location: String(customer?.city ?? customer?.district ?? ""),
    projectLocation: String(row.project_location ?? ""),
    projectType: projectTypeMap[String(row.project_type)] ?? "FULL_PROJECT",
    estimatedBudgetRange: row.estimated_budget_range ? String(row.estimated_budget_range) : undefined,
    preferredStartDate: toDate(row.preferred_start_date),
    urgency: String(row.priority ?? ""),
    priority: priorityMap[String(row.priority)] ?? "MEDIUM",
    tags: [],
    requirementDescription: String(row.requirement_description ?? ""),
    drawingRequirements: row.drawing_requirements ? String(row.drawing_requirements) : undefined,
    constructionRequirements: row.construction_requirements ? String(row.construction_requirements) : undefined,
    additionalNotes: row.additional_notes ? String(row.additional_notes) : undefined,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    rejectedReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
  };
}

export function mapEstimation(row: Row): Estimation {
  const lead = getRelated(row, "leads");
  const customer = lead ? getRelated(lead, "customers") : undefined;
  const engineer = getRelated(row, "app_users");
  return {
    id: String(row.id),
    code: String(row.estimation_code ?? ""),
    leadId: String(row.lead_id ?? ""),
    leadCode: String(lead?.lead_code ?? ""),
    leadTitle: String(lead?.requirement_description ?? ""),
    customerName: String(customer?.display_name ?? ""),
    projectType: String(lead?.project_type ?? ""),
    materialCostTotal: asNumber(row.material_cost_total),
    labourCostTotal: asNumber(row.labour_cost_total),
    equipmentCostTotal: asNumber(row.equipment_cost_total),
    overheadCostTotal: asNumber(row.overhead_cost_total),
    profitMarginPercent: asNumber(row.profit_margin_pct),
    subtotal: asNumber(row.subtotal),
    profitMarginValue: asNumber(row.profit_margin_value),
    grandTotal: asNumber(row.grand_total),
    amount: asNumber(row.grand_total),
    status: String(row.status ?? "draft") as Estimation["status"],
    estimator: String(engineer?.full_name ?? ""),
    engineerId: row.assigned_qs_engineer ? String(row.assigned_qs_engineer) : undefined,
    lines: [],
    boqLines: [],
    notes: row.notes ? String(row.notes) : undefined,
    updatedAt: toDate(row.updated_at),
  };
}

export function mapQuotation(row: Row): Quotation {
  const lead = getRelated(row, "leads");
  const customer = lead ? getRelated(lead, "customers") : undefined;
  const owner = getRelated(row, "app_users");
  return {
    id: String(row.id),
    code: String(row.quotation_code ?? ""),
    version: asNumber(row.version_number, 1),
    leadId: String(row.lead_id ?? ""),
    leadCode: String(lead?.lead_code ?? ""),
    customerName: String(customer?.display_name ?? ""),
    owner: String(owner?.full_name ?? ""),
    grandTotal: asNumber(row.grand_total),
    amount: asNumber(row.grand_total),
    status: String(row.status ?? "draft") as Quotation["status"],
    sentDate: row.sent_at ? toDate(row.sent_at) : undefined,
    validUntil: toDate(row.valid_until),
    active: String(row.status) !== "archived",
    paymentTerms: String(row.payment_terms_text ?? ""),
    boqLines: [],
    attachments: [],
    clientResponses: [],
  };
}

export function mapProject(row: Row): Project {
  const customer = getRelated(row, "customers");
  const manager = getRelated(row, "app_users");
  const site = getRelated(row, "sites");
  const quotation = getRelated(row, "quotations");
  return {
    id: String(row.id),
    project_id: String(row.id),
    code: String(row.project_code ?? ""),
    name: String(row.project_name ?? ""),
    customerId: row.client_id ? String(row.client_id) : undefined,
    client: String(customer?.display_name ?? ""),
    customer: String(customer?.display_name ?? ""),
    status: String(row.status ?? "draft") as Project["status"],
    manager: String(manager?.full_name ?? ""),
    managerId: row.assigned_project_manager_id ? String(row.assigned_project_manager_id) : undefined,
    progress: asNumber(row.progress_percent),
    site: String(site?.site_code ?? site?.site_name ?? ""),
    siteName: String(site?.site_name ?? ""),
    startDate: toDate(row.start_date),
    endDate: toDate(row.end_date),
    budget: asNumber(row.budget_amount),
    quotationId: row.quotation_id ? String(row.quotation_id) : undefined,
    quotationCode: quotation?.quotation_code ? String(quotation.quotation_code) : undefined,
    quotationVersion: quotation?.version_number ? asNumber(quotation.version_number) : undefined,
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : undefined,
  };
}

export function mapEmployee(row: Row): Employee {
  const department = getRelated(row, "departments");
  const position = getRelated(row, "positions");
  const workRole = getRelated(row, "work_roles");
  return {
    id: String(row.id),
    code: String(row.employee_code ?? ""),
    name: String(row.full_name ?? ""),
    fullName: String(row.full_name ?? ""),
    nic: row.nic ? String(row.nic) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    email: row.email ? String(row.email) : undefined,
    address: row.address ? String(row.address) : undefined,
    department: String(department?.name ?? ""),
    position: position?.name ? String(position.name) : undefined,
    role: String(workRole?.name ?? position?.name ?? ""),
    workRole: workRole?.name ? String(workRole.name) : undefined,
    joiningDate: toDate(row.joining_date),
    salaryType: row.salary_type as Employee["salaryType"],
    basicSalary: asNumber(row.basic_salary),
    allowances: Array.isArray(row.allowances) ? (row.allowances as Employee["allowances"]) : [],
    deductions: Array.isArray(row.deductions) ? (row.deductions as Employee["deductions"]) : [],
    status: row.is_active === false ? "inactive" : "active",
  };
}

export function mapVehicle(row: Row): Vehicle {
  const status = String(row.current_status ?? "available");
  return {
    id: String(row.id),
    code: String(row.vehicle_code ?? ""),
    vehicleCode: String(row.vehicle_code ?? ""),
    registrationNo: String(row.registration_number ?? ""),
    registrationNumber: String(row.registration_number ?? ""),
    type: String(row.category ?? ""),
    category: String(row.category ?? "other") as Vehicle["category"],
    ownershipStatus: row.ownership_status as Vehicle["ownershipStatus"],
    status: status === "under_maintenance" ? "maintenance" : (status as Vehicle["status"]),
    meterReading: asNumber(row.current_meter_reading),
    insuranceExpiry: toDate(row.insurance_expiry),
    licenseExpiry: toDate(row.license_expiry),
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapStockItem(row: Row): StockItem {
  const unit = getRelated(row, "units_of_measure");
  const supplier = getRelated(row, "suppliers");
  return {
    id: String(row.id),
    code: String(row.material_code ?? ""),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    unit: String(unit?.abbreviation ?? ""),
    standardCost: asNumber(row.standard_cost),
    preferredSupplier: String(supplier?.name ?? ""),
    status: row.is_active === false ? "inactive" : "active",
  };
}

export function mapSupplier(row: Row): Supplier {
  const performance = getRelated(row, "supplier_performance");
  return {
    id: String(row.id),
    code: String(row.supplier_code ?? ""),
    name: String(row.name ?? ""),
    contact: String(row.contact_person ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    category: String(row.category ?? ""),
    rating: asNumber(performance?.average_rating),
    status: String(row.status ?? "active") as Supplier["status"],
    onTimePercent: asNumber(performance?.total_orders) > 0 ? Math.round((asNumber(performance?.on_time_deliveries) / asNumber(performance?.total_orders)) * 100) : 0,
    orderHistory: [],
  };
}

export function mapStockRequest(row: Row): StockRequest {
  const project = getRelated(row, "projects");
  const site = getRelated(row, "sites");
  const requester = getRelated(row, "app_users");
  const items = Array.isArray(row.stock_request_items) ? (row.stock_request_items as Row[]) : [];
  return {
    id: String(row.id),
    project_id: String(row.project_id ?? ""),
    code: String(row.request_code ?? ""),
    project: String(project?.project_name ?? ""),
    site: String(site?.site_name ?? site?.site_code ?? ""),
    requestDate: toDate(row.request_date),
    requiredByDate: toDate(row.required_by_date),
    requester: String(requester?.full_name ?? ""),
    requestedBy: String(requester?.full_name ?? ""),
    remarks: row.remarks ? String(row.remarks) : undefined,
    status: String(row.status ?? "draft") as StockRequest["status"],
    rejectReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    lines: items.map((item) => {
      const material = getRelated(item, "materials");
      const unit = getRelated(item, "units_of_measure");
      return {
        id: String(item.id),
        itemId: String(item.material_id ?? ""),
        itemCode: String(material?.material_code ?? ""),
        itemName: String(material?.name ?? ""),
        quantity: asNumber(item.quantity),
        unit: String(unit?.abbreviation ?? ""),
        purpose: String(item.purpose ?? ""),
        estimatedPrice: asNumber(item.estimated_price),
      };
    }),
  };
}

export function mapPurchaseOrder(row: Row): PurchaseOrder {
  const supplier = getRelated(row, "suppliers");
  const project = getRelated(row, "projects");
  const site = getRelated(row, "sites");
  const request = getRelated(row, "stock_requests");
  const lines = Array.isArray(row.purchase_order_items) ? (row.purchase_order_items as Row[]) : [];
  return {
    id: String(row.id),
    project_id: String(row.project_id ?? ""),
    code: String(row.po_number ?? ""),
    supplierId: String(row.supplier_id ?? ""),
    supplier: String(supplier?.name ?? ""),
    linkedRequestId: row.stock_request_id ? String(row.stock_request_id) : undefined,
    linkedRequestCode: request?.request_code ? String(request.request_code) : undefined,
    project: String(project?.project_name ?? ""),
    site: String(site?.site_name ?? site?.site_code ?? ""),
    issueDate: toDate(row.issue_date),
    expectedDeliveryDate: toDate(row.expected_delivery_date),
    grandTotal: asNumber(row.total_amount),
    status: String(row.status ?? "draft") as PurchaseOrder["status"],
    lines: lines.map((line) => {
      const material = getRelated(line, "materials");
      const unit = getRelated(line, "units_of_measure");
      return {
        id: String(line.id),
        itemId: String(line.material_id ?? ""),
        itemName: String(material?.name ?? ""),
        orderedQty: asNumber(line.quantity),
        unit: String(unit?.abbreviation ?? ""),
        unitPrice: asNumber(line.unit_price),
        tax: asNumber(line.tax_amount),
        receivedQuantity: asNumber(line.received_quantity),
      };
    }),
  };
}

export function mapInventory(row: Row): InventoryBalance {
  const site = getRelated(row, "sites");
  const material = getRelated(row, "materials");
  const unit = material ? getRelated(material, "units_of_measure") : undefined;
  return {
    id: String(row.id),
    project_id: "",
    site: String(site?.site_name ?? site?.site_code ?? ""),
    itemId: String(row.material_id ?? ""),
    item: String(material?.name ?? ""),
    category: String(material?.category ?? ""),
    unit: String(unit?.abbreviation ?? ""),
    currentBalance: asNumber(row.current_balance),
    reorderLevel: asNumber(material?.reorder_level),
  };
}

export function mapAccount(row: Row): Account {
  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    type: String(row.type ?? "asset") as Account["type"],
    parent: row.parent_id ? String(row.parent_id) : undefined,
    is_cash: row.is_cash_account === true,
    is_bank: row.is_bank_account === true,
  };
}

export function mapProjectExpense(row: Row): ProjectExpense {
  const category = getRelated(row, "expense_categories");
  return {
    id: String(row.id),
    project_id: String(row.project_id ?? ""),
    code: `EXP-${row.id}`,
    category: String(category?.name ?? "misc").toLowerCase() as ProjectExpense["category"],
    date: toDate(row.expense_date),
    vendorOrPayee: String(row.vendor_or_payee ?? ""),
    amount: asNumber(row.amount),
    paymentMethod: String(row.payment_method ?? ""),
    approvalStatus: String(row.approval_status ?? "pending") as ProjectExpense["approvalStatus"],
    notes: row.description ? String(row.description) : undefined,
    voided: row.is_void === true,
  };
}

export function mapClientPayment(row: Row): ClientPayment {
  const customer = getRelated(row, "customers");
  return {
    id: String(row.id),
    project_id: String(row.project_id ?? ""),
    code: `PAY-${row.id}`,
    customer: String(customer?.display_name ?? ""),
    date: toDate(row.payment_date),
    amount: asNumber(row.amount),
    method: String(row.payment_method ?? ""),
    milestoneReference: row.milestone_ref ? String(row.milestone_ref) : undefined,
    referenceNo: row.reference_no ? String(row.reference_no) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapAttendance(row: Row): AttendanceRecord {
  const employee = getRelated(row, "employees");
  const site = getRelated(row, "sites");
  return {
    id: String(row.id),
    employeeId: String(row.employee_id ?? ""),
    employeeName: String(employee?.full_name ?? ""),
    site: String(site?.site_name ?? site?.site_code ?? ""),
    date: toDate(row.attendance_date),
    status: String(row.status ?? "present") as AttendanceRecord["status"],
  };
}

export function mapPayrollBatch(row: Row): PayrollBatch {
  const lines = Array.isArray(row.payroll_lines) ? (row.payroll_lines as Row[]) : [];
  return {
    id: String(row.id),
    code: String(row.batch_code ?? ""),
    period: `${toDate(row.period_start)} - ${toDate(row.period_end)}`,
    site: "",
    status: String(row.status ?? "draft") as PayrollBatch["status"],
    locked: String(row.status) === "locked" || Boolean(row.locked_at),
    lines: lines.map((line) => {
      const employee = getRelated(line, "employees");
      return {
        id: String(line.id),
        employeeId: String(line.employee_id ?? ""),
        employeeName: String(employee?.full_name ?? ""),
        basic: asNumber(line.basic_salary),
        attendanceAdj: asNumber(line.attendance_adjustment),
        allowances: asNumber(line.allowances),
        deductions: asNumber(line.deductions),
        advances: asNumber(line.advances_recovered),
        mode: String(line.payment_mode ?? "bank") as "bank" | "cash",
      };
    }),
  };
}
