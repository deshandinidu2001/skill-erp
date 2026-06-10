# Skill Engineering ERP
# Frontend Product Requirements Document (PRD)
# End to End UI Development Blueprint

This PRD is written for building the full frontend of the Skill Engineering ERP using Next.js, TypeScript, TailwindCSS, ShadCN UI, React Hook Form, Zod, TanStack Table, TanStack Query, and a mock-data-as-a-service approach.

This document is intentionally frontend-first. It is designed so the ERP can be built end to end before the real backend is completed. The frontend should behave like a real product, with complete workflows, validations, permissions, data relationships, mock APIs, realistic state transitions, and cross-module navigation.

The backend may be built separately by another developer. Because of that, this PRD defines the frontend in a way that reduces future rework during API integration.

---

# 1. Product Summary

Skill Engineering ERP is a construction and engineering operations platform used to manage the full lifecycle of client projects.

Core lifecycle:

Lead
→ Estimation
→ Quotation
→ Client discussion
→ Approval / revision / rejection
→ Project creation
→ Material requirement generation
→ Stock and procurement
→ Site execution
→ Payroll and expenses
→ Accounting
→ Reporting

The product is project-centric and site-centric.

That means most records in the system should connect to one or more of these anchors:

- Project
- Site
- Customer
- Employee
- Supplier
- Vehicle
- Financial record

The ERP is not just a collection of pages. It is a workflow system where one module creates data that another module consumes.

---

# 2. Frontend Mission

The frontend must provide:

- A complete and realistic ERP user experience
- End to end operational workflows across all modules
- A reliable temporary mock service layer that behaves like APIs
- Strong form validation and data consistency
- Permission-aware screens and actions
- Clean replacement path from mock data to real APIs later

The frontend should be good enough to:

- demo the product
- validate business flows
- unblock UI development
- unblock QA of workflows
- allow parallel backend development
- reduce assumptions before API integration

---

# 3. Business Objectives Reflected in UI

The UI must help the business:

- capture customer inquiries in a structured way
- convert inquiries into estimations and quotations
- track quotation revisions and approvals
- create projects from approved quotations
- manage project site operations
- manage stock requests and purchase orders
- manage employee attendance and payroll
- manage vehicle assignments and maintenance
- record expenses, payments, and project finance
- monitor profitability and progress using dashboards and reports

---

# 4. Product Principles

The frontend must be designed around these principles:

## 4.1 Workflow driven

Users should feel that each action moves work to the next step. Example, sending a lead to QS should update status, show timeline activity, and make the record visible in QS lists.

## 4.2 Site based

Most screens should support site context. Users often work by site, not just by module.

## 4.3 Project based

Project should be a top-level filter and relationship anchor across modules.

## 4.4 Permission aware

Users should only see actions relevant to their role.

## 4.5 Traceable

Every critical record should show history, status changes, and ownership context.

## 4.6 API ready

Mock services must match future API shape as closely as practical.

---

# 5. Supported Roles

The frontend must support these roles and role-based experiences:

- Super Admin
- HR Manager
- HR Executive
- Marketing Manager
- Marketing Executive
- QS Manager
- QS Engineer
- Stock Manager
- Store Keeper
- Project Manager
- Technical Officer
- Accountant
- Finance Manager
- Vehicle Manager
- Viewer
- Client User

Each role affects:

- visible sidebar modules
- page access
- field editability
- approval actions
- report visibility
- financial visibility
- site scope visibility

---

# 6. High Level Module Map

Main modules:

- Dashboard
- Marketing
- QS
- Quotations
- Projects
- Stock Management
- HR
- Vehicles
- Accounting
- Reports
- Administration
- Client Portal

Cross-cutting subsystems:

- Notifications
- Attachments
- Comments and notes
- Activity timelines
- Search and filters
- Audit-style history view

---

# 7. Core Data Relationships for Frontend Behavior

The frontend must understand the following relationships because page behavior depends on them.

## 7.1 Customer

A customer can have many leads.
A customer can later have many projects.
A customer can have many quotations.
A customer can have many payments.

## 7.2 Lead

A lead belongs to one customer.
A lead can have one or more requirement sections.
A lead can have many timeline entries.
A lead can have many quotation versions through QS flow.
A lead may become one project after approval.

## 7.3 Estimation and BOQ

An estimation belongs to one lead.
An estimation has many estimation lines.
A BOQ belongs to one estimation or quotation version.
A BOQ has many BOQ lines.

## 7.4 Quotation

A quotation belongs to one lead.
A quotation can have many versions.
Only one version can be active at a time.
One approved quotation version creates one project.

## 7.5 Project

A project belongs to one customer.
A project is created from one approved quotation version.
A project belongs to one main site.
A project can have many employees assigned over time.
A project can have many vehicles assigned over time.
A project can have many expenses.
A project can have many customer payments.
A project can have many stock requests.
A project can have many attachments and progress updates.

## 7.6 Site

A site can have many projects over time, if business rules later allow it.
A site can have many employees assigned.
A site can have inventory balance.
A site can have expenses, logistics, progress updates, and petty cash context.

## 7.7 Employee

An employee belongs to one department at a time.
An employee can have many site assignments over time.
An employee can have many attendance records.
An employee can have many payroll records.

## 7.8 Stock and Procurement

A stock request belongs to one project and one site.
A stock request has many request lines.
A purchase order may be created from a stock request.
A supplier can have many purchase orders.
A goods receipt updates inventory.
A stock transfer moves materials to site inventory.

## 7.9 Vehicle

A vehicle can be assigned to many projects over time.
A vehicle can have many meter logs.
A vehicle can have many maintenance records.

## 7.10 Finance

A project has many ledger entries.
A project has many expenses.
A customer payment belongs to one project and customer.
A debtor schedule belongs to one project.

The frontend must use these relationships for page linking, breadcrumbs, tabs, filters, linked cards, and drilldowns.

---

# 8. Global UX Structure

## 8.1 App Layout

The main app layout contains:

- top header
- left sidebar
- page breadcrumb
- page title area
- filter toolbar
- main content area
- right-side optional activity or quick actions panel
- notification center

## 8.2 Header Content

Header should include:

- app logo
- current module title
- global search
- site switcher if needed
- notification bell
- quick create menu
- user menu

## 8.3 Sidebar Behavior

Sidebar should support:

- role based item visibility
- nested menus
- active route highlighting
- collapsible behavior
- badge counts for pending work

## 8.4 Global Search

Search should be able to search across at least:

- projects
- leads
- employees
- suppliers
- vehicles
- quotations

Results should link directly to detail pages.

---

# 9. Design System and UI Standards

## 9.1 Primary UI Patterns

The app should heavily use:

