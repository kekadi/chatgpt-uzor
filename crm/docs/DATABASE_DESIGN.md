# Database design direction
Status: design baseline; no live schema changes | Date: 2026-10-12

## Decision
Use PostgreSQL as a shared transactional database for a modular application. Supabase is a compatible managed-host option, subject to PHI hosting requirements and isolation from existing assessment applications. Start with one database and logical module schemas; split services only when workload or security boundaries justify it.

## Shared core
- practices, locations and settings: practice UUID and location UUID; identity independent of the current leased address.
- staff_profiles, memberships, roles, permissions and role_permissions: managed auth identity mapping; no locally stored passwords.
- patients, patient_identifiers, patient_contacts and care_team_members: authoritative identifiers and authorized relationships.
- cases: patient, module/type, owner, urgency, workflow state, version and event dates. Tenant-scoped human display IDs distinct from UUID primary keys.
- tasks, assignments and case_events: reusable work queues, assignment history and state-transition evidence.
- directory_organizations, directory_contacts and directory_services: specialist/vendor records, verification and participation metadata.
- documents and document_links: database stores metadata and private object-storage keys; files stay in private storage.
- audit_events: access, changes, exports and privileged actions; restricted append-only application permissions.

## Operational modules
- referral_cases: one-to-one case detail, specialist, specialty, order indication and consultation closure.
- dme_cases: one-to-one case detail, equipment, quantity, vendor and delivery confirmation.
- authorization_cases: one-to-one case detail, payer/service, codes, approval and validity.
- appeals and appeal_events: explicit case/authorization foreign keys; multiple attempts and outcomes.
- communications and communication_case_links: controlled participant/channel metadata and follow-up.
- workflow_definitions, workflow_states, allowed_transitions, aging_rules and escalation_rules: approved, versioned configuration. Preserve rule versions and assignment events for historical reports.
Use explicit foreign keys for operational relationships; avoid unconstrained record_type/record_id links for patient care.

## Integration and reporting
integration_connections, external_resource_mappings, sync_runs, sync_errors and outbox_events. External identifiers are unique by practice, source and resource type. Avoid storing tokens in ordinary rows or raw response payloads in logs. Server-managed secret storage and encrypted token storage require implementation review.
Transactional outbox supports retryable background jobs with deduplication keys, retry bounds and dead-letter review. Dispatch PHI only to approved destinations.
Use SQL reporting views/materialized summaries after authorization boundaries are defined. Calculate clinical workflow age from event history, not an editable spreadsheet. KPI definitions and revisions are stored separately.

## Expansion boundaries
- engagement: campaigns, recipient deliveries, consent history, survey templates/versions and responses.
- care_management: plans, goals, interventions, transitions and care gaps.
- inventory: products, lots, stock movements and monitoring records.
- knowledge: controlled documents, approvals, learning content, courses and acknowledgments.
- workforce: employee records and credentials; restricted HR records separately.
- programs: programs, cohorts, enrollments, competency requirements and assessment attempts.
Assessments preserve question/rubric version, responses, reviewer and published result. Anonymous surveys require a purpose-built response path that does not preserve identifying links; identifiable forms use explicit subject records.

## Structural conventions
UUID primary keys; practice_id on tenant-owned tables; composite foreign keys include practice_id to prevent cross-practice relationships. Location is distinct from practice ownership. Use timestamptz for events, date for birth dates, precise numeric for money, and integers with unit metadata for quantities.
Use normalized typed columns for searchable operational fields. JSONB is limited to versioned extensions and approved integration metadata, with size limits and schema validation. Do not put all clinical/workflow data in a generic JSON document.
Add created_at, updated_at, created_by/updated_by, archival metadata and optimistic concurrency versions where applicable. Reject silent lost updates. Avoid cascading deletion of patient/case history.
Index practice plus workflow status, owner, due dates and authoritative identifiers; add foreign-key indexes and partial indexes for active queues. Use cursor pagination and connection pooling. Partition event/audit tables only after volume and query evidence warrant it.

## Security and release sequence
Private schemas with no anonymous grants; row-level authorization and least-privilege runtime roles. Access derives from maintained memberships/permissions, not editable user metadata. Client requests cannot set authorization context. HR and employee health data require narrower permissions than patient operations.
Audit read access in the API; database write audit does not capture reads. Do not dump PHI values into general-purpose telemetry. Retention and authorized correction workflows are required; audit immutability is enforced against application roles, not claimed against database administrators.
Define schema migrations after workflow/data-field review. Test in isolated staging with synthetic records, including denied cross-practice relationships, denied exports and suspended-account access. No production migration or existing Supabase data transfer is authorized by this design artifact alone.
