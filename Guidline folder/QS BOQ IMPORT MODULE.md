# **QS BOQ IMPORT MODULE**

### **(Flexible Excel Import System – Implementation Guide)**

# **1\. OBJECTIVE**

Build a **robust Excel import system** that allows users to upload **existing client BOQ files (any format)** and convert them into structured BOQ data inside the QS system.

# **2\. CORE PRINCIPLES**

### **❌ NEVER**

* Do NOT trust Excel structure  
* Do NOT import totals or rates  
* Do NOT calculate inside import  
* Do NOT skip validation

### **✅ ALWAYS**

* Use system master data (`materials`, `units`)  
* Use `bsr_rates` for pricing  
* Use `bsr_analysis` for composite expansion  
* Trigger calculation engine after import

# 

# **3\. SYSTEM ARCHITECTURE**

### **3-Layer Import Pipeline**

\[Excel Upload\]  
      ↓  
\[Layer 1: Raw Reader\]  
      ↓  
\[Layer 2: Mapping Engine\]  
      ↓  
\[Layer 3: Normalization Engine\]  
      ↓  
\[Validation\]  
      ↓  
\[Preview UI\]  
      ↓  
\[Confirm Import\]  
      ↓  
\[DB Insert\]  
      ↓  
\[Calculation Engine Trigger\]

# **4\. INPUT FORMAT (FLEXIBLE)**

System must support:

* Any column order  
* Any column names  
* Missing columns  
* Mixed section/item rows

# 

# **5\. STEP-BY-STEP IMPLEMENTATION**

## **STEP 1: FILE UPLOAD API**

### **Endpoint**

POST /api/boq/import/upload

* Accept `.xlsx`, `.xls`  
* Store temporarily  
* Return `file_id`

## **STEP 2: RAW EXCEL PARSER**

### **Libraries**

* Node.js → `xlsx`  
* Laravel → `PhpSpreadsheet`

### **Output**

\[  
  \["Item", "Description", "Unit", "Qty"\],  
  \["1", "Concrete G25", "m3", 2500\]  
\]

👉 No transformation here

## 

## **STEP 3: COLUMN MAPPING ENGINE (UI REQUIRED)**

### **Purpose**

User maps Excel columns → system fields

### **System Fields**

| Field | Required |
| ----- | ----- |
| description | ✔ |
| quantity | ✔ |
| unit | ✔ |
| material\_name | ✔ |
| section (optional) | ❌ |

### **Example Mapping JSON**

{  
  "description": "Description",  
  "quantity": "Qty",  
  "unit": "Unit",  
  "material\_name": "Item"  
}

👉 Save mapping for reuse

## 

## **STEP 4: NORMALIZATION ENGINE**

Create utility functions:

### **4.1 Normalize Units**

function normalizeUnit(unit):  
    map \= {  
        "m3": "m³",  
        "cum": "m³",  
        "kg": "kg",  
        "bags": "bag"  
    }  
    return map\[unit.toLowerCase()\] || unit

### **4.2 Material Matching (CRITICAL)**

Use:

* Exact match  
* Case insensitive  
* Fuzzy search (recommended: `fuse.js`)

function matchMaterial(name):  
    if exact match:  
        return material  
    else if fuzzy match \> 0.8:  
        return material  
    else:  
        return null

### **4.3 Section Detection**

function detectSection(row):  
    if quantity is null AND unit is null:  
        return true  
    return false

## **STEP 5: VALIDATION ENGINE**

For each row:

### **Rules**

✔ quantity \> 0  
✔ unit exists  
✔ material exists  
✔ if composite → must have `bsr_analysis`  
✔ must have valid mapping

### **Error Format**

{  
  "row": 12,  
  "errors": \[  
    "Material not found: PCC Work",  
    "Invalid unit: cum"  
  \]  
}

## **STEP 6: PREVIEW SCREEN (MANDATORY)**

### **Show processed data BEFORE saving**

| Row | Description | Material | Unit | Qty | Status |
| ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | Concrete | Concrete G25 | m³ | 2500 | ✅ |
| 2 | Mason | ❌ Not Found | day | 50 | ❌ |

### **Actions:**

* Fix mapping  
* Select correct material  
* Edit unit  
* Remove row

## **STEP 7: CONFIRM IMPORT**

### **Endpoint**

POST /api/boq/import/confirm

## **STEP 8: DATABASE INSERT**

### **8.1 Create BOQ**

INSERT INTO boqs (...)

### **8.2 Create Sections**

if detectSection(row):  
    create boq\_section

### **8.3 Create BOQ Items**

INSERT INTO boq\_items (  
  boq\_id,  
  section\_id,  
  material\_id,  
  description,  
  unit\_id,  
  quantity,  
  is\_manual,  
  is\_composite  
)

# 

# **6\. CALCULATION ENGINE TRIGGER**

After import:

for each item:  
    calculateBOQItem(item)

# **7\. CALCULATION RULES (DO NOT CHANGE)**

* Use `bsr_analysis`  
* Use latest `bsr_rates`  
* Store breakdown in `boq_item_breakdowns`

# **8\. SMART FEATURES (RECOMMENDED)**

## **8.1 Save Column Mapping**

{  
  "client\_id": 10,  
  "mapping": {...}  
}

## 

## **8.2 Unit Alias Table**

Table: `unit_aliases`

| alias | unit\_id |
| ----- | ----- |
| cum | m³ |
| m3 | m³ |

## **8.3 Material Alias Table**

| alias | material\_id |
| ----- | ----- |
| PCC | Concrete G20 |
| RCC | Concrete G25 |

## **8.4 Fuzzy Matching**

Use:

* `fuse.js` (Node)  
* `levenshtein` (PHP)

# 

# **9\. PERFORMANCE (IMPORTANT)**

For large BOQs:

### **Use Queue System**

Upload → Queue Job → Process → Save → Done

# **10\. ERROR HANDLING**

Return structured response:

{  
  "status": "failed",  
  "errors": \[...\]  
}

OR

{  
  "status": "success",  
  "boq\_id": 123  
}

# **11\. STRICT RESTRICTIONS**

### **DO NOT IMPORT:**

* totals  
* rates  
* breakdowns

### **DO NOT:**

* calculate inside import  
* skip validation

# **12\. FINAL FLOW SUMMARY**

Upload Excel  
→ Parse Raw Data  
→ User Maps Columns  
→ Normalize Data  
→ Validate  
→ Preview Fixes  
→ Confirm Import  
→ Save BOQ  
→ Run Calculation Engine  
→ Done

# **13\. OPTIONAL EXTENSIONS**

* Drag & drop column mapping UI  
* AI-based material detection  
* Multi-sheet import  
* Version snapshot after import

# **14\. EXPECTED RESULT**

✔ Works with ANY client Excel  
✔ Minimal user effort  
✔ Accurate BOQ generation  
✔ Fully aligned with QS engine  
✔ Scalable \+ enterprise ready