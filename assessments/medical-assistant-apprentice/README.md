# Delta Medical PA — Medical Assistant Apprentice selection

Version: SA01-1.0-source. Status: USER_AUTHORIZED_SCORED_USE. Display: Scored assessment.

## Delivered
Private owner-only interactive dashboard preview, a source-faithful printable candidate assessment, browser practice form, scoring engine, staged Postgres schema, authenticated Supabase Edge API source, synthetic fixtures, and executable tests. The preview is a demonstration, not an applicant production deployment.

The supplied SA-01 form has 30 objective questions (90 points) and a written exercise (10 points), 70 minutes. A–F maxima: 20/15/15/25/15/10. An inaccurate clerical entry requires both discrepancy classification and the correct field; choosing only Discrepancy receives no credit. No other partial objective credit is awarded.

SA-02 supplies the objective keys and six written-rubric full-credit standards. F ratings are entered by a human. Unrated F is null; no total /100 exists until F is rated. Objective subtotal remains /90. The dashboard does not fabricate subjective correct/incorrect counts. Source internal recommendations: total >=75, D>=20/25, Q21–23 correct. Flags require documented human disposition; the app does not automatically decide employment. Composite = written*.40 + F09*.30 + F10*.30 only once every result exists. Only applicants with all gates documented as passed should be ranked.

The 120 supplemental role prompts are outside this form and are not imported here. Never mix them into the source form's 100-point denominator. F-09/F-10 full instruments were not supplied; fixture numbers are examples only. Supply the existing instruments and approve their review workflow before launch. No independent validation or item-specific SME signoff is documented in the source package.

## Files and authoritative source
- `src/questions.json`: 31 candidate-safe source items.
- `src/scoring.mjs`: server-only objective keys, scoring, rubric, composite and CSV utilities. Never serve this file as a frontend asset.
- `supabase/functions/assessment/index.ts`: authenticated API source. Launch disabled by default. Uses the Auth user endpoint for verified identity, app_metadata role + organization membership for admin access, and service credentials on the server only.
- `migrations/schema-proposal.sql`: unapplied schema/RPC proposal; unique numbered attempts and service-only atomic start/save/submit/review.
- `tests/`: source scoring and UI-script tests.
- In this assessment folder: `template.html`, `build-demo.mjs`, `index.html`, `admin.html`, and `candidate.html` private demo, `TEST_EVIDENCE.md`.

Source documents: SA-01_Candidate_Selection_Assessment.docx, SA-02_Answer_Key_and_Scoring_Guide.docx, SA-03_Assessment_Administration_Protocol.docx, SA-04_Final_Selection_Scorecard.docx. Their authoritative documents remain in the user's files; this project does not replace them.

## Run and review
From this assessment folder: `node build-demo.mjs` then `node --test tests/*.test.mjs`.

Open the private site's root or `/admin.html` for the demonstration dashboard and `/candidate.html` for the candidate-only practice form. The demo stores changes only in sessionStorage. It contains fictional names and mock patient data; do not enter real applicants. Print the candidate form from the guide. CSV exported data is explicitly DEMO. Closing the browser session may remove changes. Server scoring source is not part of the static asset directory.

## Applicant launch runbook — not yet executed
1. Select a dedicated project/organization and authorized admin identities. The connected Supabase project was discovered but not modified; existing Vercel sites were not modified. Do not assume the discovered project belongs to this workflow.
2. Inspect target tables, RLS, Auth settings, functions and migration history. Install the current CLI only through an approved setup; use `supabase --help`, `supabase migration new ma_apprentice`, and place the staged SQL in that generated migration after review. Apply only to the chosen project and run database/security advisers. Seed ROLE-009, assessment config, candidates and versioned immutable items through a reviewed server process.
3. Configure verified email and phone possession via Supabase Auth, email/SMS delivery, CAPTCHA, rate limiting, invitation expiry, short-lived sessions, device-change review and an accessible supervised alternative. The supplied API rejects unverified email/phone; it does not implement enrollment, OTP delivery, SMS-provider configuration or accessible override approval. Auth handles OTP storage; never create a plaintext OTP table.
4. Create server-owned app_metadata.assessment_role and a matching ma_user_roles organization entry. Frontend sign-in should use only a publishable key. Configure server-only service credential and exact allowed origins. Never publish private scoring files or service keys.
5. Finish live frontend wiring to the API and verified enrollment: the delivered frontend is a private preview, not the production authentication/invitation UI. Add invitation creation/revoke/resend, consent storage, audit-backed retake approval, administrator decision endpoints, attachments if needed, pagination, and cross-device autosave. Existing Edge actions: form/start/resume/save/submit/admin-list/admin-review. Retakes need a ma_retakes row with approval and a matching invitation; source constraints reject mismatched retakes. No invitation delivery is implemented.
6. Preserve the fixed item/version snapshot and approved accommodation timing per cohort. The API currently uses the 70-minute standard; add approved timing extensions on the server before accommodating applicants. Freeze versioned candidate-safe form snapshots on start. Complete expiry behavior including preserving server autosave at deadline; do not rely on the preview timer.
7. Approve privacy notice, retention/legal holds, accommodations/appeal contact, reviewer roles, prospective scoring rules and F-09/F-10 instruments. Approval of scored use is not evidence of predictive validity. Review outcomes after each cohort.
8. Execute every live acceptance check in TEST_EVIDENCE.md. Do not enable ASSESSMENT_LAUNCH_ENABLED until blockers are resolved. The guard is intentionally false by default.
9. For Vercel use one source folder `assessments/medical-assistant-apprentice/`, Other/static settings, and candidate/admin direct routes; copy only candidate-safe/public frontend assets. Review CSP and security headers against finalized code. Configure frontend API origin and provider Auth settings. Verify immutable and canonical candidate/admin URLs separately. Do not expose a candidate URL without owner authorization.

## Privacy notice template — complete before launch
Delta Medical PA collects the applicant's name/application ID, verified contact details, assessment responses, relevant administration adjustments, reviewer ratings and hiring rationale for recruitment. Do not submit patient information, medical history or diagnosis. Contact: [administrator email]. Retention: [approved duration and legal-hold policy]. Accommodation/appeal contact: [contact and process]. Access limited to authorized recruitment staff. Define deletion, recovery, export and audit policy before collection.

## Maintenance / rollback
Keep the current source form immutable within a cohort. Create a prospective new version for changed questions/keys/rubrics. Revert static preview via the previous saved Site version. Never erase assessment attempts or audit history as a rollback. Add database migrations prospectively; backup/restore and candidate-data migration must be tested separately. Do not delete records under legal hold. Re-run scoring regression tests for every key/rubric change.

## Changelog
2026-10-10: Created ROLE-009 source-based assessment preview and dashboard, source scoring engine, staged secure database/API design, and verification evidence. No applicants imported, messages sent, target database changed, or external Vercel project deployed.