- dashboard cards
- data tables
- detail pages with tab sections
- create and edit forms
- dialogs for small actions
- drawers for quick views
- timelines for history
- status badges
- summary stat cards
- charts

## 9.2 Status Badge Rules

Every important entity must have a consistent status badge system. Colors should remain consistent per status family.

## 9.3 Detail Page Pattern

Every major entity detail page should follow this pattern:

Header summary
Actions row
Key info cards
Tabs
Timeline panel
Related records section

## 9.4 Table Pattern

Every list page should support:

- search
- column filters
- date range filters
- status filters
- sorting
- pagination
- row selection where useful
- row actions menu
- export button where useful
- empty states
- loading skeletons

## 9.5 Form Pattern

All forms should support:

- validation
- inline errors
- section grouping
- draft save where needed
- submit confirmation where needed
- autosave only where beneficial
- unsaved changes warning

---

# 10. Common Frontend States

Every page and data view should handle:

- initial loading
- background refetching
- empty state
- no results after filtering
- permission denied
- offline or request error
- success toast after action

Forms should also handle:

- pristine state
- dirty state
- submitting state
- saved draft state
- validation failure state

---

# 11. Navigation Model

## 11.1 Main Routes

- /dashboard
- /marketing/leads
- /marketing/leads/new
- /marketing/leads/[id]
- /qs/estimations
- /qs/estimations/[id]
- /quotations
- /quotations/[id]
- /projects
- /projects/[id]
- /projects/[id]/expenses
- /projects/[id]/payments
- /projects/[id]/progress
- /stock/items
- /stock/requests
- /stock/requests/[id]
- /stock/purchase-orders
- /stock/inventory
- /hr/employees
- /hr/employees/[id]
- /hr/attendance
- /hr/payroll
- /vehicles
- /vehicles/[id]
- /accounting/ledger
- /accounting/cash-book
- /reports
- /admin
- /client/[token]

## 11.2 Cross Module Linking

Examples:

Lead detail links to estimation, quotation versions, customer, and generated project.
Project detail links to stock requests, expenses, payments, assigned employees, assigned vehicles, and finance summary.
Vehicle detail links to project assignments.
Employee detail links to payroll and site assignments.

---

# 12. Dashboard Module

## 12.1 Goal

Provide executive and operational visibility.

## 12.2 Dashboard Widgets

- Lead pipeline summary
- Leads awaiting QS action
- Quotations awaiting client action
- Active projects count
- Site progress summary
- Stock requests pending approval
- Purchase orders in progress
- Attendance summary for current day
- Payroll summary for current period
- Vehicle availability summary
- Expense vs income chart
- Project profitability chart
- Debtor aging summary

## 12.3 Dashboard Filters

- date range
- site
- project
- department
- role scope

## 12.4 Dashboard Interactions

Each card should link to filtered detailed views.

---

# 13. Marketing Module PRD

## 13.1 Purpose

Manage leads, customer inquiry intake, requirement capture, status tracking, quotation communication, and client coordination.

## 13.2 Pages

- Lead list
- Create lead
- Lead detail
- Lead edit
- Lead timeline
- Client communication log
- Lead conversion analytics

## 13.3 Lead List Requirements

Columns:

- lead code
- customer name
- contact
- location
- project type
- priority
- lead owner
- status
- created date
- last updated

Filters:

- status
- lead owner
- project type
- date range
- location
- priority

Row actions:

- view
- edit
- assign owner
- send to QS
- archive

## 13.4 Create Lead Form

Sections:

### Customer Information
- customer name
- contact number
- email
- alternate contact
- company name if applicable

### Project Information
- project location
- project type
- estimated budget range
- preferred start date
- urgency

### Requirement Information
- requirement description
- drawing requirement details
- construction requirement details
- additional notes

### Internal Tracking
- lead source
- assigned marketing owner
- priority
- tags

Validation:

- customer name required
- at least one contact method required
- project location required
- project type required
- requirement description required

## 13.5 Lead Detail Page

Sections:

- lead summary card
- customer card
- requirement details
- current status card
- assigned owner
- linked estimations
- linked quotation versions
- timeline
- client communication tab
- notes tab
- attachments tab

Primary actions:

- edit lead
- send to QS
- change status
- add note
- upload attachment
- mark rejected
- create follow-up reminder

## 13.6 Lead Status Flow

Allowed states:

- New
- Under Review
- QS Estimation Pending
- Quotation Submitted
- Client Discussion
- Approved
- Rejected
- Closed

Frontend rules:

- send to QS action only available before approval or rejection
- approved should lock certain edit fields
- rejected should require reason
- revision request should keep lead in client discussion until a new quotation version is produced

## 13.7 Client Communication UI

Should support:

- add communication entry
- communication type, call, email, meeting, WhatsApp, note
- discussion summary
- next action date
- responsible user

---

# 14. QS Module PRD

## 14.1 Purpose

QS converts incoming lead requirements into structured estimations, BOQ, quotations, and material requirements.

## 14.2 Pages

- QS dashboard
- Estimation list
- Create estimation
- Estimation detail
- BOQ builder
- Quotation generator
- Cost comparison dashboard

## 14.3 QS Dashboard

Widgets:

- pending estimations
- quotations awaiting upload
- revision requests
- estimations by engineer
- budget deviation trend

## 14.4 Estimation List

Columns:

- estimation code
- linked lead
- customer
- project type
- assigned QS engineer
- status
- last updated
- quotation version count

Filters:

- status
- QS engineer
- date range
- project type

## 14.5 Create Estimation Screen

Sections:

### Lead Reference Summary
- linked lead card
- customer details
- site details
- requirement summary

### Cost Inputs
- material cost total
- labour cost total
- equipment cost total
- overhead cost total
- profit margin percentage

### Estimation Lines Table
Columns:
- item description
- category
- quantity
- unit
- unit rate
- total
- remarks

### Totals Summary
- subtotal
- overhead total
- margin total
- grand total

Behavior:

- totals auto recalculate when lines change
- percentage fields update derived totals
- estimation can be saved as draft

## 14.6 BOQ Builder

BOQ line fields:

- line number
- material or work item name
- description
- quantity
- unit
- unit price
- amount
- group section

Actions:

- add line
- delete line
- reorder line
- import preset items later if required

## 14.7 Quotation Generator

Quotation sections:

- quotation header
- customer info
- project summary
- cost summary
- BOQ attachment reference
- validity period
- notes and exclusions
- payment terms

Actions:

- save draft
- create version
- submit to marketing
- generate printable preview

## 14.8 QS Statuses

Suggested statuses:

Estimation
- Draft
- In Progress
- Ready for Quotation
- Quotation Submitted
- Revision Requested
- Approved Baseline

