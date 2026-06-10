# **PROJECT MANAGEMENT MODULE**

# **ER DESIGN**

## **🔗 CORE ENTITIES & RELATIONSHIPS**

clients / leads / boq  
        │  
        └── projects  
               │  
               ├── project\_status\_logs  
               │  
               ├── project\_team\_assignments  
               │  
               ├── project\_expenses  
               │  
               ├── petty\_cash  
               │  
               ├── client\_access  
               │  
               └── project\_activity\_logs

## **DETAILED ER**

### **PROJECTS (CORE)**

projects  
\- id BIGINT PK  
\- client\_id BIGINT FK  
\- lead\_id BIGINT FK NULL  
\- boq\_id BIGINT FK NULL  
\- name VARCHAR(255)  
\- location TEXT  
\- start\_date DATE  
\- end\_date DATE  
\- status ENUM('planned','ongoing','on\_hold','completed','cancelled')  
\- created\_by BIGINT FK  
\- created\_at TIMESTAMP  
\- updated\_at TIMESTAMP

### **PROJECT STATUS LOGS**

project\_status\_logs  
\- id BIGINT PK  
\- project\_id BIGINT FK  
\- status ENUM('planned','ongoing','on\_hold','completed')  
\- remarks TEXT  
\- updated\_by BIGINT FK  
\- updated\_at TIMESTAMP

**TEAM ASSIGNMENTS**  
project\_team\_assignments  
\- id BIGINT PK  
\- project\_id BIGINT FK  
\- employee\_id BIGINT FK  
\- assigned\_at TIMESTAMP

**PROJECT EXPENSES**  
project\_expenses  
\- id BIGINT PK  
\- project\_id BIGINT FK  
\- category\_id \- project\_expenses\_category-\>id  
\- amount DECIMAL(12,2)  
\- description TEXT  
\- expense\_date DATE  
\- created\_by BIGINT FK  
\- created\_at TIMESTAMP

project\_expenses\_category  
\- id BIGINT PK  
\- name VARCHAR(255)  
\- description TEXT  
\- created\_by BIGINT FK  
\- created\_at TIMESTAMP

### **PETTY CASH MANAGEMENT**

petty\_cash  
\- id BIGINT PK  
\- project\_id BIGINT FK  
\- employee\_id BIGINT FK  
\- amount DECIMAL(12,2)  
\- issued\_at TIMESTAMP  
\- settled\_amount DECIMAL(12,2) DEFAULT 0  
\- status ENUM('issued','settled','pending')

**CLIENT ACCESS (PORTAL)**  
client\_access  
\- id BIGINT PK  
\- project\_id BIGINT FK  
\- token VARCHAR(255) UNIQUE  
\- expires\_at TIMESTAMP  
\- created\_at TIMESTAMP

**PROJECT ACTIVITY LOGS**  
project\_activity\_logs  
\- id BIGINT PK  
\- project\_id BIGINT FK  
\- activity\_type VARCHAR(100)  
\- description TEXT  
\- created\_by BIGINT FK  
\- created\_at TIMESTAMP

**CLIENT PAYMENTS (IMPORTANT ADDITION)**  
client\_payments  
\- id BIGINT PK  
\- project\_id BIGINT FK  
\- amount DECIMAL(14,2)  
\- payment\_method VARCHAR(50)  
\- reference\_no VARCHAR(100)  
\- payment\_date DATE  
\- received\_by BIGINT FK  
\- created\_at TIMESTAMP

**FULL PROJECT FLOW**  
Lead Approved  
 ↓  
Project Created  
 ↓  
Team Assigned  
 ↓  
Project Tracking (status \+ logs)  
 ↓  
Expenses \+ Petty Cash  
 ↓  
Client Updates  
 ↓  
Project Completion

# **🔗 KEY RELATIONSHIPS**

| From | To | Type |
| ----- | ----- | ----- |
| projects | project\_status\_logs | 1:N |
| projects | project\_team\_assignments | 1:N |
| projects | project\_expenses | 1:N |
| projects | petty\_cash | 1:N |
| projects | client\_access | 1:N |
| projects | project\_activity\_logs | 1:N |
| projects | client\_payments | 1:N |

# 

# **MODULE INTRODUCTION**

## **Overview**

The **Project Management Module** manages the full lifecycle of construction projects from creation to completion.

It integrates with:

* Marketing (Leads → Project creation)  
* BOQ (Planning)  
* Inventory (Material usage)  
* HR (Team assignment)

**Objectives**

* Track project lifecycle and progress  
* Manage site operations and teams  
* Monitor expenses and cash flow  
* Provide real-time updates to clients  
* Maintain full project audit trail

**Key Functional Areas**

### **1\. Project Creation**

* Auto-create from approved leads  
* Manual creation support  
* Link with client, BOQ, and location

### **2\. Site Management**

* Manage multiple project sites  
* Track status (ongoing / completed)  
* Monitor progress

### **3\. Project Tracking**

* Status updates  
* Milestone tracking  
* Activity logs

**4\. Expense Management**

* Track all project-related costs  
* Categorized expense logging  
* Financial visibility

**5\. Petty Cash Handling**

* Issue cash to employees  
* Track usage and settlement  
* Prevent misuse

**6\. Client Access**

* Secure project portal  
* Real-time progress visibility  
* Transparent communication

**💥 System Value**

* Better project visibility  
* Controlled cost management  
* Improved coordination  
* Transparent client communication

# 

# **DEVELOPER GUIDELINES**

**DATA RULES**

✔ Always filter by:

* `project_id`

✔ Maintain relational integrity using FK constraints

**PROJECT CREATION RULES**

✔ Auto-create project when:

* Lead status \= approved

✔ Allow manual creation for admins

✔ MUST include:

* client\_id  
* location  
* project name

**STATUS MANAGEMENT**

❌ DO NOT update project status directly

✅ ALWAYS:

1. Insert into:

project\_status\_logs

2. Then update:

projects.status

**EXPENSE MANAGEMENT RULES**

✔ Every expense must:

* Have category  
* Have project reference

✔ Use validation:

* amount \> 0

**PETTY CASH RULES**

✔ Cannot exceed allocated amount  
✔ Must track:

* issued amount  
* settled amount

✔ Status flow:

issued → pending → settled

**CLIENT ACCESS RULES**

✔ Token must be:

* Unique  
* Secure (UUID / hashed)

✔ Must have expiry

✔ Never expose internal IDs

**VALIDATION RULES**

✔ Cannot log expense without project  
✔ Cannot assign inactive employee  
✔ Cannot close project with pending expenses  
✔ Cannot issue petty cash without authorization

## **TRANSACTION MANAGEMENT**

Use DB transactions for:

* Project creation  
* Expense logging  
* Petty cash issuing  
* Payment recording