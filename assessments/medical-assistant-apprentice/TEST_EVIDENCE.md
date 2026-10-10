# Verification evidence — 2026-10-10
Environment: local Node v24.19.0. Source: this Site repository, initial version. Final commit is recorded by the Site publishing workflow.

| Check | Result | Evidence / scope |
|---|---|---|
| SA-01 inventory | PASS | 31 fixed items, Q11–30 each have 4 source choices |
| Source answer keys, section maxima, total | PASS | tests/scoring.test.mjs; all correct produces 90 objective and 100 final |
| Pending F and composite | PASS | null remains pending; subjective correct count null |
| Clerical discrepancy handling | PASS | classification alone no credit |
| Critical safety flag on high total | PASS | Q21 missed produces 95 and flag |
| Bounds and CSV quoting/injection | PASS | scoring regression tests |
| Dashboard initial load/filter/search | PASS | script-level synthetic tests, not a rendered browser |
| Candidate detail and human review | PASS | script-level tests require six ratings, identity and rationale |
| Candidate page strips reviewer data | PASS | no demo fixture names or rubric data in candidate-only payload |
| Candidate practice save/receipt | PASS | script-level test; no real score generated |
| JavaScript syntax | PASS | inline scripts parsed/executed under Node VM |
| Actual browser layout/mobile/keyboard | NOT TESTED | browser-control skill unavailable; CSS/focus trap inspected only |
| API/Deno typecheck and integration | NOT TESTED | source supplied, function not deployed |
| Postgres schema / RLS runtime | NOT TESTED | proposal staged, not applied |
| Concurrent start / duplicate replay | NOT TESTED | source locking/uniqueness only, needs real database tests |
| Atomic submit / retake / auth roles | NOT TESTED | SQL/API design requires integration verification |
| Email+phone OTP and identity workflow | NOT TESTED | enrollment/delivery not configured |
| Cross-device resume / revocation / expiry | NOT TESTED | production frontend controls not implemented |
| Production candidate/admin 401/403/200 | NOT TESTED | applicant launch disabled |
| Immutable + canonical Vercel routes | NOT TESTED | no Vercel deployment performed |
| Source SME / pilot / legal evidence | NOT TESTED | not documented in supplied package |

Command: `node --test tests/*.test.mjs` — 14 passed, 0 failed. Run local tests from the assessment folder. No live applicant data used. Private Site publication is an interactive demonstration; its native deployment outcome is separate from operational applicant release.

## Infrastructure verification — 2026-10-10
- Supabase schema applied: PASS (remote migration 20261010073711).
- All 16 ma_ tables have RLS: PASS (pg_tables inspection).
- Fixed item inventory seeded: 31 source question versions; no applicants enrolled.
- Edge Function active and JWT verification enabled: PASS (deploy result).
- Vercel Git link verified: PASS (Git deployment context lists kekadi/chatgpt-uzor).
- Production static build excludes server source and keys: PASS (tests/public-build.test.mjs).
- Administrator provisioning: PASS, owner-authorized account has server-managed role and organization membership; verified by a targeted SQL read. Actual interactive administrator sign-in: NOT TESTED.
- Email/SMS enrollment, real user admin flow and applicant end-to-end: NOT TESTED; disabled.
- Security advisor informational notice: RLS without policies is intentional for service-only tables; anonymous/authenticated table privileges are revoked.