---

# 15. Quotation Management PRD

## 15.1 Purpose

Manage quotation versions, client-facing delivery, revisions, and approval outcome.

## 15.2 Pages

- quotation list
- quotation detail
- quotation version comparison
- approval tracking
- printable quotation preview

## 15.3 Quotation List

Columns:

- quotation code
- version
- lead code
- customer
- project value
- validity date
- status
- sent date
- owner

Filters:

- status
- date range
- owner
- value range

## 15.4 Quotation Detail Page

Sections:

- quotation summary
- version info
- linked lead
- linked estimation and BOQ
- pricing summary
- payment term summary
- status tracker
- communication history
- client response history
- attachments

Actions:

- duplicate version
- edit draft version
- send to client
- mark revision requested
- mark approved
- mark rejected
- preview PDF

## 15.5 Quotation Statuses

- Draft
- Under Review
- Submitted
- Client Sent
- Revision Requested
- Approved
- Rejected
- Expired
- Archived

Frontend rules:

- only one active version per lead should be visually highlighted
- approved version should display project creation link
- rejected versions stay visible in history

---

# 16. Project Module PRD

## 16.1 Purpose

Manage project execution after quotation approval.

## 16.2 Pages

- project list
- project create, mostly auto-generated
- project detail
- team assignment
- site details
- progress updates
- site expenses
- customer payments
- logistics
- project documents
- project timeline

## 16.3 Project List

Columns:

- project code
- project name
- customer
- site
- status
- start date
- end date
- budget
- project manager
- progress percent

Filters:

- status
- site
- project manager
- date range
- customer

## 16.4 Project Detail Page

Tabs:

- Overview
- Team
- Progress
- Expenses
- Payments
- Stock
- Vehicles
- Documents
- Finance
- Timeline

Overview should display:

- project summary card
- linked quotation version
- linked lead
- customer card
- site card
- budget summary
- profitability snapshot
- next milestones

## 16.5 Team Assignment Page

Allow assigning:

- project manager
- technical officer
- design team
- labour groups later if needed
- employees by role

Fields:

- employee
- role on project
- assigned date
- removed date if historical
- notes

## 16.6 Progress Update Page

Progress record fields:

- date
- update title
- work summary
- percent complete
- blockers
- next steps
- attachments
- visibility to client yes or no

## 16.7 Site Expense Page

Expense fields:

- expense code
- project
- site
- category
- date
- vendor or payee
- amount
- payment method
- notes
- attachment
- approval status

## 16.8 Customer Payments Page

Payment fields:

- payment code
- customer
- project
- date
- amount
- payment mode
- milestone reference
- reference number
- notes
- receipt attachment

## 16.9 Project Statuses

- Draft
- Created
- Assigned
- In Progress
- On Hold
- Completed
- Cancelled
- Closed

Frontend rules:

- completed and closed projects should be read mostly only except allowed finance actions
- cancelled projects must show reason

---

# 17. Stock Management PRD

## 17.1 Purpose

Manage item master, supplier records, stock requests, purchase orders, inventory, and site stock movements.

## 17.2 Pages

- item master list
- item detail
- supplier list
- supplier detail
- stock request list
- stock request detail
- create stock request
- purchase order list
- purchase order detail
- goods receipt list
- inventory dashboard
- site inventory view
- stock transfer history

## 17.3 Item Master

Fields:

- item code
- item name
- category
- unit of measure
- standard cost
- preferred supplier
- active status
- reorder level

## 17.4 Supplier Page

Fields:

- supplier code
- supplier name
- contact person
- phone
- email
- address
- performance rating
- payment terms

## 17.5 Stock Request Form

Fields:

- request code
- project
- site
- request date
- required by date
- requested by
- status
- remarks

Line fields:

- item
- quantity
- unit
- purpose
- QS validation status

## 17.6 Purchase Order Form

Header fields:

- PO code
- supplier
- site
- linked stock request
- issue date
- expected delivery date
- status

Line fields:

- item
- ordered quantity
- unit price
- tax if applicable
- line total

## 17.7 Inventory Views

Should support:

- warehouse inventory
- site inventory
- in transit stock
- low stock alerts
- recent movements

## 17.8 Stock Statuses

Stock Request:
- Draft
- Submitted
- QS Review
- Approved
- Rejected
- Converted To PO
- Partially Fulfilled
- Completed
- Cancelled

Purchase Order:
- Draft
- Pending Approval
- Approved
- Issued
- Partially Received
- Fully Received
- Cancelled
- Closed

---

# 18. HR Module PRD

## 18.1 Purpose

Manage employee records, site assignments, attendance, leave, payroll, appraisals, and salary settlement views.

## 18.2 Pages

- employee list
- employee profile
- employee create
- departments
- positions
- work roles
- site assignment
- attendance dashboard
- attendance entry
- leave list
- payroll list
- payroll detail
- appraisals

## 18.3 Employee Master Fields

- employee code
- full name
- NIC or ID
- phone
- email
- address
- department
- position
- work role
- joining date
- salary type
- basic salary
- allowances
- active status

## 18.4 Employee Profile Tabs

- personal info
- job info
- site assignments
- attendance
- payroll
- appraisals
- documents
- timeline

## 18.5 Attendance Page

Attendance statuses:

- Present
- Absent
- Leave
- Unpaid

Fields:

- employee
- date
- site
- status
- shift
- remarks

Bulk operations:

- mark daily attendance
- filter by site
- filter by date
- export

## 18.6 Payroll Page

Payroll list columns:

- payroll batch code
- period
- site filter if applicable
- employee count
- total gross
- total deductions
- total net
- status

Payroll line fields:

- employee
- basic salary
- attendance adjustment
- allowances
- deductions
- EPF
- ETF
- advances recovered
- net pay
- payment mode

## 18.7 Payroll Statuses

- Draft
- Prepared
- Approved
- Processed
- Paid
- Cancelled
- Locked

Frontend rules:

- locked payroll should not be editable
- payslip preview must be available

---

# 19. Vehicle Management PRD

## 19.1 Purpose

Manage company vehicles, assignments, usage, meter logs, maintenance, and fleet visibility.

## 19.2 Pages

- vehicle list
- vehicle create
- vehicle detail
- assignments
- meter logs
- maintenance logs
- fuel logs
- availability view

## 19.3 Vehicle Fields

- vehicle code
- vehicle number
- category
- ownership status
- current status
- insurance expiry
- license expiry
- assigned project
- current meter reading

## 19.4 Vehicle Detail Tabs

- overview
- assignments
- meter history
- maintenance
- fuel logs
- documents
- timeline

## 19.5 Vehicle Statuses

- Available
- Assigned
- Under Maintenance
- Unavailable
- Retired

