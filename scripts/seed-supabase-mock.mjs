import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Read environment variables
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function selectOne(table, column, value) {
  const { data, error } = await supabase.from(table).select("*").eq(column, value).maybeSingle();
  if (error) throw new Error(`${table}.${column}: ${error.message}`);
  return data;
}

async function findOrCreate(table, column, row) {
  console.log(`Checking existing for ${table} on column ${column} with value ${row[column]}...`);
  const existing = await selectOne(table, column, row[column]);
  console.log(`Result for ${table}:`, existing ? `Found ID ${existing.id}` : "Not found");
  if (existing) return existing;
  const { data, error } = await supabase.from(table).insert(row).select("*").single();
  if (error) {
    console.error(`Error details for ${table}:`, JSON.stringify(error, null, 2));
    throw new Error(`insert ${table}: ${error.message}`);
  }
  return data;
}

async function findAuthUser(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(`list auth users: ${error.message}`);
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 100) return undefined;
    page += 1;
  }
}

async function ensureAppUser(input) {
  const existing = await selectOne("app_users", "email", input.email);
  if (existing) return existing;

  let authUser = await findAuthUser(input.email);
  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: input.email,
      password: "SkillDemo@123",
      email_confirm: true,
      user_metadata: { full_name: input.full_name, role: input.role },
    });
    if (error) throw new Error(`create auth user ${input.email}: ${error.message}`);
    authUser = data.user;
  }

  const { data, error } = await supabase
    .from("app_users")
    .insert({ id: authUser.id, employee_code: input.employee_code, full_name: input.full_name, email: input.email, role: input.role })
    .select("*")
    .single();
  if (error) throw new Error(`insert app_users: ${error.message}`);
  return data;
}

async function insertIfMissing(table, column, value, row) {
  const existing = await selectOne(table, column, value);
  if (existing) return existing;
  const { data, error } = await supabase.from(table).insert(row).select("*").single();
  if (error) throw new Error(`insert ${table}: ${error.message}`);
  return data;
}

