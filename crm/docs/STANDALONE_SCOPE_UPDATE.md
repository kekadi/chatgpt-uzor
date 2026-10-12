# Standalone testing and module 16 — 2026-10-12

The owner directed the CRM build to continue independently of eClinicalWorks. Manual patient registration and all coordination workflows can operate without eCW. Integration identifiers, capability state, the adapter interfaces and the existing approval checklist remain extension points. eCW vendor approval is not a CRM testing dependency; it becomes a condition only for enabling actual eCW data exchange.

## Module 16 inventory

Nine discovered assessment/source entries are cataloged: Medical Assistant Apprentice selection; Falola caregiver prehire; FC Andorra tryout readiness; Madrid scouting preparation; Biology, English Comprehension, English and Aral Sea repository sources; and the existing MA Competency Validation Checklist document reference. Thirty role-specific template records are also included as an inventory, not newly generated live tests.

The four deployed assessment/quiz entry routes were checked. MA candidate/admin routes returned 200. Falola immutable candidate/admin routes returned 200; the older canonical aliases returned lookup 404, so the catalog uses the working immutable deployment. FC Andorra's current route returned 200 despite newer deployment metadata showing an ERROR. Academic repository entries are source-only. No deployment is invented for them.

Existing answer keys, scoring, candidate records, invitation/attempt controls and enrollment links stay in their original source systems. This build does not copy real candidate results, move answer keys into browser code, send invitations or change source-assessment behavior. Template eligibility labels preserve the existing owner-authorized statuses; pending human reviews are not treated as zero.

## Program testing

Programs can be created/edited with type, duration, milestones and linked instruments. Synthetic enrollment records track start date, status and completed hours. Initial assessments, competency observations, performance reviews, graduation reviews and employee-survey records support pending or evidence-backed human ratings. The displayed mean excludes pending reviews and is not an existing assessment score or a hiring recommendation.

The initial apprenticeship record is a configurable draft using the most recent 16-week/640-hour context. Earlier 20-week material remains historical source information and is not rewritten by this configuration.

## Persistence boundary

Protected testers share server-backed synthetic state for patients, cases, tasks, programs, enrollments, reviews and the optional eCW checklist. Reloads and app redeploys read existing state; there is no automatic reset. Revision checks reject stale writes. Testing names must start with Test or Synthetic, and test MRNs use TEST-/DEMO- prefixes.

A separate test workspace and revision log in the connected PostgreSQL project are used. Existing assessment tables/functions are untouched. The gateway uses a server-only scoped credential; no Supabase service-role key is copied into Vercel or the browser. Direct anonymous/authenticated table access is revoked and RLS is enabled. RLS-without-policy advisory notices are expected for these server-only tables, not a reason to add public policies.

The bounded JSON snapshot is a test harness. The normalized PostgreSQL core remains the production design; patient PHI and confidential employee records must not be placed in this testing snapshot. Vercel protection applies to the entire development deployment. The role selector simulates UI roles and does not grant real source-assessment permissions.

## Future integration

`lib/integrations.ts` defines optional patient/read and referral-order adapters, external identifiers, capability state and idempotency boundaries. Connecting eCW later must preserve internal IDs and source provenance, handle duplicate/conflict resolution and retain explicit clinician authorization for any write-back. Standalone operations must continue when an adapter is disconnected or unavailable.
