# **Marketing Module(CRM) – Process Guideline**

## **Lead Creation**

* **Trigger:** Marketing team receives a new prospect.  
* **Process:**  
  1. Enter lead details: customer name, contact info, project location, project type.  
  2. Lead status is initialized as `NEW`.  
  3. Status history is logged automatically.  
* **Outcome:** Lead exists in the system, ready for requirements capture.

## **Requirement Capture**

* **Trigger:** After lead creation.  
* **Process:**  
  1. Capture project-specific requirements:  
     * Drawing requirements  
     * Construction requirements  
     * Additional notes  
  2. Requirements are linked to the lead.  
* **Outcome:** Lead has all necessary info to determine workflow and tasks.

## **Workflow Assignment**

* **Trigger:** After requirements are captured.  
* **Process:**  
  1. Determine workflow based on project type:  
     * `DRAWING_ONLY`, `2D_3D`, `CONSTRUCTION_ONLY`, `FULL_PROJECT`.  
  2. Assign `lead_workflow` with the first stage as `current_stage`.  
  3. Assign teams dynamically:  
     * 2D Team  
     * 3D Team  
     * QS Team (BOQ/Construction)  
* **Outcome:** Lead is mapped to the correct workflow with teams ready.

## **Task Creation & Assignment**

* **Trigger:** Workflow assigned.  
* **Process:**  
  * For the current stage, create tasks based on stage type:  
    * **2D Stage:** Assign to 2D Team.  
    * **3D Stage:** Assign to 3D Team.  
    * **QS Stage:** Assign to QS Team.  
  * Define task duration with start and due dates.  
* **Outcome:** Teams have actionable tasks to execute.

## **Task Execution & Submission**

* **Trigger:** Task assigned to team.  
* **Process:**  
  1. Team completes work.  
  2. Upload files/submissions (multiple files allowed with titles/descriptions).  
  3. Submission is recorded in the system.  
* **Outcome:** Work is ready for marketing review.

## **Marketing Review**

* **Trigger:** Task submission received.  
* **Process:**  
  1. Marketing reviews submission.  
  2. Decide:  
     * `APPROVED` → proceed to next stage.  
     * `REJECTED` → task reassigned for revision.  
     * `REVISION_REQUESTED` → team revises and resubmits.  
  3. Maintain review history.  
* **Outcome:** Stage is completed correctly before moving forward.

## **Workflow Progression**

* **Sequential Execution Rules:**  
  * Only one stage active at a time.  
  * Next stage starts automatically after approval.  
  * Rejection keeps task at same stage.  
* **Example Flow by Project Type:**  
  * **Drawing Only (2D):** 2D Team → Approval → Client.  
  * **2D \+ 3D:** 2D → Approval → 3D → Approval → Client.  
  * **Construction Only:** QS Team → Approval → BOQ → Client.  
  * **Full Project:** 2D → Approval → 3D → Approval → QS → Approval → Client.  
* **Outcome:** Work progresses stage by stage, maintaining control and auditability.

## **QS Integration & BOQ Handling**

* **Trigger:** QS stage or Construction involved.  
* **Process:**  
  1. Send lead to QS team for estimation (`QS_PENDING` status).  
  2. QS prepares BOQ and submits.  
  3. Marketing receives BOQ reference and updates lead.  
* **Outcome:** BOQ is ready for client review and approval.

## **Client Communication & Response**

* **Trigger:** BOQ or final output ready.  
* **Process:**  
  1. Client can approve, reject, or request modifications via portal or other channels.  
  2. Record response:  
     * Source: `CLIENT` or `MARKETING` (if marketing handles approval on behalf).  
     * Method: Portal, Email, Call, WhatsApp, In-person.  
  3. Update lead status accordingly:  
     * `APPROVED`, `REJECTED`, or `MODIFICATION_REQUEST`.  
* **Outcome:** Client decision is captured and workflow updates.

## 

## **Client Portal Access**

* **Trigger:** Lead reaches client review stage.  
* **Process:**  
  * Provide a client a secure link/token.  
  * Client can view:  
    * Project/lead status.  
    * BOQ/quotations.  
    * Uploaded designs/documents.  
  * Client actions update the system automatically.  
* **Outcome:** Transparent client interaction, all actions logged.

## **Task & Workflow State Machine**

**Task States:**  
PENDING → IN\_PROGRESS → SUBMITTED → APPROVED

                               ↘

                                REJECTED → IN\_PROGRESS

* **Workflow Rules:**  
  * Sequential execution enforced.  
  * The next stage triggers automatically after approval.  
  * Rejected stages are looped back for revision.  
* **Outcome:** Clear, controlled progression with audit trail.

## **Project Creation & Notifications**

* **Trigger:** Lead approved by client.  
* **Process:**  
  1. The system automatically triggers project creation.  
  2. Notify all relevant teams (2D/3D/QS).  
* **Outcome:** Approved leads seamlessly convert into active projects.

## 

## **Summary Flow – End to End**

Lead Created → Requirements Captured → Workflow Assigned → Task Created

→ Team Submits → Marketing Reviews → Next Stage Task

→ QS Stage (if applicable) → BOQ to Client → Client Response

→ Approval → Project Created → Notifications

* All stages are **tracked in system tables** (`leads`, `lead_status_logs`, `tasks`, `task_submissions`, `submission_reviews`, `lead_workflows`, `lead_boqs`, `client_responses`).  
* **Marketing controls review and approval loop**, ensuring quality and sequential execution.  
* **Client portal allows transparency**, while still letting marketing handle cases of non-response.