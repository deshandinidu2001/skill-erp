# **FINAL DATABASE DESIGN (Stock Module)**

## **SUPPLIERS**

suppliers

\- id BIGINT PK

\- name VARCHAR(255)

\- contact\_person VARCHAR(255)

\- phone VARCHAR(50)

\- email VARCHAR(255)

\- address TEXT

\- category VARCHAR(100)

\- status ENUM('active','inactive')

\- created\_at TIMESTAMP

\- updated\_at TIMESTAMP

## **SUPPLIER PERFORMANCE**

supplier\_performance

\- id BIGINT PK

\- supplier\_id BIGINT FK

\- total\_orders INT DEFAULT 0

\- on\_time\_deliveries INT DEFAULT 0

\- delayed\_deliveries INT DEFAULT 0

\- average\_rating DECIMAL(3,2)

\- last\_evaluated\_at TIMESTAMP

## **STOCK REQUESTS (PROJECT MATERIAL REQUESTS)**

stock\_requests

\- id BIGINT PK

\- project\_id BIGINT FK

\- requested\_by BIGINT

\- request\_type ENUM('boq\_auto','manual')

\- status ENUM('draft','submitted','qs\_review','approved','rejected')

\- remarks TEXT

\- created\_at TIMESTAMP

\- updated\_at TIMESTAMP

## **STOCK REQUEST ITEMS**

stock\_request\_items

\- id BIGINT PK

\- stock\_request\_id BIGINT FK

\- material\_id BIGINT FK

\- quantity DECIMAL(12,3)

\- unit VARCHAR(50)

\- estimated\_price DECIMAL(12,2)

\- boq\_item\_id BIGINT NULL

## **STOCK REQUEST SUPPLIERS**

stock\_request\_suppliers

\- id BIGINT PK

\- stock\_request\_id BIGINT FK

\- supplier\_id BIGINT FK

## **PURCHASE ORDERS**

purchase\_orders

\- id BIGINT PK

\- supplier\_id BIGINT FK

\- project\_id BIGINT FK

\- stock\_request\_id BIGINT FK

\- po\_number VARCHAR(100)

\- total\_amount DECIMAL(14,2)

\- status ENUM('draft','submitted','approved','delivered','completed','cancelled')

\- expected\_delivery\_date DATE

\- created\_by BIGINT

\- created\_at TIMESTAMP

\- updated\_at TIMESTAMP

## **PURCHASE ORDER ITEMS**

purchase\_order\_items

\- id BIGINT PK

\- purchase\_order\_id BIGINT FK

\- material\_id BIGINT FK

\- quantity DECIMAL(12,3)

\- unit VARCHAR(50)

\- unit\_price DECIMAL(12,2)

\- total\_price DECIMAL(14,2)

\- received\_quantity DECIMAL(12,3) DEFAULT 0

## **PURCHASE APPROVALS**

purchase\_approvals

\- id BIGINT PK

\- purchase\_order\_id BIGINT FK

\- approved\_by BIGINT

\- role\_id BIGINT

\- status ENUM('pending','approved','rejected')

\- remarks TEXT

\- approved\_at TIMESTAMP

## **GOODS RECEIPTS (DIRECT TO PROJECT)**

goods\_receipts

\- id BIGINT PK

\- purchase\_order\_id BIGINT FK

\- project\_id BIGINT FK

\- received\_by BIGINT

\- received\_date DATE

\- created\_at TIMESTAMP

## **GOODS RECEIPT ITEMS**

goods\_receipt\_items

\- id BIGINT PK

\- goods\_receipt\_id BIGINT FK

\- material\_id BIGINT FK

\- received\_quantity DECIMAL(12,3)

\- damaged\_quantity DECIMAL(12,3) DEFAULT 0

# **UPDATED FLOW (FINAL)**

BOQ

 ↓

stock\_request\_items

 ↓

stock\_requests

 ↓

purchase\_orders

 ↓

purchase\_order\_items

 ↓

goods\_receipts

 ↓

(Direct Usage at Project)

# **HOW SYSTEM NOW WORKS**

* Request → Order → Deliver → Use 