---

# 20. Accounting Module PRD

## 20.1 Purpose

Provide finance views for project and company transactions.

## 20.2 Pages

- project ledger
- general ledger
- cash book
- bank transactions
- customer payments
- general expenses
- project fund transfers
- tax records
- P&L reports
- debtor aging

## 20.3 Project Ledger View

Columns:

- date
- entry code
- project
- site
- category
- description
- debit
- credit
- balance impact
- source reference

## 20.4 Cash Book View

Columns:

- date
- transaction code
- type
- amount
- project reference
- site reference
- notes

## 20.5 Customer Payments View

Should allow:

- list all payments
- view payment detail
- filter by project
- filter by customer
- payment status summary

## 20.6 Debtor Aging Page

Should show:

- project
- customer
- milestone
- due date
- due amount
- paid amount
- outstanding amount
- overdue days

---

# 21. Reports Module PRD

## 21.1 Purpose

Provide report screens with filters, tables, charts, and export options.

## 21.2 Required Reports

- lead pipeline report
- quotation conversion report
- project summary report
- site progress report
- employee payroll report
- attendance summary report
- stock movement report
- supplier performance report
- vehicle maintenance report
- project P&L report
- company monthly P&L report
- debtor aging report

## 21.3 Report Page Structure

Each report page should contain:

- report title
- filter panel
- KPI summary cards
- chart section if relevant
- detailed table
- export actions
- saved view support later if needed

---

# 22. Administration Module PRD

## 22.1 Purpose

Provide management and configuration views.

## 22.2 Pages

- user management
- role management
- permission matrix
- master data management
- system settings
- notification settings later
- audit activity viewer

## 22.3 Master Data Pages

Should include:

- departments
- positions
- work roles
- expense categories
- payment terms
- material categories later if needed

---

# 23. Client Portal PRD

## 23.1 Purpose

Provide customer-facing read access to selected project information.

## 23.2 Client Portal Views

- project summary
- progress timeline
- shared documents
- quotation view
- payment status

## 23.3 Client Portal Rules

- read only
- token or login protected
- only whitelisted documents visible
- only approved updates visible

---

# 24. Notifications PRD

## 24.1 Notification Types

- lead assigned
- lead sent to QS
- quotation uploaded
- quotation approved
- quotation rejected
- project created
- stock request approved
- PO issued
- payroll processed
- vehicle maintenance due
- debtor reminder due

## 24.2 Notification UI

Need:

- notification bell
- unread count
- notification list page
- mark as read
- deep links to related records

---

# 25. Attachments and Documents PRD

## 25.1 Supported Documents

- drawings
- BOQ files
- quotations
- contracts
- site photos
- invoices
- receipts
- maintenance files
- payslip exports

## 25.2 Attachment UI Requirements

- upload area
- file preview where possible
- file type badge
- uploader info
- upload date
- linked entity reference
- delete only if allowed

---

# 26. Activity Timeline PRD

Every important detail page should show a timeline.

Timeline entries may include:

- record created
- status changed
- comment added
- note added
- file uploaded
- assignment changed
- approval action performed

Entry fields:

- actor
- action label
- timestamp
- summary
- optional metadata

---

# 27. Page-Level Detailed Standards

## 27.1 List Pages

Must contain:

- page title
- summary stat cards if relevant
- filters row
- search
- table
- row actions
- pagination

## 27.2 Detail Pages

Must contain:

- breadcrumb
- title and status badge
- primary actions
- entity summary cards
- tabs
- related records
- timeline

## 27.3 Create and Edit Pages

Must contain:

- form sections
- validation
- cancel action
- save draft if relevant
- submit action
- success toast
- unsaved changes guard

---

# 28. Form Validation Rules

## 28.1 General Rules

- required fields marked clearly
- dates cannot be invalid
- number inputs must prevent non numeric values
- currency fields should normalize formatting
- select fields should support clear labeling

## 28.2 Cross Field Rules Examples

- quotation validity date must be after issue date
- project end date should not be before start date
- payroll net pay should never be negative without explicit warning
- payment amount should not exceed sensible limits without warning
- stock request required date should not be before request date

---

# 29. Mock Data as a Service Strategy

## 29.1 Goal

Simulate backend APIs with realistic behavior.

## 29.2 Mock Service Principles

- return promises with delays
- support list, get by id, create, update, delete where appropriate
- support filter params
- support status transitions
- support relationship joins for frontend consumption
- support optimistic updates only where safe

## 29.3 Suggested Folder Structure

/services
  /mock
    leads.service.ts
    estimations.service.ts
    quotations.service.ts
    projects.service.ts
    stock.service.ts
    hr.service.ts
    vehicles.service.ts
    accounting.service.ts
    reports.service.ts

## 29.4 Mock Persistence Options

- in-memory store during dev
- local JSON seed files
- browser local storage for persistence during demos
- mock server library later if needed

---

# 30. Frontend Data Types

## 30.1 Lead Type

Fields:

- id
- code
- customerId
- customerName
- contactNumber
- email
- projectLocation
- projectType
- requirementDescription
- drawingRequirements
- constructionRequirements
- additionalNotes
- leadOwnerId
- priority
- leadSource
- status
- createdAt
- updatedAt

## 30.2 Estimation Type

Fields:

- id
- code
- leadId
- status
- materialCost
- labourCost
- equipmentCost
- overheadCost
- profitMarginPercent
- subtotal
- total
- createdBy
- createdAt
- updatedAt
- lines[]

## 30.3 Quotation Type

Fields:

- id
- code
- leadId
- estimationId
- boqId
- versionNumber
- status
- issueDate
- validUntil
- subtotal
- grandTotal
- paymentTerms
- notes
- createdAt
- updatedAt

## 30.4 Project Type

Fields:

- id
- code
- name
- customerId
- quotationId
- siteId
- status
- startDate
- endDate
- budget
- managerId
- progressPercent
- createdAt
- updatedAt

## 30.5 Employee Type

Fields:

- id
- code
- name
- departmentId
- positionId
- workRoleId
- phone
- email
- salaryType
- basicSalary
- status
- siteAssignments[]

## 30.6 Stock Request Type

Fields:

- id
- code
- projectId
- siteId
- requestedBy
- requestDate
- requiredByDate
- status
- remarks
- lines[]

## 30.7 Vehicle Type

Fields:

- id
- code
- vehicleNumber
- category
- status
- insuranceExpiry
- licenseExpiry
- currentMeterReading

## 30.8 Expense Type

Fields:

- id
- code
- projectId
- siteId
- categoryId
- date
- amount
- paymentMethod
- approvalStatus
- notes

---

# 31. End to End Workflow Definitions

## 31.1 Lead to Project Workflow

