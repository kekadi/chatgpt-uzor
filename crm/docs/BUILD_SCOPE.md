# Delta Medical PA — Geriatric Primary Care CRM build scope
Version: 1.0 proposed build baseline | Date: 2026-10-12 | Location: Burleson, Texas

## Purpose and delivery boundaries
Build one practice-wide modular CRM for geriatric primary care operations. eClinicalWorks (eCW) remains the authoritative clinical chart. The CRM owns coordination cases, assignments, communications, workflow history, operational reporting and controlled reference content. Support Windows, macOS, iOS and Android through a responsive browser interface.

This document defines proposed work, not a completed deployment or certification. Phase 1 is the detailed launch scope below. Previously discussed modules remain in the expansion roadmap; their live integrations are not silently included in Phase 1.

## Source applications
Reference the three imported branches in kekadi/chatgpt-uzor:
- claude/claude-md-medical-mode-6gkgk: contextual guidance, reviewed before reuse.
- claude/referral-dme-management-3SPPu: workflow, UI and Excel export reference.
- claude/implement-todo-item-Zkbf8: task-management reference.
The copied referral source uses SQLite. Replace that persistence design with PostgreSQL; do not transfer demo patient records or hardcoded demo credentials.

## Architecture and security foundation
- Next.js application, TypeScript, Recharts for application charts, ExcelJS for workbook export.
- User-requested reference stack is Next.js 14. Production recommendation: supported, patched Next.js release, currently 16.x Active LTS per vendor policy. Record any approved compatibility exception; do not silently ship the old source's Next.js 14.2.5.
- PostgreSQL relational database, compatible with managed Supabase hosting, using versioned migrations. See DATABASE_DESIGN.md.
- Three initial staff roles: Administrator, Supervisor and Staff. Role presets map to explicit permissions, module access and assignment scope. A clinical approval permission is separate from job title; do not infer clinical authority from the Administrator role.
- Invitation-based staff registration, administrator approval, managed JWT sessions, MFA, recovery flow, rate limiting, secure cookie/session handling, server-side authorization and prompt access revocation. Never rely on user-editable JWT metadata for authorization.
- Staff access scoped to practice and duties; offshore assistants receive task-specific access. No anonymous access to patient information.
- Row-level security, server-side validation, restricted exports, access/read and change audit logs, secret management, encrypted connections, private attachments and short-lived authorized downloads.
- Separate development, staging and production. Synthetic test data only in source control and ordinary previews.
- HIPAA readiness requires the actual hosting/data/communications/OCR vendors, applicable BAAs, configuration, policies and operational controls to be verified before PHI use. JWT authentication alone is insufficient. Do not label an unverified build HIPAA-compliant.
- Backups, recovery targets, restore testing, monitoring and incident response must be specified and verified before production. Proposed recovery objectives: RPO <=1 hour and RTO <=4 hours; these are targets, not guarantees.

## Phase 1 modules and requirements

### 1. Patient registry and care team
Internal patient UUID; eCW patient ID and practice-scoped MRN; demographics and contact preferences; provider assignment; caregiver/authorized representative relationships and communication permissions. Match imported patients by authoritative identifiers, with a human duplicate-resolution queue. Record source and last sync time. No uncontrolled two-way demographic overwrites.

### 2. Tasks, queues and escalations
Patient- or case-linked tasks with owner, due time, urgency, status, supervisor escalation and coverage/reassignment. Task history records changes. Configure STAT/Urgent/Routine thresholds by module and workflow stage.
Aging is calculated from an explicit clock-start event, elapsed hours or business hours, pause rules and the threshold version applied. Store all timestamps with time zone; show America/Chicago. Closed/cancelled items do not remain overdue. Red/yellow/green indicators also carry text/icon labels.
Thresholds and clinical response requirements require Medical Director review; red indicates overdue coordination, not an automated clinical diagnosis. Provide a documented immediate escalation path for STAT items.

