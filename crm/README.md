# Delta Medical PA geriatric CRM — development baseline

This is an initial implementation in the `crm/` monorepo directory. It is not an operational PHI system or a completed Phase 1 release. Existing assessment records and functions are retained. The standalone continuation adds isolated synthetic-testing objects to the connected database.

## Run

Use Node.js 24, then `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`. `npm run dev` starts the development application. The default workspace contains clearly named synthetic patient records; changes are held in component state and disappear on reload. Do not enter real patient or employee information in the demo.

## Implemented

- Next.js 16.4, responsive workspace, four case modules with synthetic create/edit/archive flow.
- Shared PostgreSQL schema with patient registry, staff memberships, three roles, case details, directory, aging configuration, tasks, document metadata and audit/event tables.
- RLS practice isolation, staff-owned case access, active membership and MFA checks; browser cannot grant itself membership or a role.
- Managed Supabase JWT authentication/MFA enrollment UI, protected case/patient APIs, transactional case/detail saves and optimistic concurrency checks.
- Change and assignment event capture, completion-evidence constraint and workflow-transition validation.
- Recharts six-month trends, current-owner productivity, draft elapsed-hour aging indicators.
- ExcelJS nine-tab workbook, conditional aging formatting, validation lists, cached KPI formulas and formula-injection escaping.
- eCW readiness checklist; live eCW API route explicitly reports not implemented.
- Roadmap navigation for the later modules.

## Isolated database provisioning

Create a dedicated CRM development project after selecting the hosting environment. Do not use the assessment application's database without an isolation review. Supabase roles/auth primitives must exist before applying `db/schema.sql` in a disposable development project.

The SQL is a validated schema baseline, not a production migration. Use `supabase migration new` and the migration workflow after review. Only then configure an isolated staging database. Keep `crm` out of exposed schemas until grants/RLS and direct Data API risks have been reviewed; exposing it is required for this baseline's Supabase schema client. Provision approved staff memberships via a trusted operator. Membership writes are deliberately unavailable to browser users. Disable public sign-up in the auth provider; invitations and recovery must use approved redirect URLs.

Set the public Supabase URL/publishable key in the deployment's secure configuration. Never provide a service-role key to the browser. `CRM_LIVE_DATA_ENABLED` defaults to false. Enabling it is not a substitute for the readiness checks. Staff sign in with a managed account and TOTP MFA; workspace access additionally requires active membership. Live workspace connection accepts the assigned development practice UUID. The current role selector affects only synthetic demonstration data.

## Limits and required work before operational release

- Actual eCW OAuth registration, token lifecycle, tenant capability discovery, synchronization and ServiceRequest write-back are not implemented/activated.
- Only the first 100 patients/cases load in the UI; cursor API support is preliminary. Background export is required above the interactive export limit.
- Live aging-rule editing/version selection, business-hours calendars and pause clocks are pending; the displayed thresholds are unapproved draft elapsed-hour rules.
- Complete case-specific closure evidence, clinician sign-off permissions and complete field validation require workflow review.
- Patient registry editing, tasks UI, document upload/storage/virus scanning, staff administration/invitation/recovery and persistent integration checklist are pending.
- Audit inserts can be supplied by authenticated callers in this baseline; a restricted authoritative read-audit service and resistance to fabricated audit entries need hardening.
- Historical owner events are captured in SQL, but dashboards currently show current-owner snapshots.
- Eight specialist and eight vendor candidates are sourced from official websites; local DME servicing branches, payer participation and service availability require practice confirmation. Sourced SOP approval and KPI targets are pending.
- No browser-level verification: the environment has no available supported browser. Unit/database tests and build/runtime smoke checks are recorded in TEST_EVIDENCE.md.
- HIPAA vendor arrangements, secure hosting/storage configuration, backup restore validation, rate-limit setup and security review are required before PHI use.

The normalized CRM production schema has not been applied. The standalone continuation applies only the dedicated synthetic-testing workspace migrations to the connected project. Live user sign-in and MFA cannot be verified until the isolated project is provisioned.

## Standalone continuation

See docs/STANDALONE_SCOPE_UPDATE.md. eCW integration is optional and does not block testing. Module 16 now provides the current assessment/source catalog, thirty role-template references, program setup, synthetic enrollments and evidence-backed human review records. New test patients and coordination tasks can be registered without an EHR connection.

Persistent testing uses `/api/testing` backed by the dedicated `crm-testing-state` gateway. Configure the three server-only CRM_TEST_STORAGE variables and keep Vercel protection on for all deployments. The scoped gateway credential is never sent to the browser. Run `node sync-testing-edge.mjs` before deploying the Edge Function so its generated model matches the app validator. Its JWT gateway setting is disabled because the function implements its own strong server-to-server authentication; it does not accept anonymous unverified requests.

The original README's session-only description applies only when persistent testing is not configured. The active testing deployment is configured for shared persistence. Patient PHI mode remains separate and disabled. Existing assessment apps continue to manage their own candidate identity, data and scoring.