1. Marketing creates lead
2. Lead appears in lead list with status New
3. Marketing reviews and updates lead
4. Marketing sends lead to QS
5. Status becomes QS Estimation Pending
6. QS creates estimation and BOQ
7. QS generates quotation version 1
8. QS submits quotation to marketing
9. Lead status becomes Quotation Submitted
10. Marketing reviews and sends quotation to client
11. Client either approves, rejects, or requests revision
12. If revision requested, new quotation version is created
13. If approved, project is created automatically
14. Project becomes visible in project module
15. Material requirement is generated for stock flow

## 31.2 Project Execution Workflow

1. Project manager accesses project
2. Team members are assigned
3. Progress updates are added
4. Site expenses are recorded
5. Customer payments are recorded
6. Vehicles may be assigned
7. Stock requests are raised if needed
8. Finance and reporting screens reflect project activity

## 31.3 Stock Workflow

1. Stock request created for project
2. Request reviewed
3. QS validates quantities where needed
4. Stock manager creates purchase order if required
5. Goods receipt updates inventory
6. Stock transfer updates site inventory

## 31.4 Payroll Workflow

1. Attendance is captured
2. Payroll batch is prepared
3. Payroll lines are reviewed
4. Approval occurs
5. Payroll becomes processed and paid
6. Payslip preview is available

---

# 32. State Transition Requirements

The frontend must model allowed transitions for key entities.

## 32.1 Lead Transitions

New → Under Review
Under Review → QS Estimation Pending
QS Estimation Pending → Quotation Submitted
Quotation Submitted → Client Discussion
Client Discussion → Approved
Client Discussion → Rejected
Approved → Closed optional later

## 32.2 Quotation Transitions

Draft → Submitted
Submitted → Client Sent
Client Sent → Revision Requested
Client Sent → Approved
Client Sent → Rejected
Approved → Archived later if needed

## 32.3 Project Transitions

Draft → Created
Created → Assigned
Assigned → In Progress
In Progress → On Hold
In Progress → Completed
Completed → Closed
Any active state → Cancelled with reason

## 32.4 Stock Request Transitions

Draft → Submitted
Submitted → QS Review
QS Review → Approved
QS Review → Rejected
Approved → Converted To PO
Converted To PO → Partially Fulfilled
Partially Fulfilled → Completed

## 32.5 Payroll Transitions

Draft → Prepared
Prepared → Approved
Approved → Processed
Processed → Paid
Paid → Locked

The UI should hide invalid actions and show disabled explanations where useful.

---

# 33. Permissions Matrix Requirements

Frontend must implement permission guards by route and action.

Examples:

- Marketing can create and edit leads
- QS can edit estimations but not employee payroll
- Project manager can update progress and expenses for assigned projects
- HR can manage payroll and employees
- Finance can view ledgers and payments
- Client users can only view portal-approved data

Permission enforcement levels:

- route access
- page section visibility
- action button visibility
- field editability
- export permission

---

# 34. Reporting and Chart Requirements

Charts should be meaningful, not decorative.

Examples:

- leads by status
- quotation conversion funnel
- project cost vs budget
- monthly income vs expense
- attendance by site
- vehicle availability distribution
- debtor aging buckets

Every chart should have:

- tooltip
- legend
- empty state
- filter integration

---

# 35. Search, Filters, and Saved Views

High-value screens should support advanced filtering.

Examples:

Leads:
- owner
- source
- priority
- status
- date range

Projects:
- manager
- site
- status
- customer
- date range

Stock requests:
- site
- project
- supplier
- status

Saved views can be a later enhancement but page layout should not block it.

---

# 36. Error Handling UX

Examples:

- duplicate lead warning
- invalid date combination
- unauthorized action toast
- simulated network failure retry state
- missing required linked record warning

For mock services, errors should be simulated occasionally during development where useful.

---

# 37. Accessibility and Usability Requirements

The frontend should support:

- keyboard friendly navigation
- accessible labels
- visible focus states
- readable contrast
- error messages linked to fields
- consistent button labeling

---

# 38. Performance Expectations

Even with mock data, the app should feel fast and structured.

Pages should use:

- skeleton loaders
- paginated tables
- lazy loaded heavy sections where appropriate
- memoized table column definitions

---

# 39. Folder Structure Recommendation

/app
  /(dashboard)
    dashboard/
    marketing/
    qs/
    quotations/
    projects/
    stock/
    hr/
    vehicles/
    accounting/
    reports/
    admin/
  /client/[token]/

/components
  /layout
  /tables
  /forms
  /charts
  /cards
  /timelines
  /filters
  /shared
  /ui

/features
  /marketing
  /qs
  /quotations
  /projects
  /stock
  /hr
  /vehicles
  /accounting
  /reports

/services
  /mock
  /api

/lib
/types
/constants
/hooks

---

# 40. Developer Delivery Order Recommendation

Suggested frontend build order:

1. app shell, auth shell, sidebar, header
2. design system and reusable components
3. dashboard
4. marketing module
5. QS module
6. quotation module
7. project module
8. stock module
9. HR module
10. vehicle module
11. accounting module
12. reports module
13. admin module
14. client portal
15. mock integration refinements
16. permission refinement
17. QA pass across workflows

This order follows business flow and reduces blockers.

---

# 41. Definition of Done for Frontend

The frontend is considered complete when:

- all listed modules are navigable
- all key entities have list, detail, and create or edit flows where needed
- all major workflows can be simulated end to end with mock data
- filters, forms, tables, states, and timelines are implemented
- role-based navigation exists
- detail pages show related records correctly
- mock services can later be swapped to real APIs with minimal UI rewrite

---

# 42. Final Frontend Outcome

The final product should feel like a real ERP, not a static UI demo.

A user should be able to:

- create a lead
- send it to QS
- create estimation and quotation
- approve quotation through simulated client flow
- see project created
- add progress, expenses, and payments
- create stock requests and purchase orders
- manage attendance and payroll screens
- manage vehicles
- review ledgers and reports

All of this should work with mock data while preserving the relationships and workflow logic expected in the real system.

# 43. Scope Boundary and Expansion Rule

This PRD must stay inside the customer-approved ERP scope.

That means the frontend should only cover the following business areas already present in the scope:

- HR
n- Marketing and Lead Management
- QS and Estimation
- Quotation Management
- Project Management
- Stock and Procurement
- Vehicle Management
- Accounting
- Administrator Reporting
- Client Portal visibility already implied by the scope

No unrelated new business modules should be introduced.

Expansion is allowed only in these ways:

- adding missing field definitions
- adding workflow rules
- adding validation rules
- adding frontend page structures
- adding relationship clarity
- adding approval logic implied by the workflow
- adding reporting definitions implied by the scope
- adding UI behavior needed to make the system functional

