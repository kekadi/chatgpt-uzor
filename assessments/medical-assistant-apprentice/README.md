# Delta Medical PA — Medical Assistant Apprentice
SA01-1.0-source · USER_AUTHORIZED_SCORED_USE · Scored assessment

## Live application
Home: https://delta-ma-apprentice.vercel.app/
Applicant enrollment: https://delta-ma-apprentice.vercel.app/candidate.html
Administrator dashboard: https://delta-ma-apprentice.vercel.app/admin.html

Invitation enrollment is enabled in ma_release_settings. Administrators create seven-day links for an application ID, email, E.164 phone, and cohort. Copy and share manually; no invitation email is sent automatically. The server stores only a token hash. Reissuing revokes earlier unused links. Existing attempts must resume.

Applicants create an email/password account, confirm the email link, return to their invitation page, and sign in. They verify their invited phone by SMS and consent before starting. Both confirmation timestamps are mandatory on the server. **Supabase phone authentication is currently disabled**; new phone verification is blocked until the owner configures and enables its SMS provider in Auth Providers. Keep auto-confirm disabled. Previously verified applicants can proceed. Real email/SMS delivery is NOT TESTED.

The owner confirmed administrator sign-in works. The authorized existing account has the shared assessment_admin role, apprentice assessment_role, and Delta Medical PA organization membership. The caregiver role is retained. No password or session was created or retrieved.

## Assessment
Fixed SA-01: 70 minutes, 30 objective items (90 points), one human-graded written exercise (10). Section maxima A–F: 20/15/15/25/15/10. Clerical discrepancies require the correct field. SA-02 keys remain server-only. F requires six human ratings and evidence; until then, F and total /100 are pending. Internal recommendations >=75, D>=20/25, Q21–23 correct require documented human review. No automated hiring decision.

Supplemental prompts are excluded. Interview F-09 and work-sample F-10 instruments were not supplied; final composite ranking remains unavailable. No independent psychometric validation is documented in this package.

## Architecture
GitHub: kekadi/chatgpt-uzor, branch assessment/medical-assistant-apprentice, folder assessments/medical-assistant-apprentice/, draft PR #1. Explicit Git deployments do not require merging.

Vercel: delta-ma-apprentice, Other framework, node build-public.mjs, output public. Only web/index.html, web/candidate.html, and web/admin.html are served. Original top-level HTML/build-demo.mjs files are demo examples. SQL, tests, source keys and server code are excluded. Vercel protection was not changed; canonical pages are directly reachable. Administrator data still requires Supabase Auth and server authorization.

Public build variables: ASSESSMENT_SUPABASE_URL, ASSESSMENT_PUBLISHABLE_KEY, ASSESSMENT_API_URL, ASSESSMENT_ORG_ID. Supabase service credentials remain server-only.

Supabase nhjuafnlnhbhfshsqxpx: 17 isolated ma_ tables, RLS, no anonymous/authenticated table access. Applied migrations 20261010073711_create_medical_assistant_apprentice_assessment.sql and 20261010081302_enable_apprentice_invitation_enrollment.sql. Edge ma-apprentice-assessment version 2 is active, verify_jwt=true. Legacy caregiver records are untouched.

API: enroll/form/start/resume/save/submit/admin-list/admin-review/admin-invite/admin-invitations/admin-revoke. Candidate forms freeze at start. Row locks, unique original-attempt constraints, revision guards and idempotency protect lifecycle operations. Retakes require approval and a matching numbered invitation; no self-service retake UI. At deadline only server-saved answers are scored. Reopen the invitation and sign in to resume. The timer continues if the browser closes. Reconnect and submit saved answers if deadline submission could not reach the server.

## Operations
1. Configure/enable SMS in Supabase and verify both real delivery channels with an authorized test applicant.
2. Sign in, create invitation, copy the displayed link, and share it with the intended applicant. Plaintext tokens cannot be retrieved later.
3. Applicant verifies both contacts, consents, then starts/resumes. Human reviewers grade F and document dispositions.
4. Confirm accommodations before starting. Current timing is the fixed 70-minute standard; server timing extensions must be implemented before use.
5. Establish organization retention/deletion policy. Contact for privacy, accommodations and appeals: paul.uzor@delta-medical.com. Do not collect patient information or applicant medical histories.

## Verification and rollback
Build with the four public variables, then node --test tests/*.test.mjs. Backend/UI tests mock Auth and network and do not prove OTP delivery. tests/enrollment-database.sql exercises real database controls within a rollback transaction, preserving zero synthetic applicants. See TEST_EVIDENCE.md.

To pause enrollment, set ma_release_settings.enrollment_enabled=false through a reviewed service-side update. Preserve existing attempts/audit records. Revert the application Git commit and deploy that exact commit for frontend rollback; never delete records or undo additive schema changes. Version changed questions/keys prospectively and rerun tests.

## Changelog
2026-10-10: Created source-faithful assessment/demo, published Git source, deployed database/API/frontend and authorized the administrator.
2026-10-10: Enabled invitation enrollment; implemented candidate consent/verification/save/resume/receipt, administrator invitation management, form snapshots and saved-answer deadline submission. Owner-side SMS activation remains required for new phone verification.