async function main() {
  console.log("Starting Supabase database seeding...");

  // 1. Departments
  const departments = {};
  for (const row of [
    { key: "Projects", name: "Projects", code: "PRJ" },
    { key: "Marketing", name: "Marketing", code: "MKT" },
    { key: "QS", name: "Quantity Surveying", code: "QS" },
    { key: "Stock", name: "Stores", code: "STK" },
    { key: "HR", name: "Human Resources", code: "HR" },
    { key: "Finance", name: "Finance", code: "FIN" },
    { key: "Vehicles", name: "Vehicle Management", code: "VEH" },
  ]) {
    departments[row.key] = await findOrCreate("departments", "code", { name: row.name, code: row.code });
  }
  console.log("Seeded departments.");

  // 2. Positions
  const positions = {};
  for (const row of [
    { title: "Project Manager", department_id: departments.Projects.id },
    { title: "Marketing Executive", department_id: departments.Marketing.id },
    { title: "QS Engineer", department_id: departments.QS.id },
    { title: "Technical Officer", department_id: departments.Projects.id },
    { title: "Store Keeper", department_id: departments.Stock.id },
    { title: "Accountant", department_id: departments.Finance.id },
    { title: "Fleet Coordinator", department_id: departments.Vehicles.id },
  ]) {
    positions[row.title] = await findOrCreate("positions", "title", row);
  }
  console.log("Seeded positions.");

  // 3. Work Roles
  const workRoles = {};
  for (const row of [
    { name: "Project delivery", description: "Project planning and site delivery" },
    { name: "Lead handling", description: "Marketing and customer follow-up" },
    { name: "Estimation", description: "QS estimating and BOQ review" },
    { name: "Site supervision", description: "Daily site supervision" },
    { name: "Site stores", description: "Material receiving and stock control" },
    { name: "Finance", description: "Accounts and payments" },
    { name: "Fleet", description: "Vehicle allocation and maintenance" },
  ]) {
    workRoles[row.name] = await findOrCreate("work_roles", "name", row);
  }
  console.log("Seeded work roles.");

  // 4. App Users
  const users = {};
  for (const row of [
    { employee_code: "USR-001", full_name: "Demo Super Admin", email: "super_admin@demo.local", role: "super_admin" },
    { employee_code: "USR-002", full_name: "Demo Marketing Executive", email: "marketing_executive@demo.local", role: "marketing_executive" },
    { employee_code: "USR-003", full_name: "Demo QS Engineer", email: "qs_engineer@demo.local", role: "qs_engineer" },
    { employee_code: "USR-004", full_name: "Demo Project Manager", email: "project_manager@demo.local", role: "project_manager" },
    { employee_code: "USR-005", full_name: "Demo Store Keeper", email: "store_keeper@demo.local", role: "store_keeper" },
    { employee_code: "USR-006", full_name: "Demo Accountant", email: "accountant@demo.local", role: "accountant" },
    { employee_code: "USR-007", full_name: "Demo Fleet Coordinator", email: "vehicle_manager@demo.local", role: "vehicle_manager" },
  ]) {
    users[row.email] = await ensureAppUser(row);
  }
  console.log("Seeded app users.");

  // 5. Employees
  const employees = {};
  for (const row of [
    ["EMP-001", "Demo Project Manager", "project_manager@demo.local", "+94 77 100 0001", "Projects", "Project Manager", "Project delivery", "monthly", 240000, "2022-01-10"],
    ["EMP-002", "Demo Marketing Executive", "marketing_executive@demo.local", "+94 77 100 0002", "Marketing", "Marketing Executive", "Lead handling", "monthly", 165000, "2023-03-01"],
    ["EMP-003", "Demo QS Engineer", "qs_engineer@demo.local", "+94 77 100 0003", "QS", "QS Engineer", "Estimation", "monthly", 210000, "2021-11-15"],
    ["EMP-004", "Demo Technical Officer", "technical_officer@demo.local", "+94 77 100 0004", "Projects", "Technical Officer", "Site supervision", "daily", 6500, "2024-02-01"],
    ["EMP-005", "Demo Store Keeper", "store_keeper@demo.local", "+94 77 100 0005", "Stock", "Store Keeper", "Site stores", "monthly", 145000, "2023-08-12"],
    ["EMP-006", "Demo Accountant", "accountant@demo.local", "+94 77 100 0006", "Finance", "Accountant", "Finance", "monthly", 225000, "2020-06-01"],
    ["EMP-007", "Demo Fleet Coordinator", "vehicle_manager@demo.local", "+94 77 100 0007", "Vehicles", "Fleet Coordinator", "Fleet", "monthly", 185000, "2022-09-01"],
  ]) {
    employees[row[0]] = await findOrCreate("employees", "employee_code", {
      employee_code: row[0],
      full_name: row[1],
      email: row[2],
      phone: row[3],
      department_id: departments[row[4]].id,
      position_id: positions[row[5]].id,
      salary_type: row[7],
      base_salary: row[8],
      basic_salary: row[8],
      joined_on: row[9],
      joining_date: row[9],
      is_active: true,
      user_id: users[row[2]]?.id ?? null,
      allowances: JSON.stringify([{ label: "Travel Allowance", amount: 15000 }]),
      deductions: JSON.stringify([{ label: "EPF Employee", amount: 12000 }]),
    });
  }
  console.log("Seeded employees.");

  // 6. Customers
  const customers = {};
  for (const row of [
    { customer_code: "CUS-001", name: "Urban Habitat Developers", display_name: "Urban Habitat Developers", company_name: "Urban Habitat Developers", primary_contact: "Praveen", primary_phone: "+94 77 120 4500", email: "praveen@urbanhabitat.lk", phone: "+94 77 120 4500", address: "Rajagiriya", city: "Rajagiriya", district: "Colombo" },
    { customer_code: "CUS-002", name: "Harbour Foods Exporters", display_name: "Harbour Foods Exporters", company_name: "Harbour Foods Exporters", primary_contact: "Nimali", primary_phone: "+94 71 884 2201", email: "nimali@harbourfoods.lk", phone: "+94 71 884 2201", address: "Mutwal", city: "Mutwal", district: "Colombo" },
    { customer_code: "CUS-003", name: "Hill Crest Hospital", display_name: "Hill Crest Hospital", company_name: "Hill Crest Hospital", primary_contact: "Sameera", primary_phone: "+94 76 420 1188", email: "sameera@hillcrest.lk", phone: "+94 76 420 1188", address: "Kandy", city: "Kandy", district: "Kandy" },
    { customer_code: "CUS-004", name: "Metro Auto Components", display_name: "Metro Auto Components", company_name: "Metro Auto Components", primary_contact: "Ruwan", primary_phone: "+94 75 310 7788", email: "ruwan@metroauto.lk", phone: "+94 75 310 7788", address: "Katunayake", city: "Katunayake", district: "Gampaha" },
  ]) {
    customers[row.name] = await findOrCreate("customers", "customer_code", row);
  }
  console.log("Seeded customers.");

  // 7. Leads
  const leads = {};
  for (const row of [
    {
      lead_code: "LEAD-1001",
      title: "Skill One Tower Fit-Out",
      customer_id: customers["Urban Habitat Developers"].id,
      client_name: "Urban Habitat Developers",
      email: "praveen@urbanhabitat.lk",
      phone: "+94 77 120 4500",
      project_type: "full_project",
      status: "approved",
      priority: "urgent",
      estimated_budget: 68500000,
      assigned_to: users["marketing_executive@demo.local"].id,
      assigned_marketing_owner_id: users["marketing_executive@demo.local"].id,
      lead_source: "Cold Call",
      project_location: "Rajagiriya",
      requirement_description: "Complete interior fit-out for four office floors including civil, MEP, joinery, testing, and handover.",
      notes: "Client requires high quality finishes.",
    },
    {
      lead_code: "LEAD-1002",
      title: "Cold Store Loading Dock Canopy",
      customer_id: customers["Harbour Foods Exporters"].id,
      client_name: "Harbour Foods Exporters",
      email: "nimali@harbourfoods.lk",
      phone: "+94 71 884 2201",
      project_type: "construction_only",
      status: "quotation_submitted",
      priority: "high",
      estimated_budget: 14800000,
      assigned_to: users["marketing_executive@demo.local"].id,
      assigned_marketing_owner_id: users["marketing_executive@demo.local"].id,
      lead_source: "Website Referral",
      project_location: "Mutwal",
      requirement_description: "Steel canopy and drainage improvements for refrigerated truck loading area.",
      notes: "Must be completed before rainy season.",
    },
    {
      lead_code: "LEAD-1003",
      title: "Ward Renovation Drawing Package",
      customer_id: customers["Hill Crest Hospital"].id,
      client_name: "Hill Crest Hospital",
      email: "sameera@hillcrest.lk",
      phone: "+94 76 420 1188",
      project_type: "drawing_only",
      status: "qs_estimation_pending",
      priority: "medium",
      estimated_budget: 4200000,
      assigned_to: users["marketing_executive@demo.local"].id,
      assigned_marketing_owner_id: users["marketing_executive@demo.local"].id,
      lead_source: "Exhibition",
      project_location: "Kandy",
      requirement_description: "Drawing package for phased ward renovation.",
      notes: "Strict hospital standards apply.",
    },
    {
      lead_code: "LEAD-1004",
      title: "Factory Utilities 3D Coordination",
      customer_id: customers["Metro Auto Components"].id,
      client_name: "Metro Auto Components",
      email: "ruwan@metroauto.lk",
      phone: "+94 75 310 7788",
      project_type: "2d_3d",
      status: "client_discussion",
      priority: "high",
      estimated_budget: 9600000,
      assigned_to: users["super_admin@demo.local"].id,
      assigned_marketing_owner_id: users["super_admin@demo.local"].id,
      lead_source: "Client Repeat",
      project_location: "Katunayake",
      requirement_description: "2D and 3D coordination for compressed air, power trays, and drainage diversions.",
      notes: "Coordination with existing system is critical.",
    },
  ]) {
    leads[row.title] = await findOrCreate("leads", "lead_code", row);
  }
  console.log("Seeded leads.");

  // 8. Lead Communications
  await insertIfMissing("lead_communications", "subject", "Skill One approval meeting", {
    lead_id: leads["Skill One Tower Fit-Out"].id,
    type: "meeting",
    subject: "Skill One approval meeting",
    notes: "Client approved revised fit-out scope and requested weekly progress updates.",
    created_by: users["marketing_executive@demo.local"].id,
  });
  console.log("Seeded lead communications.");

  // 9. Lead Status Logs
  for (const lead of Object.values(leads)) {
    await insertIfMissing("lead_status_logs", "note", `Seeded status log for ${lead.title}`, {
      lead_id: lead.id,
      from_status: null,
      to_status: lead.status,
      changed_by: users["marketing_executive@demo.local"].id,
      note: `Seeded status log for ${lead.title}`,
    });
  }
  console.log("Seeded lead status logs.");

  // 10. Estimations
  const estimations = {};
  for (const row of [
    ["EST-2001", "Skill One Tower Fit-Out Estimate", "Skill One Tower Fit-Out", "approved_baseline", 56700000, 9639000, 66339000],
    ["EST-2002", "Loading Dock Canopy Estimate", "Cold Store Loading Dock Canopy", "ready_for_quotation", 12200000, 1830000, 14030000],
    ["EST-2003", "Ward Renovation Drawing Estimate", "Ward Renovation Drawing Package", "draft", 3400000, 612000, 4012000],
  ]) {
    estimations[row[1]] = await findOrCreate("estimations", "estimation_code", {
      estimation_code: row[0],
      title: row[1],
      lead_id: leads[row[2]].id,
      status: row[3],
      prepared_by: users["qs_engineer@demo.local"].id,
      assigned_qs_engineer: users["qs_engineer@demo.local"].id,
      material_cost_total: row[4] * 0.6,
      labour_cost_total: row[4] * 0.2,
      equipment_cost_total: row[4] * 0.15,
      overhead_cost_total: row[4] * 0.05,
      profit_margin_pct: 18.00,
      subtotal: row[4],
      profit_margin_value: row[5],
      grand_total: row[6],
      notes: "QS baseline estimation.",
    });
  }
  console.log("Seeded estimations.");

  // 11. Estimation Lines
  for (const line of [
    ["Skill One Tower Fit-Out Estimate", "CIV-001", "Partitions, ceilings, floor finishes", "floors", 4, 5750000, "Civil Finishings"],
    ["Skill One Tower Fit-Out Estimate", "MEP-001", "Electrical, plumbing, fire and HVAC supports", "lot", 1, 28600000, "MEP Fit-out"],
    ["Loading Dock Canopy Estimate", "STL-001", "Fabricate and install loading dock canopy", "lot", 1, 8200000, "Metal Work"],
    ["Ward Renovation Drawing Estimate", "DES-001", "Survey and drawing preparation", "lot", 1, 2850000, "Design Works"],
  ]) {
    await insertIfMissing("estimation_lines", "item_code", line[1], {
      estimation_id: estimations[line[0]].id,
      item_code: line[1],
      description: line[2],
      unit: line[3],
      quantity: line[4],
      rate: line[5],
      category: line[6],
      remarks: "Approved standard QS item",
    });
  }
  console.log("Seeded estimation lines.");

  // 12. Projects
  const projects = {};
  for (const row of [
    ["PRJ-4001", "Skill One Tower Fit-Out", "Skill One Tower Fit-Out", "Urban Habitat Developers", "full_project", "in_progress", "2026-06-03", "2026-09-18", 68250000, "Rajagiriya"],
    ["PRJ-4002", "Legacy Office Partition Rectification", "Skill One Tower Fit-Out", "Urban Habitat Developers", "construction_only", "completed", "2026-04-05", "2026-05-20", 6200000, "Rajagiriya"],
    ["PRJ-4003", "Factory Utilities Coordination", "Factory Utilities 3D Coordination", "Metro Auto Components", "2d_3d", "assigned", "2026-06-17", "2026-08-05", 9600000, "Katunayake"],
  ]) {
    projects[row[1]] = await findOrCreate("projects", "project_code", {
      project_code: row[0],
      name: row[1],
      project_name: row[1],
      lead_id: leads[row[2]].id,
      customer_id: customers[row[3]].id,
      project_type: row[4],
      status: row[5],
      start_date: row[6],
      end_date: row[7],
      budget: row[8],
      budget_amount: row[8],
      manager_id: users["project_manager@demo.local"].id,
      assigned_project_manager_id: users["project_manager@demo.local"].id,
      assigned_technical_officer_id: users["super_admin@demo.local"].id,
      priority: "high",
      progress_percent: row[5] === "completed" ? 100.00 : row[5] === "in_progress" ? 42.00 : 0.00,
      address: row[9],
      notes: "Project setup from quotation conversion.",
    });
  }
  console.log("Seeded projects.");

  // 13. Quotations
  const quotations = {};
  for (const row of [
    ["QUO-3001", "Skill One Fit-Out Quotation", "Skill One Tower Fit-Out", "Skill One Tower Fit-Out Estimate", "approved", 68250000, "2026-07-15"],
    ["QUO-3002", "Loading Dock Canopy Quotation", "Cold Store Loading Dock Canopy", "Loading Dock Canopy Estimate", "client_sent", 14800000, "2026-06-30"],
    ["QUO-3003", "Ward Drawing Package Quotation", "Ward Renovation Drawing Package", "Ward Renovation Drawing Estimate", "draft", 4012000, "2026-07-05"],
  ]) {
    quotations[row[0]] = await findOrCreate("quotations", "quotation_no", {
      quotation_no: row[0],
      quotation_code: row[0],
      title: row[1],
      lead_id: leads[row[2]].id,
      estimation_id: estimations[row[3]].id,
      project_id: row[0] === "QUO-3001" ? projects["Skill One Tower Fit-Out"].id : null,
      status: row[4],
      subtotal: row[5],
      discount: 0,
      discount_value: 0,
      tax_total: row[5] * 0.18,
      tax_value: row[5] * 0.18,
      grand_total: row[5] * 1.18,
      valid_until: row[6],
      issue_date: "2026-06-01",
      payment_terms_text: "40% advance, 50% progress, 10% handover",
      notes_and_exclusions: "Excludes public holidays and weekend work unless approved.",
      version_number: 1,
      created_by: users["marketing_executive@demo.local"].id,
    });
  }
  console.log("Seeded quotations.");

  // 14. Sites
  const sites = {};
  for (const row of [
    ["Skill One Tower - Floors 7 to 10", "Skill One Tower Fit-Out", "Rajagiriya", users["project_manager@demo.local"].id],
    ["Metro Auto Plant 2", "Factory Utilities Coordination", "Katunayake", users["project_manager@demo.local"].id],
  ]) {
    sites[row[0]] = await findOrCreate("sites", "site_code", {
      name: row[0],
      site_name: row[0],
      site_code: row[0] === "Skill One Tower - Floors 7 to 10" ? "SITE-4001" : "SITE-4002",
      project_id: projects[row[1]].id,
      address: row[2],
      supervisor_id: row[3],
    });
  }
  console.log("Seeded sites.");

  // Link projects quotation_id and site_id now that they are seeded
  await supabase.from("projects").update({
    quotation_id: quotations["QUO-3001"].id,
    site_id: sites["Skill One Tower - Floors 7 to 10"].id
  }).eq("id", projects["Skill One Tower Fit-Out"].id);
  console.log("Linked project references.");

  // 15. Suppliers
  const suppliers = {};
  for (const row of [
    { name: "BuildPro Interiors", supplier_code: "SUP-001", category: "Interior", contact_person: "Dilshan Perera", phone: "+94 77 501 1001", email: "orders@buildpro.lk", address: "Colombo", status: "active" },
    { name: "Lanka Steel & Ceiling", supplier_code: "SUP-002", category: "Steel", contact_person: "Ajantha Silva", phone: "+94 71 501 1002", email: "sales@lankasteelceiling.lk", address: "Kelaniya", status: "active" },
    { name: "PowerLine Traders", supplier_code: "SUP-003", category: "Electrical", contact_person: "Rizwan Hamid", phone: "+94 76 501 1003", email: "hello@powerline.lk", address: "Nugegoda", status: "active" },
    { name: "AquaBuild Supplies", supplier_code: "SUP-004", category: "Plumbing", contact_person: "Nadeeka Dias", phone: "+94 75 501 1004", email: "orders@aquabuild.lk", address: "Moratuwa", status: "active" },
  ]) {
    suppliers[row.name] = await findOrCreate("suppliers", "supplier_code", row);
  }
  console.log("Seeded suppliers.");

  // 16. Units of measure are seeded by SQL. Fetch them.
  const { data: unitsData } = await supabase.from("units_of_measure").select("*");
  const units = Object.fromEntries(unitsData.map((u) => [u.code, u]));

  // 17. Materials
  const materials = {};
  for (const row of [
    ["ITM-001", "Gypsum board 12.5mm", "sheets", 120, 3900],
    ["ITM-002", "GI ceiling channel", "lengths", 180, 1850],
    ["ITM-003", "2.5 sqmm copper cable", "rolls", 20, 48500],
    ["ITM-004", "PVC waste pipe 50mm", "lengths", 30, 1650],
    ["ITM-005", "Safety helmet", "nos", 20, 1900],
    ["ITM-006", "Laminate sheet premium", "sheets", 15, 14500],
  ]) {
    materials[row[0]] = await findOrCreate("materials", "sku", {
      sku: row[0],
      material_code: row[0],
      category: row[2] === "sheets" ? "Drywall" : row[2] === "lengths" ? "Framing" : "Safety",
      name: row[1],
      unit_id: units[row[2]].id,
      reorder_level: row[3],
      standard_rate: row[4],
      standard_cost: row[4],
      is_active: true,
    });
  }
  console.log("Seeded materials.");

  // 18. Site Inventory
  for (const row of [
    ["Skill One Tower - Floors 7 to 10", "ITM-001", 418],
    ["Skill One Tower - Floors 7 to 10", "ITM-002", 530],
    ["Skill One Tower - Floors 7 to 10", "ITM-003", 0],
    ["Skill One Tower - Floors 7 to 10", "ITM-004", 86],
    ["Skill One Tower - Floors 7 to 10", "ITM-005", 18],
  ]) {
    const existing = await supabase
      .from("site_inventory")
      .select("*")
      .eq("site_id", sites[row[0]].id)
      .eq("material_id", materials[row[1]].id)
      .maybeSingle();
    if (existing.error) throw new Error(`site_inventory: ${existing.error.message}`);
    if (!existing.data) {
      await supabase.from("site_inventory").insert({
        site_id: sites[row[0]].id,
        material_id: materials[row[1]].id,
        quantity: row[2],
        current_balance: row[2]
      });
    }
  }
  console.log("Seeded site inventory.");

  // 19. Stock Requests
  const stockRequests = {};
  stockRequests.firstCivil = await insertIfMissing("stock_requests", "request_code", "SR-5001", {
    request_code: "SR-5001",
    project_id: projects["Skill One Tower Fit-Out"].id,
    site_id: sites["Skill One Tower - Floors 7 to 10"].id,
    requested_by: users["project_manager@demo.local"].id,
    status: "converted_to_po",
    required_on: "2026-06-06",
    required_by_date: "2026-06-06",
    request_date: "2026-06-03",
    notes: "First civil material release for floors 7 and 8.",
    remarks: "First civil material release for floors 7 and 8.",
  });
  stockRequests.electrical = await insertIfMissing("stock_requests", "request_code", "SR-5002", {
    request_code: "SR-5002",
    project_id: projects["Skill One Tower Fit-Out"].id,
    site_id: sites["Skill One Tower - Floors 7 to 10"].id,
    requested_by: users["project_manager@demo.local"].id,
    status: "approved",
    required_on: "2026-06-12",
    required_by_date: "2026-06-12",
    request_date: "2026-06-07",
    notes: "Electrical first fix material.",
    remarks: "Electrical first fix material.",
  });
  console.log("Seeded stock requests.");

  // 20. Stock Request Items
  for (const row of [
    [stockRequests.firstCivil.id, "ITM-001", "Partition and ceiling boards", "sheets", 640],
    [stockRequests.firstCivil.id, "ITM-002", "Ceiling grid and partition framing", "lengths", 980],
    [stockRequests.electrical.id, "ITM-003", "Lighting and small power circuits", "rolls", 75],
  ]) {
    await insertIfMissing("stock_request_items", "description", row[2], {
      stock_request_id: row[0],
      material_id: materials[row[1]].id,
      description: row[2],
      unit: row[3],
      quantity: row[4],
      purpose: row[2],
      estimated_price: materials[row[1]].standard_rate * row[4]
    });
  }
  console.log("Seeded stock request items.");

  // 21. Purchase Orders
  const po1 = await findOrCreate("purchase_orders", "po_no", {
    po_no: "PO-6001",
    po_number: "PO-6001",
    supplier_id: suppliers["BuildPro Interiors"].id,
    stock_request_id: stockRequests.firstCivil.id,
    status: "issued",
    order_date: "2026-06-04",
    issue_date: "2026-06-04",
    expected_date: "2026-06-06",
    expected_delivery_date: "2026-06-06",
    subtotal: 4462170,
    tax_total: 387810,
    grand_total: 4850000,
    total_amount: 4850000,
    created_by: users["store_keeper@demo.local"].id,
  });
  const po2 = await findOrCreate("purchase_orders", "po_no", {
    po_no: "PO-6002",
    po_number: "PO-6002",
    supplier_id: suppliers["PowerLine Traders"].id,
    stock_request_id: stockRequests.electrical.id,
    status: "pending_approval",
    order_date: "2026-06-08",
    issue_date: "2026-06-08",
    expected_date: "2026-06-12",
    expected_delivery_date: "2026-06-12",
    subtotal: 3637500,
    tax_total: 218250,
    grand_total: 3855750,
    total_amount: 3855750,
    created_by: users["store_keeper@demo.local"].id,
  });
  console.log("Seeded purchase orders.");

  // 22. Purchase Order Items
  const poItems = {};
  for (const row of [
    [po1.id, "ITM-001", "Gypsum board 12.5mm", "sheets", 640, 3900],
    [po1.id, "ITM-002", "GI ceiling channel", "lengths", 980, 1850],
    [po2.id, "ITM-003", "2.5 sqmm copper cable", "rolls", 75, 48500],
  ]) {
    poItems[row[2]] = await insertIfMissing("purchase_order_items", "description", row[2], {
      purchase_order_id: row[0],
      material_id: materials[row[1]].id,
      description: row[2],
      unit: row[3],
      quantity: row[4],
      rate: row[5],
      tax_amount: row[4] * row[5] * 0.18,
      received_quantity: row[0] === po1.id ? row[4] : 0,
    });
  }
  console.log("Seeded purchase order items.");

  // 23. Goods Receipts
  const grn = await findOrCreate("goods_receipts", "grn_no", {
    grn_no: "GR-7001",
    purchase_order_id: po1.id,
    received_date: "2026-06-06",
    received_by: users["store_keeper@demo.local"].id,
    notes: "First delivery received for Skill One Tower.",
  });
  console.log("Seeded goods receipts.");

  // 24. Goods Receipt Items
  for (const row of [
    ["Gypsum board 12.5mm", "ITM-001", 640],
    ["GI ceiling channel", "ITM-002", 780],
  ]) {
    await insertIfMissing("goods_receipt_items", "purchase_order_item_id", poItems[row[0]].id, {
      goods_receipt_id: grn.id,
      purchase_order_item_id: poItems[row[0]].id,
      material_id: materials[row[1]].id,
      quantity_received: row[2],
      received_quantity: row[2],
      damaged_quantity: 0,
    });
  }
  console.log("Seeded goods receipt items.");

  // 25. Stock Movements
  await insertIfMissing("stock_movements", "reference_id", grn.id, {
    material_id: materials["ITM-001"].id,
    site_id: sites["Skill One Tower - Floors 7 to 10"].id,
    movement_type: "in",
    quantity: 640,
    reference_type: "grn",
    reference_id: grn.id,
    created_by: users["store_keeper@demo.local"].id,
  });
  console.log("Seeded stock movements.");

  // 26. Attendance
  for (const row of [
    ["2026-06-07", "EMP-001", "present", "08:25", "17:40"],
    ["2026-06-07", "EMP-004", "present", "07:55", "18:10"],
    ["2026-06-07", "EMP-005", "present", "08:05", "17:30"],
    ["2026-06-07", "EMP-006", "leave", null, null],
  ]) {
    const existing = await supabase.from("attendance").select("*").eq("work_date", row[0]).eq("employee_id", employees[row[1]].id).maybeSingle();
    if (existing.error) throw new Error(`attendance: ${existing.error.message}`);
    if (!existing.data) {
      await supabase.from("attendance").insert({
        work_date: row[0],
        attendance_date: row[0],
        employee_id: employees[row[1]].id,
        status: row[2],
        check_in: row[3],
        check_out: row[4],
        notes: "Seeded attendance",
        site_id: sites["Skill One Tower - Floors 7 to 10"].id
      });
    }
  }
  console.log("Seeded attendance.");

  // 27. Leave Requests
  await insertIfMissing("leave_requests", "reason", "Medical leave for surgery", {
    employee_id: employees["EMP-003"].id,
    start_date: "2026-06-08",
    end_date: "2026-06-10",
    reason: "Medical leave for surgery",
    status: "approved",
    approved_by: users["super_admin@demo.local"].id
  });
  console.log("Seeded leave requests.");

  // 28. Payroll Batches
  const payrollBatch = await findOrCreate("payroll_batches", "batch_code", {
    batch_code: "PAY-2026-05-HO",
    period_start: "2026-05-01",
    period_end: "2026-05-31",
    status: "locked",
    locked_at: new Date().toISOString(),
    created_by: users["accountant@demo.local"].id
  });
  console.log("Seeded payroll batches.");

  // 29. Payroll Lines
  for (const row of [
    ["EMP-001", 240000, 15000, 12000, 0, 243000],
    ["EMP-003", 210000, 10000, 8000, 0, 212000],
  ]) {
    await insertIfMissing("payroll_lines", "employee_id", employees[row[0]].id, {
      payroll_batch_id: payrollBatch.id,
      employee_id: employees[row[0]].id,
      basic_salary: row[1],
      gross_pay: row[1],
      attendance_adjustment: 0,
      allowances: row[2],
      deductions: row[3],
      advances_recovered: row[4],
      payment_mode: "bank",
      net_pay: row[5]
    });
  }
  console.log("Seeded payroll lines.");

  // 30. Vehicles
  const vehicles = {};
  for (const row of [
    ["WP-CAB-4101", "Toyota", "Hilux Crew Cab", "owned", "assigned", 92410, "VEH-001"],
    ["WP-LO-8820", "Isuzu", "14 ft Lorry", "leased", "assigned", 151220, "VEH-002"],
    ["WP-VN-5532", "Nissan", "Caravan Van", "owned", "available", 68200, "VEH-003"],
    ["CP-EX-1198", "JCB", "3CX Excavator", "leased", "under_maintenance", 4210, "VEH-004"],
  ]) {
    vehicles[row[0]] = await findOrCreate("vehicles", "registration_no", {
      registration_no: row[0],
      registration_number: row[0],
      vehicle_code: row[6],
      make: row[1],
      model: row[2],
      category: row[2].toLowerCase().includes("excavator") ? "machinery" : row[2].toLowerCase().includes("van") ? "van" : "truck",
      ownership: row[3],
      ownership_status: row[3],
      status: row[4],
      current_status: row[4],
      current_meter: row[5],
      current_meter_reading: row[5],
      insurance_expiry: "2027-01-15",
      license_expiry: "2026-12-15",
      notes: `${row[1]} ${row[2]} site vehicle`
    });
  }
  console.log("Seeded vehicles.");

  // 31. Vehicle Assignments
  for (const row of [
    ["WP-CAB-4101", "EMP-001", "Skill One Tower Fit-Out", "2026-06-03"],
    ["WP-LO-8820", "EMP-005", "Skill One Tower Fit-Out", "2026-06-05"],
  ]) {
    await insertIfMissing("vehicle_assignments", "vehicle_id", vehicles[row[0]].id, {
      vehicle_id: vehicles[row[0]].id,
      employee_id: employees[row[1]].id,
      project_id: projects[row[2]].id,
      assigned_from: row[3],
    });
  }
  console.log("Seeded vehicle assignments.");

  // 32. Vehicle Fuel Logs
  await insertIfMissing("vehicle_fuel_logs", "cost", 21200, {
    vehicle_id: vehicles["WP-CAB-4101"].id,
    fuel_date: "2026-06-07",
    liters: 54,
    cost: 21200,
    meter_reading: 92380,
    station: "Ceypetco Rajagiriya"
  });
  console.log("Seeded vehicle fuel logs.");

  // 33. Vehicle Maintenance Logs
  await insertIfMissing("vehicle_maintenance_logs", "cost", 86500, {
    vehicle_id: vehicles["CP-EX-1198"].id,
    service_date: "2026-06-06",
    description: "Replace leaking hydraulic hose and pressure test machine.",
    cost: 86500,
    next_service_date: "2026-07-06",
  });
  console.log("Seeded vehicle maintenance logs.");

  // 34. Vehicle Meter Logs
  await insertIfMissing("vehicle_meter_logs", "meter_reading", 92410, {
    vehicle_id: vehicles["WP-CAB-4101"].id,
    meter_reading: 92410,
    notes: "Seeded current reading after weekly site run.",
  });
  console.log("Seeded vehicle meter logs.");

  // Accounts & Expense Categories are seeded by SQL.
  const { data: accountsData } = await supabase.from("accounts").select("*");
  const accounts = Object.fromEntries(accountsData.map((a) => [a.code, a]));

  const { data: expenseCategoriesData } = await supabase.from("expense_categories").select("*");
  const expenseCategories = Object.fromEntries(expenseCategoriesData.map((e) => [e.name, e]));

  // 35. Bank Accounts
  const mainBankAccount = await findOrCreate("bank_accounts", "account_name", {
    account_name: "Main Current Account",
    bank_name: "Commercial Bank",
    account_number: "001-445-9988",
    balance: 20475000,
  });
  console.log("Seeded bank accounts.");

  // 36 & 37. Journal Entries & Lines
  const journalEntry = await findOrCreate("journal_entries", "reference_no", {
    entry_no: "JE-2026-000001",
    reference_no: "JE-2026-000001",
    entry_date: "2026-06-03",
    transaction_date: "2026-06-03",
    status: "posted",
    memo: "Seeded initial capital injection",
    description: "Seeded initial capital injection",
    source: "system",
    project_id: null,
    created_by: users["accountant@demo.local"].id
  });
  await insertIfMissing("journal_lines", "debit", 25000000, {
    journal_entry_id: journalEntry.id,
    account_id: accounts["1200"].id, // Bank account
    debit: 25000000,
    credit: 0,
    description: "Initial cash injection"
  });
  await insertIfMissing("journal_lines", "credit", 25000000, {
    journal_entry_id: journalEntry.id,
    account_id: accounts["3000"].id, // Owner equity
    debit: 0,
    credit: 25000000,
    description: "Initial cash injection"
  });
  console.log("Seeded journal entries and lines.");

  // 38. Project Expenses
  const expensesList = [];
  for (const row of [
    ["Skill One Tower Fit-Out", "Material", "2026-06-04", 4850000, "Gypsum board, tracks, screws and insulation first lot"],
    ["Skill One Tower Fit-Out", "Labour", "2026-06-07", 1260000, "Week one partition and ceiling labour"],
    ["Skill One Tower Fit-Out", "Transport", "2026-06-08", 148000, "Night delivery unloading"],
  ]) {
    expensesList.push(await insertIfMissing("project_expenses", "description", row[4], {
      project_id: projects[row[0]].id,
      category_id: expenseCategories[row[1]].id,
      expense_date: row[2],
      amount: row[3],
      description: row[4],
      vendor_or_payee: "Multiple",
      payment_method: "Bank Transfer",
      approval_status: "approved",
      is_void: false,
      created_by: users["accountant@demo.local"].id,
    }));
  }
  console.log("Seeded project expenses.");

  // 39. Client Payments
  const clientPayment = await insertIfMissing("client_payments", "reference_no", "BNK-UHD-8821", {
    project_id: projects["Skill One Tower Fit-Out"].id,
    customer_id: customers["Urban Habitat Developers"].id,
    payment_date: "2026-06-03",
    amount: 20475000,
    method: "Bank transfer",
    payment_method: "Bank transfer",
    reference_no: "BNK-UHD-8821",
    milestone_ref: "Advance Payment",
    notes: "Initial advance for fit-out mobilization."
  });
  console.log("Seeded client payments.");

  // 40. Taxes are seeded. Fetch them.
  const { data: taxesData } = await supabase.from("taxes").select("*");
  const taxesObj = Object.fromEntries(taxesData.map((t) => [t.name, t]));

  // 41. Tax Entries
  await insertIfMissing("tax_entries", "taxable_amount", 17351694.92, {
    tax_id: taxesObj["VAT"].id,
    source: "client_payment",
    source_id: clientPayment.id,
    taxable_amount: 17351694.92,
    tax_amount: 3123305.08,
  });
  console.log("Seeded tax entries.");

  // 42. File Attachments
  await insertIfMissing("file_attachments", "file_name", "warehouse-existing-layout.xlsx", {
    bucket: "documents",
    bucket_name: "documents",
    path: "leads/1/warehouse-existing-layout.xlsx",
    storage_path: "leads/1/warehouse-existing-layout.xlsx",
    file_name: "warehouse-existing-layout.xlsx",
    original_name: "warehouse-existing-layout.xlsx",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size_bytes: 450000,
    file_size_bytes: 450000,
    entity_type: "lead",
    entity_id: leads["Skill One Tower Fit-Out"].id,
    title: "Warehouse layout drawings",
    is_client_visible: true,
    uploaded_by: users["marketing_executive@demo.local"].id,
  });
  console.log("Seeded file attachments.");

  // 43. Client Access Tokens
  const clientToken = await findOrCreate("client_access_tokens", "token", {
    token: "portal-skill-demo-2026",
    customer_id: customers["Urban Habitat Developers"].id,
    project_id: projects["Skill One Tower Fit-Out"].id,
    expires_at: "2026-12-31T23:59:59Z",
    is_active: true
  });
  console.log("Seeded client access tokens.");

  // 44. Client Responses
  await insertIfMissing("client_responses", "message", "Approved subject to staged handover and night-work permit.", {
    token_id: clientToken.id,
    project_id: projects["Skill One Tower Fit-Out"].id,
    lead_id: leads["Skill One Tower Fit-Out"].id,
    quotation_id: quotations["QUO-3001"].id,
    response: "approved",
    response_type: "approved",
    source: "client",
    message: "Approved subject to staged handover and night-work permit.",
    remarks: "Night-work permits must be verified."
  });
  console.log("Seeded client responses.");

  // 45. Audit Logs
  await insertIfMissing("audit_logs", "entity_id", "PRJ-4001", {
    actor_id: users["super_admin@demo.local"].id,
    action: "create",
    entity_type: "project",
    entity_id: "PRJ-4001",
    metadata: JSON.stringify({ reason: "quotation converted to project" })
  });
  console.log("Seeded audit logs.");

  // 46. BOQ Import Mappings
  const boqImportMapping = await findOrCreate("boq_import_mappings", "name", {
    name: "Standard Excel Template",
    mapping: JSON.stringify({ code: "A", description: "B", unit: "C", quantity: "D", rate: "E" })
  });
  console.log("Seeded BOQ import mappings.");

  // 47. BOQs
  const boq = await findOrCreate("boqs", "title", {
    project_id: projects["Skill One Tower Fit-Out"].id,
    estimation_id: estimations["Skill One Tower Fit-Out Estimate"].id,
    quotation_id: quotations["QUO-3001"].id,
    title: "Skill One Tower Fit-Out BOQ",
    boq_code: "BOQ-4001",
    version_number: 1,
    notes: "Baseline project BOQ",
    created_by: users["qs_engineer@demo.local"].id
  });
  console.log("Seeded BOQs.");

  // Update projects and quotations boq_id reference
  await supabase.from("projects").update({ boq_id: boq.id }).eq("id", projects["Skill One Tower Fit-Out"].id);
  await supabase.from("quotations").update({ boq_id: boq.id }).eq("id", quotations["QUO-3001"].id);
  console.log("Linked BOQ references.");

  // 48. BOQ Sections
  const boqSection = await findOrCreate("boq_sections", "title", {
    boq_id: boq.id,
    title: "Civil Works and Partitions",
    sort_order: 1
  });
  console.log("Seeded BOQ sections.");

  // 49. BOQ Items
  const boqItem = await findOrCreate("boq_items", "description", {
    boq_section_id: boqSection.id,
    description: "Supply and install structural steel beams",
    unit: "t",
    quantity: 12,
    rate: 620000
  });
  console.log("Seeded BOQ items.");

  // 50. BOQ Item Breakdowns
  await insertIfMissing("boq_item_breakdowns", "description", "Steel fabrication cost", {
    boq_item_id: boqItem.id,
    description: "Steel fabrication cost",
    amount: 480000
  });
  console.log("Seeded BOQ item breakdowns.");

  // 51. BSR Rates
  const bsrRate = await findOrCreate("bsr_rates", "code", {
    code: "BSR-CIV-01",
    description: "Excavation in soft soil",
    unit: "m3",
    rate: 2500
  });
  console.log("Seeded BSR rates.");

  // 52. BSR Analysis
  await insertIfMissing("bsr_analysis", "bsr_rate_id", bsrRate.id, {
    bsr_rate_id: bsrRate.id,
    data: JSON.stringify({ machinery: 1500, labour: 800, profit: 200 })
  });
  console.log("Seeded BSR analysis.");

  // 53. Material Aliases
  await insertIfMissing("material_aliases", "alias", "Plasterboard 1/2 inch", {
    material_id: materials["ITM-001"].id,
    alias: "Plasterboard 1/2 inch"
  });
  console.log("Seeded material aliases.");

  // 54. Unit Aliases
  await insertIfMissing("unit_aliases", "alias", "sh", {
    unit_id: units["sheets"].id,
    alias: "sh"
  });
  console.log("Seeded unit aliases.");

  // 55. Project Activity Logs
  await insertIfMissing("project_activity_logs", "message", "Site team mobilized and site cabin set up.", {
    project_id: projects["Skill One Tower Fit-Out"].id,
    message: "Site team mobilized and site cabin set up.",
    created_by: users["project_manager@demo.local"].id
  });
  console.log("Seeded project activity logs.");

  // 56. Project Milestones
  await insertIfMissing("project_milestones", "title", "Advance Mobilization", {
    project_id: projects["Skill One Tower Fit-Out"].id,
    title: "Advance Mobilization",
    amount_due: 20475000,
    due_date: "2026-06-03",
    completed_at: new Date().toISOString()
  });
  console.log("Seeded project milestones.");

  // 57. Project Status Logs
  await insertIfMissing("project_status_logs", "to_status", "in_progress", {
    project_id: projects["Skill One Tower Fit-Out"].id,
    from_status: "created",
    to_status: "in_progress",
    changed_by: users["project_manager@demo.local"].id
  });
  console.log("Seeded project status logs.");

  // 58. Project Team Assignments
  await insertIfMissing("project_team_assignments", "role", "Project Manager", {
    project_id: projects["Skill One Tower Fit-Out"].id,
    user_id: users["project_manager@demo.local"].id,
    role: "Project Manager"
  });
  console.log("Seeded project team assignments.");

  // 59. Site Progress Updates
  await insertIfMissing("site_progress_updates", "notes", "Ceiling framing completed on Floors 7 and 8.", {
    site_id: sites["Skill One Tower - Floors 7 to 10"].id,
    project_id: projects["Skill One Tower Fit-Out"].id,
    progress_percent: 42,
    percent_complete: 42,
    notes: "Ceiling framing completed on Floors 7 and 8.",
    work_summary: "Partition studs installed.",
    title: "Ceiling Framing Stage 1",
    client_visible: true,
    update_date: "2026-06-08"
  });
  console.log("Seeded site progress updates.");

  // 60. Purchase Approvals
  await insertIfMissing("purchase_approvals", "notes", "Approved by Super Admin", {
    purchase_order_id: po1.id,
    status: "approved",
    approved_by: users["super_admin@demo.local"].id,
    notes: "Approved by Super Admin"
  });
  console.log("Seeded purchase approvals.");

  // 61. Supplier Performance
  await insertIfMissing("supplier_performance", "notes", "Consistently high quality materials and prompt delivery", {
    supplier_id: suppliers["BuildPro Interiors"].id,
    rating: 4.50,
    average_rating: 4.50,
    total_orders: 12,
    on_time_deliveries: 11,
    notes: "Consistently high quality materials and prompt delivery"
  });
  console.log("Seeded supplier performance.");

  // 62. Employee Site Assignments
  await insertIfMissing("employee_site_assignments", "assigned_from", "2026-06-03", {
    employee_id: employees["EMP-001"].id,
    site_id: sites["Skill One Tower - Floors 7 to 10"].id,
    assigned_from: "2026-06-03",
    from_date: "2026-06-03",
    assigned_by: users["super_admin@demo.local"].id
  });
  console.log("Seeded employee site assignments.");

  // 63. Petty Cash
  await insertIfMissing("petty_cash", "notes", "Site cleaning and emergency supplies", {
    project_id: projects["Skill One Tower Fit-Out"].id,
    employee_id: users["project_manager@demo.local"].id,
    issued_to: users["project_manager@demo.local"].id,
    authorized_by: users["super_admin@demo.local"].id,
    amount: 50000,
    allocated_amount: 75000,
    settled: 12000,
    status: "pending",
    notes: "Site cleaning and emergency supplies",
    purpose: "Site cleaning and emergency supplies",
  });
  console.log("Seeded petty cash.");

  console.log("Supabase mock data seeded successfully for all 65 tables!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