The goal is not to change scope. The goal is to make the existing scope implementable.

---

# 44. Complete Frontend Entity Dictionary

This section defines the main frontend entities in a practical way so pages, forms, tables, and mock services can be built without ambiguity.

## 44.1 Customer

Purpose:
Store client identity for leads, quotations, projects, and payments.

Key fields:
- id
- customerCode
- customerType, individual or company
- displayName
- companyName optional
- primaryContactName
- primaryPhone
- secondaryPhone optional
- email optional
- addressLine1
- addressLine2 optional
- city
- district optional
- notes optional
- isActive
- createdAt
- updatedAt

Relationships:
- one customer can have many leads
- one customer can have many quotations
- one customer can have many projects
- one customer can have many customer payments

Frontend usage:
- customer search select in lead forms
- customer card in lead, quotation, project, and payment pages
- customer drilldown from related records

Validation:
- displayName required
- at least one of phone or email required

## 44.2 Lead

Purpose:
Capture client inquiry and route it into the estimation and quotation process.

Key fields:
- id
- leadCode
- customerId
- customerSnapshotName
- projectLocation
- projectType
- requirementDescription
- drawingRequirements optional
- constructionRequirements optional
- additionalNotes optional
- leadSource optional
- priority
- assignedMarketingOwnerId
- status
- rejectionReason optional
- preferredStartDate optional
- estimatedBudgetRange optional
- createdAt
- updatedAt

Relationships:
- belongs to one customer
- has many communication entries
- has many attachments
- has many status history entries
- has many quotation versions
- may produce one project after approval

Frontend usage:
- lead list table
- create and edit lead forms
- lead detail tabs
- lead to QS action

Validation:
- customer required
- project location required
- project type required
- requirement description required
- owner required when sending to QS

## 44.3 Lead Communication Entry

Purpose:
Track client discussions without mixing them into general notes.

Key fields:
- id
- leadId
- type
- summary
- discussedByUserId
- discussedAt
- nextActionDate optional
- nextActionOwnerId optional
- createdAt

Types:
- call
- email
- meeting
- WhatsApp
- note

Frontend usage:
- lead detail communication tab
- quick add modal
- follow-up reminder display

## 44.4 Estimation

Purpose:
Convert lead requirements into cost structure and commercial baseline.

Key fields:
- id
- estimationCode
- leadId
- assignedQSEngineerId
- status
- materialCostTotal
- labourCostTotal
- equipmentCostTotal
- overheadCostTotal
- profitMarginPercent
- profitMarginValue
- subtotal
- grandTotal
- notes optional
- revisionNumber
- createdAt
- updatedAt

Relationships:
- belongs to one lead
- has many estimation lines
- may produce one or more quotation versions over time

Frontend usage:
- estimation list
- estimation builder
- cost summary cards

Validation:
- linked lead required
- at least one line or at least one non-zero cost component required
- margin percent cannot be negative

## 44.5 Estimation Line

Purpose:
Break down cost items for estimation.

Key fields:
- id
- estimationId
- category
- itemDescription
- quantity
- unit
- unitRate
- lineTotal
- remarks optional
- sortOrder

Categories:
- material
- labour
- equipment
- overhead
- other

Frontend usage:
- editable table rows
- grouped totals by category

Validation:
- itemDescription required
- quantity must be greater than zero
- unitRate cannot be negative

## 44.6 BOQ

Purpose:
Represent structured bill of quantity used for quotation and project baseline.

Key fields:
- id
- boqCode
- estimationId optional
- quotationId optional
- versionNumber
- notes optional
- createdAt
- updatedAt

Relationships:
- has many BOQ lines
- linked to quotation version

## 44.7 BOQ Line

Purpose:
Represent material or work quantity items.

Key fields:
- id
- boqId
- groupName optional
- lineNumber
- itemName
- description optional
- quantity
- unit
- unitPrice
- amount
- sortOrder

Validation:
- itemName required
- quantity required
- amount should auto-calculate from quantity and unitPrice when possible

## 44.8 Quotation

Purpose:
Represent a commercial offer sent to client.

Key fields:
- id
- quotationCode
- leadId
- estimationId
- boqId optional
- versionNumber
- status
- issueDate
- validUntil
- subtotal
- discountValue optional
- taxValue optional
- grandTotal
- paymentTermsText optional
- notesAndExclusions optional
- sentAt optional
- approvedAt optional
- rejectedAt optional
- createdAt
- updatedAt

Relationships:
- belongs to one lead
- references estimation and optionally BOQ
- can create one project when approved

Frontend usage:
- quotation version history
- quotation preview
- approval screen

Validation:
- issueDate required
- validUntil should be after issueDate
- grandTotal required

## 44.9 Project

Purpose:
Represent the approved operational record after quotation acceptance.

Key fields:
- id
- projectCode
- projectName
- customerId
- leadId
- quotationId
- siteId
- status
- budgetAmount
- startDate optional
- endDate optional
- assignedProjectManagerId optional
- assignedTechnicalOfficerId optional
- progressPercent
- priority optional
- createdAt
- updatedAt

Relationships:
- belongs to one customer
- created from one quotation version
- belongs to one main site
- has many team assignments
- has many progress updates
- has many expenses
- has many customer payments
- has many stock requests
- has many vehicle assignments
- has many documents

Frontend usage:
- project list
- project detail overview
- project financial snapshots
- project cross-module links

Validation:
- customer required
- quotation reference required at creation time
- site required
- status required

## 44.10 Site

Purpose:
Represent operational location context.

Key fields:
- id
- siteCode
- siteName
- addressLine1
- addressLine2 optional
- city
- district optional
- siteLevel optional
- contactPerson optional
- contactPhone optional
- activeStatus
- createdAt
- updatedAt

Relationships:
- site can have many projects
- site can have many employee assignments
- site can have many expenses
- site can have inventory balance

Frontend usage:
- site filter
- site card on project pages
- attendance and stock filters

## 44.11 Project Team Assignment

Purpose:
Track which employee is assigned to which project and in what role.

Key fields:
- id
- projectId
- employeeId
- roleOnProject
- assignedDate
- removedDate optional
- isActive
- notes optional

Frontend usage:
- team tab in project detail
- historical assignment list

## 44.12 Site Progress Update

Purpose:
Track execution progress and client-visible updates.

Key fields:
- id
- projectId
- siteId
- updateDate
- title
- summary
- progressPercent
- blockers optional
- nextSteps optional
- visibleToClient
- createdBy
- createdAt

Frontend usage:
- project progress tab
- client portal progress timeline

Validation:
- title required
- progressPercent between 0 and 100

## 44.13 Project Expense

