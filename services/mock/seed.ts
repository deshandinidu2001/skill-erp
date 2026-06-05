import type {
  AppUser,
  Account,
  Attachment,
  AttendanceRecord,
  ClientResponse,
  CommunicationEntry,
  Customer,
  Employee,
  GoodsReceipt,
  InventoryBalance,
  JournalEntry,
  PostedJournalEntry,
  Estimation,
  Lead,
  Note,
  ClientPayment,
  ClientAccess,
  PettyCash,
  PayrollBatch,
  Project,
  ProjectExpense,
  ProjectProgressUpdate,
  ProjectStatusLog,
  ProjectTeamAssignment,
  ProjectVehicleAssignment,
  PurchaseOrder,
  Quotation,
  StockItem,
  StockRequest,
  Supplier,
  Vehicle,
  VehicleAssignment,
  MeterLog,
  MaintenanceLog,
  FuelLog,
  SiteAssignment,
  DebtorAgingRow,
} from "@/types";

export const users: AppUser[] = [
  {
    id: "usr_sa",
    name: "Nadun Perera",
    email: "admin@skillengineering.lk",
    password: "Password@123",
    role: "super_admin",
  },
  {
    id: "usr_mkt",
    name: "Dinithi Fernando",
    email: "marketing@skillengineering.lk",
    password: "Password@123",
    role: "marketing_executive",
  },
  {
    id: "usr_pm",
    name: "Kasun Jayasinghe",
    email: "projects@skillengineering.lk",
    password: "Password@123",
    role: "project_manager",
  },
];

export const customers: Customer[] = [
  { id: "cus_001", code: "CUS-001", name: "Ceylon Logistics PLC", contactPerson: "Anura Silva", phone: "+94 77 123 4567", location: "Colombo 02" },
  { id: "cus_002", code: "CUS-002", name: "Kandy Heights Residencies", contactPerson: "Mevan Ratnayake", phone: "+94 71 234 5678", location: "Kandy" },
  { id: "cus_003", code: "CUS-003", name: "Southern Apparel Holdings", contactPerson: "Ishara Dias", phone: "+94 76 345 6789", location: "Galle" },
  { id: "cus_004", code: "CUS-004", name: "Lanka Cold Storage", contactPerson: "Rukshan Peiris", phone: "+94 75 456 7890", location: "Wattala" },
  { id: "cus_005", code: "CUS-005", name: "Northshore Developers", contactPerson: "Fathima Niyas", phone: "+94 70 567 8901", location: "Jaffna" },
];