### 3–5. Referrals, DME and prior authorizations
Full create/read/update/delete capability subject to authorization and audit controls. Operational deletion is archival/soft deletion by default; permanent deletion follows retention rules.
- Referrals: patient, referring clinician, specialty, specialist, indication/codes, payer, urgency, authorization, owner, stage dates and consultation return/review.
- DME: equipment, quantity, vendor, indication, coverage requirements, authorization, submission/delivery dates, denial and confirmation.
- Prior authorizations: service/medication, payer, supporting records, diagnosis/procedure codes, submission, denial reason/code, approval number, validity dates and follow-up.
- State-transition validation and required fields. Completion requires module-specific evidence; sending a referral does not close it.
- Link appeals to the relevant authorization or case. Preserve prior decisions and corrections.
- Documents and communications attach to cases with access checks.

### Appeals and peer-to-peer log
P2P, written appeal and other configured types; payer reference; owner; clinician reviewer; scheduling; deadline; submission and decision dates; outcome; next action and supporting documents. Record outcomes such as overturned, upheld, withdrawn and pending, with explanations.

### 6. Communications foundation
Log patient/caregiver, specialist, payer and vendor contact attempts; channel, date, purpose, outcome and next task.
Single/bulk texting, automated campaigns and survey distribution remain Phase 2 provider integrations. Phase 1 must not display nonfunctional send controls as active.

### 11. Documents and reference directory
Private attachments, document metadata, case linkage, authorized downloads, malware screening and upload limits.
Initial intake supports authenticated manual upload and tracking. Fax/email ingestion, scanner connectors and OCR arrive in Phase 2.
Directory: at least eight local/regional specialists covering distinct relevant specialties, and eight vendors/suppliers covering DME, lab, imaging and transport. Verify name, location, phone/fax, official source and verification date before release. Do not invent Medicare/payer participation, wait time or availability; mark unknown and track practice verification.

### 12. Reporting and administration
Recharts KPI dashboard, monthly six-month trends and owner productivity:
- Open volume, aging distribution, overdue rate and turnaround time by module/urgency.
- Referral closed-loop completion; DME delivery; PA approval/denial; P2P/appeal outcomes.
- Owner workload, completed work, overdue tasks and reassignment.
- Metrics use documented numerator/denominator, event date and exclusions. Six-month charts use complete calendar months by default; current partial month is separate.
- Owner history prevents reassignment from rewriting historical productivity. Compare timeliness and case complexity; do not rank solely by closure count.
- Admin settings: role permissions, aging rules, escalation owners, KPI targets, directory upkeep and eCW approval checklist.

## eClinicalWorks integration workstream
Implement a server-mediated FHIR R4/SMART on FHIR OAuth 2.0 adapter. Keep eCW credentials and tokens server-side. Separate CRM staff sessions from eCW OAuth grants.
- Discover tenant capability and SMART configuration; validate supported scopes, resources and permitted operations.
- Patient synchronization plus permitted Condition, medication and Coverage resource reads. Select actual medication resources from the approved capability statement.
- Pagination, rate-limit handling, resumable sync, idempotency, conflict handling and sync failure/reconciliation queues.
- Persist source identifier, version and sync timestamp. Minimize duplicated clinical information.
- ServiceRequest referral creation is conditional on eCW-supported create interaction, approved write scope and practice authorization. Require clinician approval, validation and duplicate prevention. Otherwise provide a draft plus tracked manual eCW handoff and acknowledgement; never report a failed handoff as successful.
- Admin checklist: developer registration, practice API activation, agreements/costs, tenant endpoint, client registration, redirect URLs, OAuth flow/scopes, sandbox tests, capability evidence, production approval, token management and end-to-end verification.
Live eCW integration depends on vendor approval and credentials. A simulated integration is clearly marked until verified.