Purpose:
Track site or project-level expenses.

Key fields:
- id
- expenseCode
- projectId
- siteId
- expenseCategoryId
- expenseDate
- vendorOrPayee
- amount
- paymentMethod
- approvalStatus
- notes optional
- attachmentCount
- createdBy
- createdAt

Relationships:
- belongs to project and site
- can appear in finance pages and project pages

Validation:
- category required
- amount greater than zero
- date required

## 44.14 Customer Payment
n
Purpose:
Track money received from customer against project.

Key fields:
- id
- paymentCode
- customerId
- projectId
- paymentDate
- amount
- paymentMode
- milestoneReference optional
- referenceNumber optional
- notes optional
- attachmentCount
- createdAt
- updatedAt

Validation:
- project required
- customer required
- amount greater than zero
- payment date required

## 44.15 Material Item

Purpose:
Represent stock-managed material.

Key fields:
- id
- itemCode
- itemName
- category
- unitOfMeasure
- standardCost
- preferredSupplierId optional
- reorderLevel optional
- isActive
- createdAt
- updatedAt

Frontend usage:
- item master list
- stock request line selector
- PO line selector

## 44.16 Supplier

Purpose:
Represent procurement partner.

Key fields:
- id
- supplierCode
- supplierName
- contactPerson
- phone
- email optional
- address optional
- performanceRating optional
- paymentTerms optional
- isActive

Relationships:
- has many purchase orders
- may be preferred supplier for materials

## 44.17 Stock Request

Purpose:
Request material for project or site.

Key fields:
- id
- stockRequestCode
- projectId
- siteId
- requestedByUserId
- requestDate
- requiredByDate
- status
- remarks optional
- qsValidationRequired boolean
- createdAt
- updatedAt

Relationships:
- belongs to project and site
- has many stock request lines
- may create one or more purchase orders

Frontend usage:
- stock request list
- stock request detail
- approval actions

Validation:
- project required
- site required
- request date required
- at least one line required

## 44.18 Stock Request Line

Purpose:
Represent requested material quantity.

Key fields:
- id
- stockRequestId
- itemId
- itemSnapshotName
- quantity
- unit
- purpose optional
- qsValidationStatus
- remarks optional

Validation:
- item required
- quantity greater than zero

## 44.19 Purchase Order

Purpose:
Represent procurement order to supplier.

Key fields:
- id
- poCode
- supplierId
- siteId
- linkedStockRequestId optional
- issueDate
- expectedDeliveryDate optional
- status
- subtotal
- taxValue optional
- grandTotal
- notes optional
- createdAt
- updatedAt

Relationships:
- has many purchase order lines
- belongs to supplier

## 44.20 Purchase Order Line

Purpose:
Represent ordered material row.

Key fields:
- id
- purchaseOrderId
- itemId
- orderedQuantity
- unit
- unitPrice
- taxValue optional
- lineTotal

## 44.21 Inventory Balance

Purpose:
Represent current available material balance.

Key fields:
- id
- itemId
- locationType, warehouse or site
- siteId optional
- quantityOnHand
- reservedQuantity optional
- availableQuantity
- updatedAt

Frontend usage:
- inventory dashboard
- site inventory table
- low stock warnings

## 44.22 Employee

Purpose:
Represent staff and labour records.

Key fields:
- id
- employeeCode
- fullName
- nicOrId
- phone
- email optional
- address optional
- departmentId
- positionId
- workRoleId
- joiningDate
- salaryType
- basicSalary
- activeStatus
- createdAt
- updatedAt

Relationships:
- has many attendance records
- has many payroll lines
- has many project assignments
- has many site assignments

## 44.23 Employee Site Assignment

Purpose:
Track employee placement by site over time.

Key fields:
- id
- employeeId
- siteId
- assignedDate
- removedDate optional
- isCurrent
- remarks optional

## 44.24 Attendance Record

Purpose:
Track attendance state for payroll and operational visibility.

Key fields:
- id
- employeeId
- siteId
- attendanceDate
- shiftId optional
- status
- remarks optional
- createdAt

Statuses:
- present
- absent
- leave
- unpaid

## 44.25 Payroll Batch

Purpose:
Represent payroll generation run.

Key fields:
- id
- payrollBatchCode
- periodStart
- periodEnd
- siteId optional
- status
- totalEmployees
- totalGross
- totalDeductions
- totalNet
- createdAt
- updatedAt

Relationships:
- has many payroll lines

## 44.26 Payroll Line

Purpose:
Represent employee-level payroll result.

Key fields:
- id
- payrollBatchId
- employeeId
- basicSalary
- attendanceAdjustment
- allowances
- deductions
- epfValue
- etfValue
- advancesRecovered
- netPay
- paymentMode

## 44.27 Vehicle

Purpose:
Represent company vehicle record.

Key fields:
- id
- vehicleCode
- vehicleNumber
- category
- ownershipStatus
- status
- insuranceExpiry optional
- licenseExpiry optional
- currentMeterReading
- createdAt
- updatedAt

## 44.28 Vehicle Assignment

Purpose:
Track project use of vehicles.

Key fields:
- id
- vehicleId
- projectId
- assignedDate
- releasedDate optional
- assignedBy
- notes optional

## 44.29 Meter Log

Purpose:
Track meter readings over time.

Key fields:
- id
- vehicleId
- readingDate
- startReading optional
- endReading
- remarks optional

## 44.30 Maintenance Record

Purpose:
Track service and maintenance work.

Key fields:
- id
- vehicleId
- maintenanceDate
- maintenanceType
- vendor optional
- cost optional
- nextDueDate optional
- status
- notes optional

## 44.31 Ledger Entry

Purpose:
Represent project or accounting transaction line visible in finance module.

Key fields:
- id
- entryCode
- projectId optional
- siteId optional
- entryDate
- category
- description
- debitValue optional
- creditValue optional
- sourceType
- sourceId
- createdAt

## 44.32 Debtor Record

Purpose:
Track outstanding payment obligations per project.

Key fields:
- id
- projectId
- customerId
- milestoneName
- dueDate
- dueAmount
- paidAmount
- outstandingAmount
- overdueDays
- status

---

# 45. Detailed Approval and Action Rules Within Current Scope

This section only expands actions already implied by the scope.

## 45.1 Lead Actions

Marketing Executive:
- create lead
- edit lead while not approved and not closed
- add communication entries
- upload attachments

Marketing Manager:
- assign owner
- send lead to QS
- mark approved or rejected after client outcome

Frontend behavior:
- send to QS button should require basic lead completeness
- approved and rejected leads should require confirmation dialog

## 45.2 Estimation and Quotation Actions

QS Engineer:
- create estimation
- edit estimation draft
- build BOQ
- create quotation version