export const leads: Lead[] = [
  { id: "lead_001", code: "LEAD-1001", customerId: "cus_001", customerName: "Ceylon Logistics PLC", phone: "+94 77 123 4567", email: "anura@ceylonlogistics.lk", companyName: "Ceylon Logistics PLC", title: "Warehouse mezzanine extension", value: 18500000, status: "new", owner: "Dinithi Fernando", ownerId: "usr_mkt", source: "Referral", location: "Colombo 02", projectLocation: "Colombo 02", projectType: "CONSTRUCTION_ONLY", estimatedBudgetRange: "LKR 15M - 20M", preferredStartDate: "2026-07-01", urgency: "Within 30 days", priority: "HIGH", tags: ["warehouse", "steel"], requirementDescription: "Extend existing warehouse mezzanine without interrupting operations.", drawingRequirements: "As-built review and fabrication drawings", constructionRequirements: "Night-shift installation preferred", additionalNotes: "Client requires staged handover.", createdAt: "2026-05-20", updatedAt: "2026-06-02" },
  { id: "lead_002", code: "LEAD-1002", customerId: "cus_002", customerName: "Kandy Heights Residencies", phone: "+94 71 234 5678", email: "mevan@kandyheights.lk", companyName: "Kandy Heights Residencies", title: "Apartment block MEP package", value: 46200000, status: "qs_estimation_pending", owner: "Dinithi Fernando", ownerId: "usr_mkt", source: "Website", location: "Kandy", projectLocation: "Kandy", projectType: "FULL_PROJECT", estimatedBudgetRange: "LKR 40M - 50M", preferredStartDate: "2026-07-15", urgency: "Tender deadline", priority: "URGENT", tags: ["mep", "residential"], requirementDescription: "MEP package for 8-floor apartment block.", drawingRequirements: "2D coordination drawings and 3D services model", constructionRequirements: "Electrical, plumbing, fire, and HVAC works", createdAt: "2026-05-18", updatedAt: "2026-06-01", sentToQsAt: "2026-05-19" },
  { id: "lead_003", code: "LEAD-1003", customerId: "cus_003", customerName: "Southern Apparel Holdings", phone: "+94 76 345 6789", email: "ishara@southernap.lk", companyName: "Southern Apparel Holdings", title: "Factory floor renovation", value: 12800000, status: "quotation_submitted", owner: "Dinithi Fernando", ownerId: "usr_mkt", source: "Repeat customer", location: "Galle", projectLocation: "Galle", projectType: "CONSTRUCTION_ONLY", estimatedBudgetRange: "LKR 10M - 15M", preferredStartDate: "2026-06-20", urgency: "Production shutdown window", priority: "HIGH", tags: ["civil", "factory"], requirementDescription: "Repair floor slab, drains, and machine plinths.", constructionRequirements: "Weekend work required", createdAt: "2026-05-14", updatedAt: "2026-06-03", sentToQsAt: "2026-05-15" },
  { id: "lead_004", code: "LEAD-1004", customerId: "cus_004", customerName: "Lanka Cold Storage", phone: "+94 75 456 7890", email: "rukshan@lcs.lk", companyName: "Lanka Cold Storage", title: "Cold room steel platform", value: 9800000, status: "under_review", owner: "Nadun Perera", ownerId: "usr_sa", source: "Tender", location: "Wattala", projectLocation: "Wattala", projectType: "2D_3D", estimatedBudgetRange: "LKR 8M - 10M", urgency: "Standard", priority: "MEDIUM", tags: ["steel", "cold-room"], requirementDescription: "Design and detail steel access platform around cold room.", drawingRequirements: "2D general arrangement and 3D steel model", createdAt: "2026-05-12", updatedAt: "2026-05-30" },
  { id: "lead_005", code: "LEAD-1005", customerId: "cus_005", customerName: "Northshore Developers", phone: "+94 70 567 8901", email: "fathima@northshore.lk", companyName: "Northshore Developers", title: "Hotel service yard upgrade", value: 27500000, status: "approved", owner: "Dinithi Fernando", ownerId: "usr_mkt", source: "Consultant", location: "Jaffna", projectLocation: "Jaffna", projectType: "FULL_PROJECT", estimatedBudgetRange: "LKR 25M - 30M", preferredStartDate: "2026-06-28", urgency: "Board approved", priority: "HIGH", tags: ["hotel", "infrastructure"], requirementDescription: "Upgrade service yard, drainage, paving, and utility routing.", drawingRequirements: "Civil layout and service coordination", constructionRequirements: "Maintain hotel operations", createdAt: "2026-05-08", updatedAt: "2026-06-02", sentToQsAt: "2026-05-09" },
  { id: "lead_006", code: "LEAD-1006", customerId: "cus_001", customerName: "Ceylon Logistics PLC", phone: "+94 77 123 4567", email: "anura@ceylonlogistics.lk", title: "Racking safety modifications", value: 5400000, status: "closed", owner: "Dinithi Fernando", ownerId: "usr_mkt", source: "Phone", location: "Colombo 02", projectLocation: "Colombo 02", projectType: "DRAWING_ONLY", estimatedBudgetRange: "LKR 5M - 6M", urgency: "Safety audit", priority: "MEDIUM", tags: ["racking"], requirementDescription: "Prepare modification details for existing racking frames.", drawingRequirements: "Fabrication details", createdAt: "2026-05-02", updatedAt: "2026-05-29" },
  { id: "lead_007", code: "LEAD-1007", customerId: "cus_002", customerName: "Kandy Heights Residencies", phone: "+94 71 234 5678", email: "mevan@kandyheights.lk", title: "Basement drainage remedial", value: 7600000, status: "client_discussion", owner: "Nadun Perera", ownerId: "usr_sa", source: "Email", location: "Kandy", projectLocation: "Kandy", projectType: "CONSTRUCTION_ONLY", estimatedBudgetRange: "LKR 7M - 8M", urgency: "Monsoon risk", priority: "URGENT", tags: ["drainage"], requirementDescription: "Remedial works to basement drainage and sump discharge.", constructionRequirements: "Work in occupied basement", createdAt: "2026-04-29", updatedAt: "2026-06-01", sentToQsAt: "2026-04-30" },
  { id: "lead_008", code: "LEAD-1008", customerId: "cus_003", customerName: "Southern Apparel Holdings", phone: "+94 76 345 6789", email: "ishara@southernap.lk", title: "Compressor room enclosure", value: 6400000, status: "rejected", owner: "Dinithi Fernando", ownerId: "usr_mkt", source: "Tender", location: "Galle", projectLocation: "Galle", projectType: "2D_3D", estimatedBudgetRange: "LKR 6M - 7M", urgency: "Standard", priority: "LOW", tags: ["enclosure"], requirementDescription: "Acoustic enclosure concept and construction price.", drawingRequirements: "Concept drawings", createdAt: "2026-04-25", updatedAt: "2026-05-22", rejectedReason: "Client awarded to another bidder." },
  { id: "lead_009", code: "LEAD-1009", customerId: "cus_004", customerName: "Lanka Cold Storage", phone: "+94 75 456 7890", email: "rukshan@lcs.lk", title: "Loading bay canopy", value: 15300000, status: "draft", owner: "Dinithi Fernando", ownerId: "usr_mkt", source: "Referral", location: "Wattala", projectLocation: "Wattala", projectType: "FULL_PROJECT", estimatedBudgetRange: "LKR 15M - 18M", urgency: "Standard", priority: "MEDIUM", tags: ["canopy", "steel"], requirementDescription: "Loading bay canopy with drainage and lighting.", drawingRequirements: "GA and fabrication drawings", constructionRequirements: "No obstruction to loading during daytime", createdAt: "2026-04-21", updatedAt: "2026-05-18" },
  { id: "lead_010", code: "LEAD-1010", customerId: "cus_005", customerName: "Northshore Developers", phone: "+94 70 567 8901", email: "fathima@northshore.lk", title: "Temporary site office", value: 4200000, status: "archived", owner: "Kasun Jayasinghe", ownerId: "usr_pm", source: "Walk-in", location: "Jaffna", projectLocation: "Jaffna", projectType: "CONSTRUCTION_ONLY", estimatedBudgetRange: "LKR 4M - 5M", urgency: "Low", priority: "LOW", tags: ["temporary"], requirementDescription: "Temporary office and store for consultant team.", constructionRequirements: "Modular installation", createdAt: "2026-04-16", updatedAt: "2026-05-10" },
];

