import type { Role } from "@/constants/roles";

export type EntityStatus =
  | "new"
  | "draft"
  | "under_review"
  | "qs_estimation_pending"
  | "quotation_submitted"
  | "client_discussion"
  | "in_progress"
  | "ongoing"
  | "pending"
  | "review"
  | "ready"
  | "created"
  | "assigned"
  | "submitted"
  | "qs_review"
  | "converted_to_po"
  | "partially_fulfilled"
  | "pending_approval"
  | "issued"
  | "void"
  | "settled"
  | "prepared"
  | "processed"
  | "paid"
  | "locked"
  | "available"
  | "unavailable"
  | "retired"
  | "sent_to_client"
  | "revision_requested"
  | "client_sent"
  | "approved"
  | "completed"
  | "rejected"
  | "archived"
  | "cancelled"
  | "closed"
  | "on_hold";

export type ProjectType = "DRAWING_ONLY" | "2D_3D" | "CONSTRUCTION_ONLY" | "FULL_PROJECT";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  clientToken?: string;
};

export type Customer = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  location: string;
};

export type Lead = {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  companyName?: string;
  title: string;
  value: number;
  status: EntityStatus;
  owner: string;
  ownerId?: string;
  source: string;
  location: string;
  projectLocation: string;
  projectType: ProjectType;
  estimatedBudgetRange?: string;
  preferredStartDate?: string;
  urgency?: string;
  priority: Priority;
  tags: string[];
  requirementDescription: string;
  drawingRequirements?: string;
  constructionRequirements?: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
  rejectedReason?: string;
  sentToQsAt?: string;
};

export type Estimation = {
  id: string;
  code: string;
  leadId: string;
  leadCode: string;
  leadTitle?: string;
  customerName: string;
  projectType: string;
  materialCostTotal: number;
  labourCostTotal: number;
  equipmentCostTotal: number;
  overheadCostTotal: number;
  profitMarginPercent: number;
  subtotal: number;
  profitMarginValue: number;
  grandTotal: number;
  amount: number;
  status: EntityStatus;
  estimator: string;
  engineerId?: string;
  lines: EstimationLine[];
  boqLines: BoqLine[];
  notes?: string;
  revisionNotes?: string;
  updatedAt: string;
};

export type EstimationLine = {
  id: string;
  category: string;
  description: string;
  qty: number;
  unit: string;
  unitRate: number;
  remarks?: string;
};

export type BoqLine = {
  id: string;
  lineNo: number;
  section: string;
  itemName: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

export type Quotation = {
  id: string;
  code: string;
  version: number;
  leadId: string;
  leadCode: string;
  customerName: string;
  owner: string;
  grandTotal: number;
  amount: number;
  status: EntityStatus;
  sentDate?: string;
  validUntil: string;
  active: boolean;
  paymentTerms: string;
  boqLines: BoqLine[];
  attachments: Attachment[];
  clientResponses: ClientResponse[];
};

export type Project = {
  id: string;
  project_id: string;
  code: string;
  name: string;
  customerId?: string;
  client: string;
  customer: string;
  status: EntityStatus;
  manager: string;
  managerId?: string;
  progress: number;
  site: string;
  siteName: string;
  startDate: string;
  endDate: string;
  budget: number;
  quotationId?: string;
  quotationCode?: string;
  quotationVersion?: number;
  cancellationReason?: string;
};

export type Employee = {
  id: string;
  code: string;
  name: string;
  fullName?: string;
  nic?: string;
  phone?: string;
  email?: string;
  address?: string;
  department: string;
  position?: string;
  role: string;
  workRole?: string;
  joiningDate?: string;
  currentSite?: string;
  salaryType?: "monthly" | "daily" | "hourly";
  basicSalary?: number;
  allowances?: Array<{ label: string; amount: number }>;
  deductions?: Array<{ label: string; amount: number }>;
  status: "active" | "inactive";
};

export type Vehicle = {
  id: string;
  code: string;
  vehicleCode?: string;
  registrationNo: string;
  registrationNumber?: string;
  type: string;
  category?: "car" | "van" | "truck" | "machinery" | "other";
  ownershipStatus?: "owned" | "leased";
  status: "available" | "assigned" | "maintenance" | "unavailable" | "retired";
  currentProject?: string;
  meterReading?: number;
  insuranceExpiry?: string;
  licenseExpiry?: string;
  notes?: string;
};

export type ActivityItem = {
  actor: string;
  action: string;
  timestamp: string;
  summary: string;
};

export type CommunicationEntry = {
  id: string;
  leadId: string;
  type: "call" | "email" | "meeting" | "whatsapp" | "note";
  summary: string;
  discussedAt: string;
  nextActionDate?: string;
  nextActionOwner?: string;
  owner: string;
};

export type Note = {
  id: string;
  parentId: string;
  author: string;
  body: string;
  createdAt: string;
};

export type Attachment = {
  id: string;
  parentId: string;
  name: string;
  type: string;
  uploader: string;
  date: string;
};

export type ClientResponse = {
  id: string;
  quotationId: string;
  decision: "approved" | "rejected" | "revision_requested";
  reason?: string;
  date: string;
  owner: string;
};

export type ProjectStatusLog = {
  id: string;
  project_id: string;
  fromStatus: EntityStatus;
  toStatus: EntityStatus;
  reason?: string;
  changedBy: string;
  changedAt: string;
};

export type ProjectTeamAssignment = {
  id: string;
  project_id: string;
  employeeId: string;
  employeeName: string;
  roleOnProject: string;
  assignedDate: string;
  removedDate?: string;
  status: "active" | "removed";
};

export type ProjectProgressUpdate = {
  id: string;
  project_id: string;
  date: string;
  title: string;
  summary: string;
  percentComplete: number;
  blockers?: string;
  nextSteps?: string;
  clientVisible: boolean;
  attachments: Attachment[];
};

export type ProjectExpense = {
  id: string;
  project_id: string;
  code: string;
  category: "material" | "labour" | "transport" | "misc";
  date: string;
  vendorOrPayee: string;
  amount: number;
  paymentMethod: string;
  approvalStatus: EntityStatus;
  notes?: string;
  voided?: boolean;
};

export type ClientPayment = {
  id: string;
  project_id: string;
  code: string;
  customer: string;
  date: string;
  amount: number;
  method: string;
  milestoneReference?: string;
  referenceNo?: string;
  notes?: string;
};

export type ProjectVehicleAssignment = {
  id: string;
  project_id: string;
  vehicleId: string;
  vehicleNo: string;
  category: string;
  assignedDate: string;
  removedDate?: string;
  status: "active" | "removed";
};

export type PettyCash = {
  id: string;
  project_id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  allocatedAmount: number;
  issued: string;
  settled: number;
  status: "issued" | "pending" | "settled";
  notes?: string;
};

export type JournalEntry = {
  id: string;
  project_id: string;
  code: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
};

export type StockItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  standardCost: number;
  preferredSupplier: string;
  status: "active" | "inactive";
  usedInRequest?: boolean;
};