## Excel workbook deliverable
One .xlsx export containing exactly these nine required tabs:
1. Referrals — age and urgency-aware red/yellow conditional formatting.
2. DME Orders — status and denial-reason validation lists.
3. Prior Authorizations — denial codes/reasons and validity dates.
4. P2P / Appeal Log — decisions and outcomes.
5. KPI Dashboard — documented formula-based metrics.
6. Monthly Rollup — six completed calendar months.
7. Staff Productivity Dashboard — current owner plus historical event attribution.
8. Burleson Specialist Directory.
9. Vendor Directory.
Keep table names, filters, date formats and data validation consistent. Derive aging using a visible export as-of time and the same configured rules as the application. Escape user-controlled cells against spreadsheet formula injection. Recalculate/verify formulas and conditional formatting.
Exports are audited and permission-scoped. They are snapshots; editing dropdowns in Excel does not update the CRM. File protection is not a substitute for secure distribution.

## SOP and policy reference deliverable
Version-controlled escalation matrix; referral, DME and PA workflow maps; KPI definitions/targets; role-specific job aids for CMS documentation requirements, denial codes, P2P preparation and HIPAA workflows.
Each item has an owner, version, approval status, effective/review dates and source references. Distinguish proposed internal targets from payer/CMS requirements. Obtain appropriate clinician/administrator approval before operational use.

## Expansion roadmap retained from prior discussions
Phase 2:
- Individual/bulk texting, consent/preferences, templates, delivery tracking, opt-outs and monitored replies.
- Patient/staff surveys, questionnaires and forms with separate restricted workspaces.
- Document OCR, human-reviewed matching/classification and fax/email/scanner intake.
- Care management/transitions, care gaps, geriatric/caregiver coordination and medication access/inventory.
Phase 3:
- Workforce/HR management.
- Knowledge, policy and learning management, manuals, SOP acknowledgments and training videos.
- Apprenticeship/internship cohorts, competency assessments, performance evaluations and employee surveys.
Patient records, ordinary employee profiles and confidential HR/employee medical records have separate access boundaries. Future patient/applicant portal identities do not receive staff permissions.

## Delivery order
1. Database/authentication foundation, synthetic fixtures and permission tests.
2. Patient registry, tasks, referral/DME/PA/appeal workflows and documents.
3. Dashboards, nine-tab workbook, directories and SOP reference.
4. eCW adapter and approval checklist in parallel, followed by approved live integration.
5. Staging acceptance and controlled production rollout; subsequent module phases.

## Phase 1 acceptance criteria
- CRUD/state transitions, archival and audit records verified for each role.
- No anonymous/cross-practice/unauthorized module access; immediate revoked-account denial verified.
- Urgency boundary, business-hours, daylight-saving and closed-case aging tests pass.
- Registry matching and duplicate sync tests pass with synthetic records.
- All four operational modules support complete assigned workflows and evidence-based closure.
- Dashboard totals and six-month trends reconcile to fixtures and Excel formulas.
- Workbook has all nine tabs with correct formatting/validation and protected export scope.
- Eight specialists and eight vendors have verification evidence or an explicit unresolved field.
- eCW reads/write-back separately pass approved tenant tests, or remain visibly unavailable with documented manual handoff.
- Backup restore, security review, audit, vendor readiness and staff operating procedures verified before PHI launch.

## References and verification limits
- Next.js support policy: https://nextjs.org/support-policy (checked 2026-10-12; 14.x listed unsupported, 16.x Active LTS).
- eCW interoperability: https://www.eclinicalworks.com/products-services/interoperability/ (checked 2026-10-12; provider-facing SMART and bulk/backend developer entry point).
- Supabase shared responsibility: https://supabase.com/docs/guides/deployment/shared-responsibility-model
- Supabase HIPAA responsibilities: https://supabase.com/docs/guides/security/hipaa-compliance
Vendor sources do not establish the specific practice's ServiceRequest write access. Database schema and application implementation have not yet been deployed under this scope.