export const estimations: Estimation[] = [
  { id: "est_001", code: "EST-2001", leadId: "lead_001", leadCode: "LEAD-1001", leadTitle: "Warehouse mezzanine extension", customerName: "Ceylon Logistics PLC", projectType: "CONSTRUCTION_ONLY", materialCostTotal: 9800000, labourCostTotal: 3200000, equipmentCostTotal: 950000, overheadCostTotal: 650000, profitMarginPercent: 18, subtotal: 14600000, profitMarginValue: 2628000, grandTotal: 17228000, amount: 17228000, status: "draft", estimator: "Sajith Kumara", engineerId: "emp_003", lines: [{ id: "line_001", category: "Steel", description: "Primary beams and columns", qty: 12, unit: "t", unitRate: 620000, remarks: "Fabricated" }], boqLines: [{ id: "boq_001", lineNo: 1, section: "Steel frame", itemName: "Universal beams", description: "Supply and install structural steel beams", qty: 12, unit: "t", unitPrice: 620000 }], notes: "Awaiting site measurement confirmation.", revisionNotes: "", updatedAt: "2026-05-28" },
  { id: "est_002", code: "EST-2002", leadId: "lead_002", leadCode: "LEAD-1002", leadTitle: "Apartment block MEP package", customerName: "Kandy Heights Residencies", projectType: "FULL_PROJECT", materialCostTotal: 26600000, labourCostTotal: 8700000, equipmentCostTotal: 2300000, overheadCostTotal: 1800000, profitMarginPercent: 16, subtotal: 39400000, profitMarginValue: 6304000, grandTotal: 45704000, amount: 45704000, status: "ready", estimator: "Sajith Kumara", engineerId: "emp_003", lines: [{ id: "line_002", category: "MEP", description: "Electrical rough-in", qty: 1, unit: "lot", unitRate: 12600000 }], boqLines: [{ id: "boq_002", lineNo: 1, section: "Electrical", itemName: "DB and cabling", description: "Floor distribution boards and cable routes", qty: 1, unit: "lot", unitPrice: 12600000 }], notes: "Ready for quotation generation.", revisionNotes: "", updatedAt: "2026-05-27" },
  { id: "est_003", code: "EST-2003", leadId: "lead_003", leadCode: "LEAD-1003", leadTitle: "Factory floor renovation", customerName: "Southern Apparel Holdings", projectType: "CONSTRUCTION_ONLY", materialCostTotal: 6200000, labourCostTotal: 2700000, equipmentCostTotal: 850000, overheadCostTotal: 420000, profitMarginPercent: 15, subtotal: 10170000, profitMarginValue: 1525500, grandTotal: 11695500, amount: 11695500, status: "completed", estimator: "QS Team", lines: [{ id: "line_003", category: "Civil", description: "Floor screed and repair", qty: 180, unit: "m2", unitRate: 18500 }], boqLines: [{ id: "boq_003", lineNo: 1, section: "Floor", itemName: "Floor repair", description: "Break, prepare and repair slab", qty: 180, unit: "m2", unitPrice: 18500 }], notes: "Quotation submitted.", revisionNotes: "", updatedAt: "2026-05-24" },
  { id: "est_004", code: "EST-2004", leadId: "lead_004", leadCode: "LEAD-1004", leadTitle: "Cold room steel platform", customerName: "Lanka Cold Storage", projectType: "2D_3D", materialCostTotal: 0, labourCostTotal: 0, equipmentCostTotal: 0, overheadCostTotal: 0, profitMarginPercent: 0, subtotal: 0, profitMarginValue: 0, grandTotal: 0, amount: 0, status: "draft", estimator: "Unassigned", lines: [], boqLines: [], notes: "Lead under review.", revisionNotes: "", updatedAt: "2026-05-23" },
  { id: "est_005", code: "EST-2005", leadId: "lead_005", leadCode: "LEAD-1005", leadTitle: "Hotel service yard upgrade", customerName: "Northshore Developers", projectType: "FULL_PROJECT", materialCostTotal: 13800000, labourCostTotal: 5300000, equipmentCostTotal: 1800000, overheadCostTotal: 900000, profitMarginPercent: 18, subtotal: 21800000, profitMarginValue: 3924000, grandTotal: 25724000, amount: 25724000, status: "completed", estimator: "QS Team", lines: [{ id: "line_005", category: "Civil", description: "Concrete paving", qty: 460, unit: "m2", unitRate: 14500 }], boqLines: [{ id: "boq_005", lineNo: 1, section: "Paving", itemName: "Concrete paving", description: "Concrete paving to service yard", qty: 460, unit: "m2", unitPrice: 14500 }], notes: "Approved by client.", revisionNotes: "", updatedAt: "2026-05-21" },
];

