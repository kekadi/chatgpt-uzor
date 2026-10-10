# Verification evidence — 2026-10-10
Environment: Node v24.19.0; Supabase nhjuafnlnhbhfshsqxpx; Vercel delta-ma-apprentice. See deployment commit metadata for source version.

| Check | Result | Evidence and scope |
|---|---|---|
| Fixed 31 items, objective keys, section maxima, pending F, critical flags, CSV | PASS | tests/scoring.test.mjs |
| Public output excludes keys/server source and contains parseable scripts | PASS | tests/public-build.test.mjs |
| Admin data requires Auth, server role and organization membership | PASS | mocked API authorization tests; actual account role/org verified in SQL |
| Administrator interactive sign-in | PASS | owner reported successful sign-in; agent did not retrieve a session |
| Candidate unverified email cannot enroll/start/save/submit | PASS | tests/enrollment-api.test.mjs |
| Reviewer cannot create/revoke invitations | PASS | mocked API role tests |
| Invitation tokens random; only SHA256 hash persisted | PASS | mocked invitation API test and deployed source inspection |
| Candidate API binds Auth identity, ignores client-supplied identity | PASS | mocked enrollment API test |
| Deadline scores saved server responses, ignoring late edits | PASS | mocked API test |
| Candidate sign-in, verified invitation/start, saves and receipt | PASS | mocked browser-script workflow, tests/enrollment-ui.test.mjs |
| Consent/invitation mandatory; resume reuses attempt | PASS | mocked browser-script tests |
| Real database consent/identity mismatch/revocation guards | PASS | service_role rollback-only SQL lifecycle test |
| 31 immutable form snapshots on start | PASS | real service_role rollback-only SQL test |
| Replay/stale save/duplicate original/unapproved retake blocked | PASS | real service_role rollback-only SQL test |
| Idempotent submit preserves submitted answers | PASS | real service_role rollback-only SQL test |
| Two truly simultaneous live HTTP starts | NOT TESTED | database row locks and unique constraints inspected; sequential replay/duplicate tests passed |
| RLS/no anonymous data privileges/no client release-update privileges | PASS | SQL privilege checks; security advisor only intentional no-policy informational notices |
| Real applicant email/SMS delivery and full live applicant E2E | NOT TESTED | no real applicant/test contact was used; email confirmation delivery not exercised |
| Phone authentication | REMOVED | Phone provider stays disabled; no phone/SMS gate or OTP request in apprentice enrollment |
| Rendered public pages in desktop Chrome | PASS | live home, applicant and admin sign-in pages inspected at 1363 x 936; no horizontal overflow |
| Public navigation and keyboard focus | PASS | home to applicant to admin links resolve; email Tab focuses password with visible outline; empty admin submit focuses required email |
| Mobile viewport rendering and physical device behavior | NOT TESTED | responsive CSS reviewed; browser exposes no viewport resize API; Windows, macOS, Safari, iOS and Android hardware not exercised |
| Canonical /candidate.html and /admin.html accessible without Vercel login | PASS | direct urllib GETs returned actual application HTML, 200, before this frontend release |
| Edge function deployment | PASS | ma-apprentice-assessment ACTIVE v3, verify_jwt=true |
| Enrollment release flag | PASS | additive migration enables invitation enrollment; verified by SQL |
| No retained synthetic applicants | PASS | database tests rolled back |
| New frontend immutable/canonical release | PASS | Vercel dpl_679s3y6UobqEUZPUZQsqSgdRhRQ1 READY, Git dfad5429dd0a56dc2e3ee7a13806bac4b47d216a; immutable applicant/admin and canonical home/applicant/admin HTTP 200 with updated content |
| Direct canonical access and security headers | PASS | unauthenticated urllib fetched updated pages, no Vercel challenge; Referrer-Policy no-referrer and X-Frame-Options DENY |
| Private hosted source routes | PASS | scoring, shared scoring and enrollment SQL paths HTTP 404 |
| Live unauthenticated API/table access | PASS | anonymous and invalid-session invitation API HTTP 401; anonymous ma_candidates/ma_release_settings REST HTTP 401 |

Applied enrollment migration: 20261010081302_enable_apprentice_invitation_enrollment.sql.
Original schema migration: 20261010073711_create_medical_assistant_apprentice_assessment.sql.
Vercel protection was not modified. Automatic review rejected clearing whole-project SSO; direct canonical access already works, so no bypass was used.
Existing caregiver records/functions remain untouched. No invitation messages were sent. No password, service credential, real user session or OTP was retrieved.

Local command node --test tests/*.test.mjs: 27 passed, 0 failed. Tests for the original demo are included in this count and are distinct from live applicant UI tests.

Live browser QA used deployed source 256e5d4d99138e75d5b4c213bcaa556a8851107f, Vercel dpl_7s66asL7UWaWwcbeTVxkYEqzvGU5. Canonical /admin and /candidate resolve after the cleanUrls routing fix. All three public pages render without horizontal overflow at the tested desktop viewport. Applicant service status correctly reports disabled new phone verification and requires a personal invitation. Signed-in dashboard operations and the full applicant workflow were not exercised in this browser session. No application-origin console error was observed; browser extension errors were excluded. This QA update changes documentation only.

Email-only authentication release: migration 20261010212017_remove_apprentice_phone_authentication.sql, Edge Function v3. Phone contact data retained; RPC p_phone kept for compatibility but no longer checked. Email confirmation, invitation email/Auth-user binding, consent, expiration/revocation, roles and attempt guards retained. Node tests: 27 passed. Email-only enrollment/start with null phone passed the live rollback-only database lifecycle test; revoked/wrong-email/consent/replay guards passed. No fixtures retained. Browser and HTTP deployment checks are reported separately after release.