export type Supplier = {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: string;
  rating: number;
  status: "active" | "inactive";
  onTimePercent: number;
  orderHistory: string[];
};

export type StockRequestLine = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  purpose: string;
  boqItemReference?: string;
  estimatedPrice: number;
};

export type StockRequest = {
  id: string;
  project_id: string;
  code: string;
  project: string;
  site: string;
  requestDate: string;
  requiredByDate: string;
  requester: string;
  requestedBy: string;
  remarks?: string;
  status: EntityStatus;
  rejectReason?: string;
  lines: StockRequestLine[];
};

export type PurchaseOrderLine = {
  id: string;
  itemId: string;
  itemName: string;
  orderedQty: number;
  unit: string;
  unitPrice: number;
  tax: number;
  receivedQuantity: number;
};

export type PurchaseOrder = {
  id: string;
  project_id: string;
  code: string;
  supplierId: string;
  supplier: string;
  linkedRequestId?: string;
  linkedRequestCode?: string;
  project: string;
  site: string;
  issueDate: string;
  expectedDeliveryDate: string;
  grandTotal: number;
  status: EntityStatus;
  lines: PurchaseOrderLine[];
};

export type GoodsReceipt = {
  id: string;
  project_id: string;
  code: string;
  poId: string;
  poCode: string;
  receivedDate: string;
  receivedBy: string;
  lines: Array<{
    itemId: string;
    itemName: string;
    orderedQty: number;
    receivedQty: number;
    damagedQty: number;
  }>;
};

export type InventoryBalance = {
  id: string;
  project_id: string;
  site: string;
  itemId: string;
  item: string;
  category: string;
  unit: string;
  currentBalance: number;
  reorderLevel: number;
};

export type SiteAssignment = {
  id: string;
  employeeId: string;
  employeeName: string;
  site: string;
  from: string;
  to?: string;
  status: "active" | "removed";
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  site: string;
  date: string;
  status: "present" | "absent" | "leave" | "unpaid";
};

export type PayrollLine = {
  id: string;
  employeeId: string;
  employeeName: string;
  basic: number;
  attendanceAdj: number;
  allowances: number;
  deductions: number;
  advances: number;
  mode: "bank" | "cash";
};

export type PayrollBatch = {
  id: string;
  code: string;
  period: string;
  site: string;
  status: EntityStatus;
  locked: boolean;
  lines: PayrollLine[];
};

export type VehicleAssignment = {
  id: string;
  vehicleId: string;
  project: string;
  site: string;
  from: string;
  to?: string;
  notes?: string;
};

export type MeterLog = {
  id: string;
  vehicleId: string;
  date: string;
  reading: number;
  loggedBy: string;
};

export type MaintenanceLog = {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  nextDue: string;
};

export type FuelLog = {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  liters: number;
  cost: number;
  station: string;
};

export type Account = {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "income" | "expense" | "equity";
  parent?: string;
  is_cash?: boolean;
  is_bank?: boolean;
};

export type JournalLine = {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  category: string;
};

export type PostedJournalEntry = {
  id: string;
  code: string;
  project_id?: string;
  date: string;
  description: string;
  sourceModule: "project" | "stock" | "hr" | "accounting";
  sourceReference: string;
  lines: JournalLine[];
};

export type DebtorAgingRow = {
  project: string;
  customer: string;
  milestone: string;
  dueDate: string;
  dueAmount: number;
  paid: number;
  outstanding: number;
  overdueDays: number;
};

export type ClientAccess = {
  token: string;
  project_id: string;
  expiresAt: string;
  active: boolean;
};

export type FilterParams = {
  search?: string;
  status?: string;
  owner?: string;
  department?: string;
};