export const quotations: Quotation[] = [
  { id: "quo_001", code: "QUO-3001", version: 1, leadId: "lead_001", leadCode: "LEAD-1001", customerName: "Ceylon Logistics PLC", owner: "Sajith Kumara", grandTotal: 19300000, amount: 19300000, status: "draft", validUntil: "2026-06-30", active: true, paymentTerms: "40% advance, 50% progress, 10% handover", boqLines: estimations[0].boqLines, attachments: [], clientResponses: [] },
  { id: "quo_002", code: "QUO-3002", version: 1, leadId: "lead_002", leadCode: "LEAD-1002", customerName: "Kandy Heights Residencies", owner: "Sajith Kumara", grandTotal: 47600000, amount: 47600000, status: "review", validUntil: "2026-07-05", active: true, paymentTerms: "30% advance, monthly progress claims", boqLines: estimations[1].boqLines, attachments: [], clientResponses: [] },
  { id: "quo_003", code: "QUO-3003", version: 1, leadId: "lead_003", leadCode: "LEAD-1003", customerName: "Southern Apparel Holdings", owner: "Dinithi Fernando", grandTotal: 13200000, amount: 13200000, status: "sent_to_client", sentDate: "2026-05-30", validUntil: "2026-06-24", active: true, paymentTerms: "50% advance, 40% progress, 10% completion", boqLines: estimations[2].boqLines, attachments: [{ id: "att_q_001", parentId: "quo_003", name: "Quotation-QUO-3003-v1.pdf", type: "PDF", uploader: "Dinithi Fernando", date: "2026-05-30" }], clientResponses: [] },
  { id: "quo_004", code: "QUO-3003", version: 0, leadId: "lead_003", leadCode: "LEAD-1003", customerName: "Southern Apparel Holdings", owner: "Sajith Kumara", grandTotal: 12800000, amount: 12800000, status: "rejected", sentDate: "2026-05-26", validUntil: "2026-06-18", active: false, paymentTerms: "50% advance, balance on completion", boqLines: estimations[2].boqLines, attachments: [], clientResponses: [{ id: "resp_001", quotationId: "quo_004", decision: "revision_requested", reason: "Reduce shutdown hours and separate drainage price.", date: "2026-05-28", owner: "Dinithi Fernando" }] },
  { id: "quo_005", code: "QUO-3005", version: 1, leadId: "lead_005", leadCode: "LEAD-1005", customerName: "Northshore Developers", owner: "Dinithi Fernando", grandTotal: 28400000, amount: 28400000, status: "approved", sentDate: "2026-05-22", validUntil: "2026-07-12", active: true, paymentTerms: "35% advance, 55% progress, 10% retention", boqLines: estimations[4].boqLines, attachments: [], clientResponses: [{ id: "resp_002", quotationId: "quo_005", decision: "approved", date: "2026-06-01", owner: "Marketing Manager" }] },
];

export const communications: CommunicationEntry[] = [
  { id: "comm_001", leadId: "lead_001", type: "call", summary: "Client confirmed operating hours and requested staged installation.", discussedAt: "2026-06-02", nextActionDate: "2026-06-06", nextActionOwner: "Dinithi Fernando", owner: "Dinithi Fernando" },
  { id: "comm_002", leadId: "lead_002", type: "email", summary: "Tender drawings received and forwarded to QS.", discussedAt: "2026-05-19", nextActionDate: "2026-06-05", nextActionOwner: "Sajith Kumara", owner: "Dinithi Fernando" },
  { id: "comm_003", leadId: "lead_003", type: "meeting", summary: "Client requested quote split by production zone.", discussedAt: "2026-05-29", nextActionDate: "2026-06-07", nextActionOwner: "Dinithi Fernando", owner: "Dinithi Fernando" },
];

export const notes: Note[] = [
  { id: "note_001", parentId: "lead_001", author: "Dinithi Fernando", body: "Operations team should review night work allowance.", createdAt: "2026-06-02" },
  { id: "note_002", parentId: "lead_003", author: "Sajith Kumara", body: "Drainage item revised after client meeting.", createdAt: "2026-05-29" },
];

export const attachments: Attachment[] = [
  { id: "att_001", parentId: "lead_001", name: "warehouse-existing-layout.xlsx", type: "XLSX", uploader: "Dinithi Fernando", date: "2026-06-01" },
  { id: "att_002", parentId: "lead_002", name: "mep-tender-drawings.zip", type: "ZIP", uploader: "Dinithi Fernando", date: "2026-05-19" },
];

export const projects: Project[] = [
  { id: "prj_001", project_id: "prj_001", code: "PRJ-4001", name: "Warehouse mezzanine extension", customerId: "cus_001", client: "Ceylon Logistics PLC", customer: "Ceylon Logistics PLC", status: "in_progress", manager: "Kasun Jayasinghe", managerId: "emp_001", progress: 42, site: "Colombo 02", siteName: "Colombo 02 warehouse", startDate: "2026-06-01", endDate: "2026-08-15", budget: 19300000, quotationId: "quo_001", quotationCode: "QUO-3001", quotationVersion: 1 },
  { id: "prj_002", project_id: "prj_002", code: "PRJ-4002", name: "Factory floor renovation", customerId: "cus_003", client: "Southern Apparel Holdings", customer: "Southern Apparel Holdings", status: "assigned", manager: "Kasun Jayasinghe", managerId: "emp_001", progress: 64, site: "Galle", siteName: "Galle factory", startDate: "2026-05-25", endDate: "2026-07-10", budget: 13200000, quotationId: "quo_003", quotationCode: "QUO-3003", quotationVersion: 1 },
  { id: "prj_003", project_id: "prj_003", code: "PRJ-4003", name: "Loading bay canopy", customerId: "cus_004", client: "Lanka Cold Storage", customer: "Lanka Cold Storage", status: "on_hold", manager: "Kasun Jayasinghe", managerId: "emp_001", progress: 12, site: "Wattala", siteName: "Wattala cold store", startDate: "2026-06-20", endDate: "2026-09-05", budget: 15300000, cancellationReason: undefined },
  { id: "prj_004", project_id: "prj_004", code: "PRJ-4004", name: "Hotel service yard upgrade", customerId: "cus_005", client: "Northshore Developers", customer: "Northshore Developers", status: "completed", manager: "Kasun Jayasinghe", managerId: "emp_001", progress: 100, site: "Jaffna", siteName: "Jaffna hotel", startDate: "2026-04-10", endDate: "2026-06-01", budget: 28400000, quotationId: "quo_005", quotationCode: "QUO-3005", quotationVersion: 1 },
  { id: "prj_005", project_id: "prj_005", code: "PRJ-4005", name: "Racking safety modifications", customerId: "cus_001", client: "Ceylon Logistics PLC", customer: "Ceylon Logistics PLC", status: "closed", manager: "Kasun Jayasinghe", managerId: "emp_001", progress: 100, site: "Colombo 02", siteName: "Colombo 02 warehouse", startDate: "2026-03-01", endDate: "2026-04-15", budget: 5400000 },
];

