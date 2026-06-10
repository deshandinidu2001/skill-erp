# **ACCOUNTING MODULE – DEVELOPER GUIDE**

**1\. SYSTEM OVERVIEW**

## **Purpose**

The Accounting Module is responsible for:

* Financial posting (double-entry system)  
* Ledger maintenance  
* Cash & bank tracking  
* Tax recording  
* Financial reporting (P\&L, cash flow)  
* Acting as the **financial backbone** for Project Module operations

## **Integration Model**

| Module | Responsibility |
| ----- | ----- |
| Project Module | Expenses, petty cash, client payments (operational input) |
| Accounting Module | Journal entries, ledger, reporting (financial truth) |

# **2\. CRITICAL ARCHITECTURE RULES**

## **DO NOT DO**

* Do NOT store financial logic in project tables  
* Do NOT calculate reports from project\_expenses directly  
* Do NOT bypass journal entries

## **ALWAYS DO**

Every financial action MUST:

1. Create a **journal entry**  
2. Generate **journal lines (debit/credit)**  
3. Link back to Project Module record

## **CORE PRINCIPLE**

Project Module \= Event Source  
Accounting Module \= Financial Ledger System

# **3\. DATABASE DESIGN**

# **3.1 CHART OF ACCOUNTS**

## **accounts**

id BIGINT PK  
code VARCHAR(20) UNIQUE  
name VARCHAR(255)  
type ENUM('asset','liability','income','expense','equity')  
parent\_id BIGINT NULL  
is\_cash\_account BOOLEAN DEFAULT 0  
is\_bank\_account BOOLEAN DEFAULT 0  
created\_at TIMESTAMP

## **Purpose**

Defines all financial buckets:

* Cash  
* Bank  
* Expenses  
* Income  
* Receivables  
* Payables

# **3.2 JOURNAL ENGINE (CORE OF SYSTEM)**

## **journal\_entries**

id BIGINT PK  
reference\_no VARCHAR(50) UNIQUE  
source\_module ENUM('project\_expense','petty\_cash','client\_payment','system')  
project\_id BIGINT NULL  \-- from project module  
description TEXT  
transaction\_date DATE  
created\_by BIGINT  
status ENUM('draft','posted','reversed')  
reversed\_entry\_id BIGINT NULL  
created\_at TIMESTAMP

## **journal\_lines**

id BIGINT PK  
journal\_entry\_id BIGINT FK  
account\_id BIGINT FK  
debit DECIMAL(14,2)  
credit DECIMAL(14,2)  
description TEXT

## **RULE (MANDATORY)**

SUM(debit) \== SUM(credit)

If not → transaction MUST fail

# 

# **3.3 BANK & CASH MODULE**

## **bank\_accounts**

id BIGINT PK  
account\_id BIGINT FK → accounts  
bank\_name VARCHAR(255)  
account\_number VARCHAR(100)  
branch VARCHAR(255)  
created\_at TIMESTAMP

## **cash\_flow\_view (optional reporting view)**

Used for:

* Cash inflow/outflow analysis

# **3.4 TAX MODULE**

## **taxes**

id BIGINT PK  
name VARCHAR(255)  
rate DECIMAL(5,2)  
type ENUM('percentage','fixed')

## **tax\_entries**

id BIGINT PK  
journal\_entry\_id BIGINT FK  
tax\_id BIGINT FK  
amount DECIMAL(14,2)

# **3.5 LINKING PROJECT MODULE (NO DUPLICATION)**

## **IMPORTANT ADDITIONS (ONLY NEW FIELDS)**

### **project\_expenses (MODIFY ONLY)**

journal\_entry\_id BIGINT FK NULL

### **petty\_cash (MODIFY ONLY)**

journal\_entry\_id BIGINT FK NULL

### **client\_payments (MODIFY ONLY)**

journal\_entry\_id BIGINT FK NULL

# 

# **4\. BUSINESS WORKFLOWS**

# **4.1 PROJECT EXPENSE FLOW**

### **Trigger: Expense created in Project Module**

## **STEP 1 – Project Module**

User creates:

project\_expenses

## **STEP 2 – Accounting Module (AUTO)**

Create journal entry:

Dr Expense Account  
Cr Cash / Bank Account

## **STEP 3 – LINKING**

project\_expenses.journal\_entry\_id \= journal\_entries.id

## **RESULT**

* Expense visible in project module  
* Financial impact recorded in ledger

# **4.2 PETTY CASH FLOW**

## **STEP 1**

Project manager requests petty cash

## **STEP 2**

Journal Entry:

Dr Petty Cash (Project)  
Cr Cash/Bank

## **STEP 3**

petty\_cash.journal\_entry\_id \= X

# **4.3 CLIENT PAYMENT FLOW**

## **STEP 1**

Payment received:

client\_payments

## **STEP 2**

Journal Entry:

Dr Cash/Bank  
Cr Accounts Receivable

## **STEP 3**

Link:

client\_payments.journal\_entry\_id

# 

# **5\. FINANCIAL REPORTING ENGINE**

## **5.1 PROFIT & LOSS**

Uses:

journal\_lines \+ accounts  
WHERE accounts.type IN ('income','expense')

## **5.2 PROJECT P\&L**

WHERE journal\_entries.project\_id \= ?

## **5.3 CASH FLOW REPORT**

Filter:

accounts.is\_cash\_account \= 1 OR is\_bank\_account \= 1

## **5.4 EXPENSE BREAKDOWN**

Group by:

accounts \+ project\_id

# 

# **6\. VALIDATION RULES (VERY IMPORTANT)**

## **BLOCK IF:**

* Expense without project\_id  
* Petty cash \> allocated amount  
* Unbalanced journal entry  
* Inactive account used  
* Missing journal\_entry\_id for financial record

## **MUST ENFORCE:**

* Double-entry balance  
* Foreign key integrity  
* Transactional consistency

# **7\. TRANSACTION SAFETY RULES**

All financial operations MUST use DB transaction:

### **Includes:**

* Expense creation  
* Payment entry  
* Petty cash issuance  
* Journal posting

### **Example:**

BEGIN TRANSACTION

create journal\_entry  
create journal\_lines  
update project table reference

COMMIT

# **8\. SECURITY RULES**

* Never expose journal\_entries directly to client UI  
* Always use API layer for financial posting  
* Prevent manual ledger edits after posting  
* Use reversal entries instead of delete

# **9\. PERFORMANCE DESIGN**

## **Indexing**

journal\_entries(project\_id, transaction\_date)  
journal\_lines(account\_id)  
project\_expenses(project\_id)  
client\_payments(project\_id)

## **Optimization Strategy**

* Use aggregated views for reports  
* Cache P\&L monthly summaries  
* Avoid real-time heavy joins

# **10\. SYSTEM FLOW SUMMARY**

Project Module Event  
        ↓  
(Expense / Payment / Petty Cash)  
        ↓  
Accounting Engine Creates Journal Entry  
        ↓  
Journal Lines Generated  
        ↓  
Linked back to Project record  
        ↓  
Reports generated from Journal ONLY