QS Manager if applicable in UI:
- review submitted quotation draft
- finalize quotation for marketing handoff

Frontend behavior:
- submitted quotation versions should become read only except duplicate version action
- revision requested should create a new editable version rather than editing historical approved or sent versions directly

## 45.3 Project Actions

Project Manager:
- update progress
- add expenses
- add logistics notes
- view assigned vehicles
- view assigned team

Marketing or authorized user:
- create project only through approved quotation flow

Frontend behavior:
- manual direct project creation should be hidden or clearly marked restricted if business insists on approved quotation origin

## 45.4 Stock Actions

Requester or relevant user:
- create stock request
- edit draft request

Stock Manager:
- review request
- assign supplier
- create purchase order
- transfer stock to site

QS-related validation:
- validate quantities when required by workflow

Frontend behavior:
- once request is converted to PO, request lines should become non-editable except through explicit revision flow

## 45.5 HR Actions

HR Executive:
- create employees
- manage attendance
- prepare payroll batches
- assign employees to sites

HR Manager:
- review payroll
- approve payroll
- oversee profiles and salary visibility

Frontend behavior:
- locked payroll must disable all edit buttons

## 45.6 Vehicle Actions

Vehicle Manager:
- create vehicle
- update vehicle status
- assign vehicle to project
- log maintenance and meter readings

Frontend behavior:
- unavailable or under maintenance vehicles should not appear as freely assignable without warning

## 45.7 Accounting Actions

Accountant or Finance user:
- view project and company ledgers
- view customer payments
- view cash book
- view general expenses
- view P&L

Frontend behavior:
- posted-style finance rows should avoid casual inline editing in UI

---

# 46. Field-Level Create and Edit Screen Specifications

## 46.1 Lead Create Screen Sections

Section A, customer selection or quick customer create
Section B, project information
Section C, requirement details
Section D, internal ownership and priority
Section E, attachments

Buttons:
- save draft
- create lead
- cancel

## 46.2 Estimation Builder Screen Sections

Section A, linked lead summary
Section B, estimation lines table
Section C, totals panel
Section D, notes and revision notes
Section E, actions panel

Buttons:
- save draft
- mark ready for quotation
- open BOQ builder

## 46.3 Quotation Builder Screen Sections

Section A, quotation metadata
Section B, commercial totals
Section C, payment terms
Section D, notes and exclusions
Section E, preview panel

Buttons:
- save draft
- create version
- submit to marketing
- preview print

## 46.4 Project Detail Entry Areas

Sub-actions on project should be segmented, not overloaded in one long form.

Recommended action entry points:
- add progress update dialog
- add expense drawer
- add payment drawer
- assign employee dialog
- assign vehicle dialog
- upload document drawer

## 46.5 Stock Request Create Screen

Header section:
- project
- site
- request date
- required by date
- remarks

Lines section:
- item selector
- quantity
- unit
- purpose
- remarks

Buttons:
- save draft
- submit request

## 46.6 Payroll Preparation Screen

Header section:
- payroll period
- site filter optional
- employee scope filter

Lines section:
- employee
- base salary
- attendance adjustment
- allowances
- deductions
- EPF
- ETF
- advances
- net pay

Buttons:
- save draft
- prepare payroll
- approve payroll where allowed
- preview payslip

---

# 47. Related Records Expected on Each Detail Page

## 47.1 Lead Detail Related Records

- customer card
- communication history
- estimations
- quotation versions
- attachments
- timeline
- created project if approved

## 47.2 Quotation Detail Related Records

- linked lead
- linked customer
- estimation summary
- BOQ summary
- version history
- client response history
- generated project link if approved

## 47.3 Project Detail Related Records

- linked lead
- linked quotation
- team assignments
- progress updates
- expenses
- customer payments
- stock requests
- assigned vehicles
- attachments
- finance summary
- timeline

## 47.4 Employee Detail Related Records

- current site assignment
- historical site assignments
- attendance history
- payroll history
- appraisal history

## 47.5 Vehicle Detail Related Records

- current assignment
- assignment history
- meter logs
- maintenance logs
- related project links

---

# 48. Detailed Table Columns by Main Module

## 48.1 Lead List Default Columns

- lead code
- customer name
- project location
- project type
- owner
- priority
- status
- created date
- last updated

## 48.2 Estimation List Default Columns

- estimation code
- lead code
- customer
- QS engineer
- subtotal
- grand total
- status
- updated date

## 48.3 Quotation List Default Columns

- quotation code
- version
- lead code
- customer
- issue date
- valid until
- grand total
- status

## 48.4 Project List Default Columns

- project code
- project name
- customer
- site
- project manager
- status
- start date
- progress percent
- budget

## 48.5 Stock Request List Default Columns

- request code
- project
- site
- request date
- required by date
- requester
- status

## 48.6 Purchase Order List Default Columns

- PO code
- supplier
- linked request
- site
- issue date
- expected delivery
- grand total
- status

## 48.7 Employee List Default Columns

- employee code
- name
- department
- position
- current site
- salary type
- active status

## 48.8 Payroll Batch List Default Columns

- batch code
- period start
- period end
- site filter
- employee count
- total gross
- total net
- status

## 48.9 Vehicle List Default Columns

- vehicle code
- vehicle number
- category
- status
- current project optional
- current meter reading
- insurance expiry

## 48.10 Customer Payment List Default Columns

- payment code
- project
- customer
- date
- amount
- payment mode
- milestone reference

---

# 49. Detailed Mock Data Strategy per Scope Area

## 49.1 Seed Requirements

Seed data should include:
- 20 to 50 leads across statuses
- 10 to 20 estimations
- 15 to 25 quotations across version histories
- 10 to 20 projects
- 30 plus expenses
- 20 plus payments
- 15 plus stock requests
- 10 plus purchase orders
- 30 plus employees
- attendance for current and previous periods
- 5 to 15 vehicles

## 49.2 Cross-Link Integrity

Mock data must be relationally believable.

Examples:
- approved quotation must map to a real project
- project customer must match quotation customer
- stock request project and site must match a real project and site
- vehicle assignment project must map to a real project
- payroll line employee must map to a real employee

## 49.3 Mock Behavior to Simulate

- network delay
- validation errors
- forbidden actions for wrong role
- occasional empty states for some filters
- success and failure toasts

---

# 50. Final Expansion Goal

This PRD must now be treated as a detailed frontend execution document derived only from the existing approved ERP scope.

Nothing in this document should force new business modules beyond the scope.

Everything added here exists to make the current scope:

- understandable
- relationally clear
- page-ready
- form-ready
- workflow-ready
- mock-data-ready
- frontend build-ready

# End of PRD