export const employees: Employee[] = [
  { id: "emp_001", code: "EMP-001", name: "Kasun Jayasinghe", fullName: "Kasun Jayasinghe", nic: "891234567V", phone: "+94 77 111 2222", email: "kasun@skillengineering.lk", address: "Nugegoda", department: "Projects", position: "Project Manager", role: "Project Manager", workRole: "Site operations", joiningDate: "2021-02-01", currentSite: "Colombo 02", salaryType: "monthly", basicSalary: 220000, allowances: [{ label: "Travel", amount: 25000 }], deductions: [], status: "active" },
  { id: "emp_002", code: "EMP-002", name: "Dinithi Fernando", fullName: "Dinithi Fernando", nic: "925551234V", phone: "+94 77 222 3333", email: "dinithi@skillengineering.lk", address: "Rajagiriya", department: "Marketing", position: "Marketing Executive", role: "Marketing Executive", workRole: "Client relations", joiningDate: "2023-04-15", currentSite: "Head Office", salaryType: "monthly", basicSalary: 150000, status: "active" },
  { id: "emp_003", code: "EMP-003", name: "Sajith Kumara", fullName: "Sajith Kumara", nic: "880112233V", phone: "+94 71 444 5555", email: "sajith@skillengineering.lk", address: "Kaduwela", department: "QS", position: "QS Engineer", role: "QS Engineer", workRole: "Costing", joiningDate: "2022-08-01", currentSite: "Head Office", salaryType: "monthly", basicSalary: 180000, status: "active" },
  { id: "emp_004", code: "EMP-004", name: "Malith Silva", fullName: "Malith Silva", nic: "901112345V", phone: "+94 70 555 6666", email: "malith@skillengineering.lk", address: "Wattala", department: "Stock", position: "Store Keeper", role: "Store Keeper", workRole: "Stores", joiningDate: "2024-01-10", currentSite: "Galle", salaryType: "daily", basicSalary: 4500, status: "active" },
  { id: "emp_005", code: "EMP-005", name: "Hashini Perera", fullName: "Hashini Perera", nic: "945556789V", phone: "+94 76 777 8888", email: "hashini@skillengineering.lk", address: "Maharagama", department: "HR", position: "HR Executive", role: "HR Executive", workRole: "HR operations", joiningDate: "2024-03-01", currentSite: "Head Office", salaryType: "monthly", basicSalary: 145000, status: "active" },
  { id: "emp_006", code: "EMP-006", name: "Ravindu Dias", fullName: "Ravindu Dias", nic: "870001234V", phone: "+94 75 123 9000", email: "ravindu@skillengineering.lk", address: "Ja-Ela", department: "Vehicles", position: "Fleet Coordinator", role: "Fleet Coordinator", workRole: "Fleet", joiningDate: "2022-11-20", currentSite: "Head Office", salaryType: "monthly", basicSalary: 160000, status: "active" },
  { id: "emp_007", code: "EMP-007", name: "Nuwani De Silva", fullName: "Nuwani De Silva", nic: "936661234V", phone: "+94 77 333 4444", email: "nuwani@skillengineering.lk", address: "Colombo 05", department: "Accounting", position: "Accountant", role: "Accountant", workRole: "Finance", joiningDate: "2021-09-01", currentSite: "Head Office", salaryType: "monthly", basicSalary: 190000, status: "active" },
  { id: "emp_008", code: "EMP-008", name: "Tharindu Wijesinghe", fullName: "Tharindu Wijesinghe", nic: "912223333V", phone: "+94 71 111 8888", email: "tharindu@skillengineering.lk", address: "Gampaha", department: "Projects", position: "Technical Officer", role: "Technical Officer", workRole: "Site supervision", joiningDate: "2020-02-01", currentSite: "None", salaryType: "daily", basicSalary: 5500, status: "inactive" },
];

export const vehicles: Vehicle[] = [
  { id: "veh_001", code: "VEH-001", vehicleCode: "VEH-001", registrationNo: "CAB-2841", registrationNumber: "CAB-2841", type: "Crew cab", category: "truck", ownershipStatus: "owned", status: "assigned", currentProject: "Warehouse mezzanine extension", meterReading: 84210, insuranceExpiry: "2026-06-25", licenseExpiry: "2026-07-05", notes: "Assigned to Colombo site" },
  { id: "veh_002", code: "VEH-002", vehicleCode: "VEH-002", registrationNo: "WP-PG-7194", registrationNumber: "WP-PG-7194", type: "Lorry", category: "truck", ownershipStatus: "owned", status: "available", currentProject: "", meterReading: 126900, insuranceExpiry: "2026-10-10", licenseExpiry: "2026-09-15" },
  { id: "veh_003", code: "VEH-003", vehicleCode: "VEH-003", registrationNo: "WP-KU-4412", registrationNumber: "WP-KU-4412", type: "Van", category: "van", ownershipStatus: "leased", status: "maintenance", currentProject: "", meterReading: 65320, insuranceExpiry: "2026-06-20", licenseExpiry: "2026-06-28", notes: "Brake repair pending" },
];

export const siteAssignments: SiteAssignment[] = [
  { id: "sa_001", employeeId: "emp_001", employeeName: "Kasun Jayasinghe", site: "Colombo 02", from: "2026-06-01", status: "active" },
  { id: "sa_002", employeeId: "emp_004", employeeName: "Malith Silva", site: "Galle", from: "2026-05-28", status: "active" },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: "att_001", employeeId: "emp_001", employeeName: "Kasun Jayasinghe", site: "Colombo 02", date: "2026-06-04", status: "present" },
  { id: "att_002", employeeId: "emp_004", employeeName: "Malith Silva", site: "Galle", date: "2026-06-04", status: "present" },
  { id: "att_003", employeeId: "emp_003", employeeName: "Sajith Kumara", site: "Head Office", date: "2026-06-04", status: "leave" },
];

export const payrollBatches: PayrollBatch[] = [
  {
    id: "payroll_001",
    code: "PAY-2026-05-HO",
    period: "2026-05",
    site: "Head Office",
    status: "approved",
    locked: false,
    lines: [
      { id: "pl_001", employeeId: "emp_002", employeeName: "Dinithi Fernando", basic: 150000, attendanceAdj: 0, allowances: 10000, deductions: 2500, advances: 5000, mode: "bank" },
      { id: "pl_002", employeeId: "emp_007", employeeName: "Nuwani De Silva", basic: 190000, attendanceAdj: 0, allowances: 12000, deductions: 4000, advances: 0, mode: "bank" },
    ],
  },
  {
    id: "payroll_002",
    code: "PAY-2026-05-GALLE",
    period: "2026-05",
    site: "Galle",
    status: "locked",
    locked: true,
    lines: [
      { id: "pl_003", employeeId: "emp_004", employeeName: "Malith Silva", basic: 117000, attendanceAdj: -4500, allowances: 6000, deductions: 1500, advances: 2000, mode: "cash" },
    ],
  },
];

export const vehicleAssignments: VehicleAssignment[] = [
  { id: "va_001", vehicleId: "veh_001", project: "Warehouse mezzanine extension", site: "Colombo 02", from: "2026-06-01", notes: "Daily material transport" },
];

export const meterLogs: MeterLog[] = [
  { id: "ml_001", vehicleId: "veh_001", date: "2026-06-01", reading: 83980, loggedBy: "Ravindu Dias" },
  { id: "ml_002", vehicleId: "veh_001", date: "2026-06-04", reading: 84210, loggedBy: "Kasun Jayasinghe" },
];

export const maintenanceLogs: MaintenanceLog[] = [
  { id: "mnt_001", vehicleId: "veh_003", date: "2026-06-02", type: "Brake repair", description: "Front brake pads and inspection", cost: 48500, nextDue: "2026-08-01" },
];

export const fuelLogs: FuelLog[] = [
  { id: "fuel_001", vehicleId: "veh_001", date: "2026-06-03", odometer: 84120, liters: 48, cost: 17800, station: "Lanka IOC - Borella" },
];

export const accounts: Account[] = [
  { id: "acc_1000", code: "1000", name: "Assets", type: "asset" },
  { id: "acc_1010", code: "1010", name: "Cash on Hand", type: "asset", parent: "1000", is_cash: true },
  { id: "acc_1020", code: "1020", name: "Bank Current Account", type: "asset", parent: "1000", is_bank: true },
  { id: "acc_1100", code: "1100", name: "Accounts Receivable", type: "asset", parent: "1000" },
  { id: "acc_2000", code: "2000", name: "Liabilities", type: "liability" },
  { id: "acc_3000", code: "3000", name: "Equity", type: "equity" },
  { id: "acc_4000", code: "4000", name: "Income", type: "income" },
  { id: "acc_4100", code: "4100", name: "Project Revenue", type: "income", parent: "4000" },
  { id: "acc_5000", code: "5000", name: "Expenses", type: "expense" },
  { id: "acc_5100", code: "5100", name: "Material Expense", type: "expense", parent: "5000" },
  { id: "acc_5200", code: "5200", name: "Payroll Expense", type: "expense", parent: "5000" },
];

export const postedJournalEntries: PostedJournalEntry[] = [
  {
    id: "pje_001",
    code: "JE-1001",
    project_id: "prj_001",
    date: "2026-06-01",
    description: "Client advance received",
    sourceModule: "project",
    sourceReference: "PAY-1001",
    lines: [
      { accountCode: "1020", accountName: "Bank Current Account", debit: 7720000, credit: 0, category: "asset" },
      { accountCode: "1100", accountName: "Accounts Receivable", debit: 0, credit: 7720000, category: "asset" },
    ],
  },
  {
    id: "pje_002",
    code: "JE-1002",
    project_id: "prj_001",
    date: "2026-06-02",
    description: "Steel material purchase",
    sourceModule: "project",
    sourceReference: "EXP-1001",
    lines: [
      { accountCode: "5100", accountName: "Material Expense", debit: 2450000, credit: 0, category: "expense" },
      { accountCode: "1020", accountName: "Bank Current Account", debit: 0, credit: 2450000, category: "asset" },
    ],
  },
  {
    id: "pje_003",
    project_id: "prj_001",
    code: "JE-1003",
    date: "2026-06-02",
    description: "Petty cash issued",
    sourceModule: "project",
    sourceReference: "PC-001",
    lines: [
      { accountCode: "1010", accountName: "Cash on Hand", debit: 50000, credit: 0, category: "asset" },
      { accountCode: "1020", accountName: "Bank Current Account", debit: 0, credit: 50000, category: "asset" },
    ],
  },
];

export const debtorAgingRows: DebtorAgingRow[] = [
  { project: "Warehouse mezzanine extension", customer: "Ceylon Logistics PLC", milestone: "Progress claim 1", dueDate: "2026-06-20", dueAmount: 5800000, paid: 0, outstanding: 5800000, overdueDays: 0 },
  { project: "Factory floor renovation", customer: "Southern Apparel Holdings", milestone: "Final payment", dueDate: "2026-05-15", dueAmount: 2600000, paid: 1200000, outstanding: 1400000, overdueDays: 20 },
  { project: "Hotel service yard upgrade", customer: "Northshore Developers", milestone: "Retention release", dueDate: "2026-03-01", dueAmount: 900000, paid: 0, outstanding: 900000, overdueDays: 95 },
];

export const clientAccessTokens: ClientAccess[] = [
  { token: "portal-skill-demo-2026", project_id: "prj_001", expiresAt: "2026-12-31", active: true },
  { token: "expired-demo-token", project_id: "prj_002", expiresAt: "2026-01-01", active: false },
];

export const projectStatusLogs: ProjectStatusLog[] = [
  { id: "psl_001", project_id: "prj_001", fromStatus: "assigned", toStatus: "in_progress", changedBy: "Kasun Jayasinghe", changedAt: "2026-06-01" },
  { id: "psl_002", project_id: "prj_003", fromStatus: "in_progress", toStatus: "on_hold", reason: "Client drawing revision pending.", changedBy: "Kasun Jayasinghe", changedAt: "2026-06-03" },
];

export const projectTeams: ProjectTeamAssignment[] = [
  { id: "pta_001", project_id: "prj_001", employeeId: "emp_001", employeeName: "Kasun Jayasinghe", roleOnProject: "Project Manager", assignedDate: "2026-06-01", status: "active" },
  { id: "pta_002", project_id: "prj_001", employeeId: "emp_008", employeeName: "Tharindu Wijesinghe", roleOnProject: "Technical Officer", assignedDate: "2026-06-02", status: "removed", removedDate: "2026-06-04" },
  { id: "pta_003", project_id: "prj_002", employeeId: "emp_003", employeeName: "Sajith Kumara", roleOnProject: "Measurement Engineer", assignedDate: "2026-05-26", status: "active" },
];

export const projectProgressUpdates: ProjectProgressUpdate[] = [
  { id: "ppu_001", project_id: "prj_001", date: "2026-06-03", title: "Steel fabrication started", summary: "Main beam fabrication released to workshop.", percentComplete: 42, blockers: "Awaiting night work permit.", nextSteps: "Confirm site access plan.", clientVisible: true, attachments: [] },
  { id: "ppu_002", project_id: "prj_002", date: "2026-06-02", title: "Floor area 2 completed", summary: "Concrete repair completed in production zone 2.", percentComplete: 64, nextSteps: "Drainage trench repair.", clientVisible: false, attachments: [] },
];

export const projectExpenses: ProjectExpense[] = [
  { id: "pex_001", project_id: "prj_001", code: "EXP-1001", category: "material", date: "2026-06-02", vendorOrPayee: "Lanka Steel Traders", amount: 2450000, paymentMethod: "Bank transfer", approvalStatus: "approved", notes: "Advance for steel sections" },
  { id: "pex_002", project_id: "prj_001", code: "EXP-1002", category: "transport", date: "2026-06-03", vendorOrPayee: "City Logistics", amount: 85000, paymentMethod: "Petty cash", approvalStatus: "pending", notes: "Material transport" },
  { id: "pex_003", project_id: "prj_004", code: "EXP-1003", category: "labour", date: "2026-05-28", vendorOrPayee: "Site labour team", amount: 980000, paymentMethod: "Cash", approvalStatus: "approved" },
];

export const clientPayments: ClientPayment[] = [
  { id: "pay_001", project_id: "prj_001", code: "PAY-1001", customer: "Ceylon Logistics PLC", date: "2026-06-01", amount: 7720000, method: "Bank transfer", milestoneReference: "Advance", referenceNo: "BNK-8821" },
  { id: "pay_002", project_id: "prj_004", code: "PAY-1002", customer: "Northshore Developers", date: "2026-06-01", amount: 28400000, method: "Cheque", milestoneReference: "Completion", referenceNo: "CHQ-1093" },
];

export const projectVehicles: ProjectVehicleAssignment[] = [
  { id: "pva_001", project_id: "prj_001", vehicleId: "veh_001", vehicleNo: "CAB-2841", category: "Crew cab", assignedDate: "2026-06-01", status: "active" },
  { id: "pva_002", project_id: "prj_002", vehicleId: "veh_002", vehicleNo: "WP-PG-7194", category: "Lorry", assignedDate: "2026-05-27", status: "active" },
];

export const pettyCash: PettyCash[] = [
  { id: "pc_001", project_id: "prj_001", employeeId: "emp_001", employeeName: "Kasun Jayasinghe", amount: 50000, allocatedAmount: 75000, issued: "2026-06-02", settled: 12000, status: "pending", notes: "Site transport and meals" },
  { id: "pc_002", project_id: "prj_002", employeeId: "emp_003", employeeName: "Sajith Kumara", amount: 30000, allocatedAmount: 30000, issued: "2026-05-28", settled: 30000, status: "settled" },
];

export const journalEntries: JournalEntry[] = [
  { id: "je_001", project_id: "prj_001", code: "JE-1001", date: "2026-06-01", description: "Client advance received", debit: 7720000, credit: 0 },
  { id: "je_002", project_id: "prj_001", code: "JE-1002", date: "2026-06-02", description: "Steel material purchase", debit: 0, credit: 2450000 },
];

export const stockItems: StockItem[] = [
  { id: "itm_001", code: "ITM-001", name: "Cement 50kg", category: "Material", unit: "bags", standardCost: 2850, preferredSupplier: "BuildMart Colombo", status: "active", usedInRequest: true },
  { id: "itm_002", code: "ITM-002", name: "GI pipe 2 inch", category: "Steel", unit: "lengths", standardCost: 7200, preferredSupplier: "Lanka Steel Traders", status: "active", usedInRequest: true },
  { id: "itm_003", code: "ITM-003", name: "PVC drain pipe", category: "Plumbing", unit: "m", standardCost: 1450, preferredSupplier: "AquaFlow Suppliers", status: "active" },
  { id: "itm_004", code: "ITM-004", name: "Safety helmet", category: "PPE", unit: "nos", standardCost: 1800, preferredSupplier: "SiteSafe Lanka", status: "inactive" },
];

export const suppliers: Supplier[] = [
  { id: "sup_001", code: "SUP-001", name: "Lanka Steel Traders", contact: "Mahesh Perera", phone: "+94 77 991 1000", email: "sales@lankasteel.lk", category: "Steel", rating: 4.7, status: "active", onTimePercent: 92, orderHistory: ["PO-6001"] },
  { id: "sup_002", code: "SUP-002", name: "BuildMart Colombo", contact: "Dilani Silva", phone: "+94 71 445 2200", email: "orders@buildmart.lk", category: "Building materials", rating: 4.2, status: "active", onTimePercent: 86, orderHistory: ["PO-6002"] },
  { id: "sup_003", code: "SUP-003", name: "AquaFlow Suppliers", contact: "Rizwan Haniffa", phone: "+94 76 220 4400", email: "hello@aquaflow.lk", category: "Plumbing", rating: 4.4, status: "active", onTimePercent: 89, orderHistory: [] },
];

export const stockRequests: StockRequest[] = [
  { id: "sr_001", project_id: "prj_001", code: "SR-5001", project: "Warehouse mezzanine extension", site: "Colombo 02", requestDate: "2026-06-02", requiredByDate: "2026-06-08", requester: "Kasun Jayasinghe", requestedBy: "Kasun Jayasinghe", status: "approved", remarks: "Initial steel package", lines: [{ id: "srl_001", itemId: "itm_002", itemCode: "ITM-002", itemName: "GI pipe 2 inch", quantity: 96, unit: "lengths", purpose: "Temporary bracing", boqItemReference: "BOQ-001", estimatedPrice: 691200 }] },
  { id: "sr_002", project_id: "prj_002", code: "SR-5002", project: "Factory floor renovation", site: "Galle", requestDate: "2026-05-28", requiredByDate: "2026-06-04", requester: "Kasun Jayasinghe", requestedBy: "Kasun Jayasinghe", status: "converted_to_po", remarks: "Floor repair materials", lines: [{ id: "srl_002", itemId: "itm_001", itemCode: "ITM-001", itemName: "Cement 50kg", quantity: 240, unit: "bags", purpose: "Floor screed", estimatedPrice: 684000 }] },
  { id: "sr_003", project_id: "prj_001", code: "SR-5003", project: "Warehouse mezzanine extension", site: "Colombo 02", requestDate: "2026-06-04", requiredByDate: "2026-06-06", requester: "Kasun Jayasinghe", requestedBy: "Kasun Jayasinghe", status: "draft", remarks: "PPE for night crew", lines: [{ id: "srl_003", itemId: "itm_004", itemCode: "ITM-004", itemName: "Safety helmet", quantity: 12, unit: "nos", purpose: "Safety", estimatedPrice: 21600 }] },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "po_001", project_id: "prj_001", code: "PO-6001", supplierId: "sup_001", supplier: "Lanka Steel Traders", linkedRequestId: "sr_001", linkedRequestCode: "SR-5001", project: "Warehouse mezzanine extension", site: "Colombo 02", issueDate: "2026-06-03", expectedDeliveryDate: "2026-06-07", grandTotal: 2450000, status: "pending_approval", lines: [{ id: "pol_001", itemId: "itm_002", itemName: "GI pipe 2 inch", orderedQty: 96, unit: "lengths", unitPrice: 7200, tax: 124416, receivedQuantity: 0 }] },
  { id: "po_002", project_id: "prj_002", code: "PO-6002", supplierId: "sup_002", supplier: "BuildMart Colombo", linkedRequestId: "sr_002", linkedRequestCode: "SR-5002", project: "Factory floor renovation", site: "Galle", issueDate: "2026-05-29", expectedDeliveryDate: "2026-06-02", grandTotal: 780000, status: "issued", lines: [{ id: "pol_002", itemId: "itm_001", itemName: "Cement 50kg", orderedQty: 240, unit: "bags", unitPrice: 2850, tax: 61560, receivedQuantity: 200 }] },
];

export const goodsReceipts: GoodsReceipt[] = [
  { id: "gr_001", project_id: "prj_002", code: "GR-7001", poId: "po_002", poCode: "PO-6002", receivedDate: "2026-06-02", receivedBy: "Malith Silva", lines: [{ itemId: "itm_001", itemName: "Cement 50kg", orderedQty: 240, receivedQty: 200, damagedQty: 0 }] },
];

export const inventoryBalances: InventoryBalance[] = [
  { id: "inv_001", project_id: "prj_002", site: "Galle", itemId: "itm_001", item: "Cement 50kg", category: "Material", unit: "bags", currentBalance: 240, reorderLevel: 80 },
  { id: "inv_002", project_id: "prj_001", site: "Colombo 02", itemId: "itm_002", item: "GI pipe 2 inch", category: "Steel", unit: "lengths", currentBalance: 96, reorderLevel: 100 },
  { id: "inv_003", project_id: "prj_001", site: "Colombo 02", itemId: "itm_003", item: "PVC drain pipe", category: "Plumbing", unit: "m", currentBalance: 42, reorderLevel: 50 },
];
