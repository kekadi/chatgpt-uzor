# Development verification evidence

Date: 2026-10-12 | Synthetic data only | No connected production database changes

- `npm run typecheck`: passed.
- `npm run build`: passed on Next.js 16.4.0.
- `npm test`: five test groups passed. Includes a PostgreSQL-compatible PGlite engine executing the schema and checking cross-practice access denial, assigned-case behavior, MFA restriction, inactive membership, transactional case/detail creation, missing completion evidence, blocked self-role changes and protected audit mutation.
- Domain tests: STAT aging boundaries, closed cases, positive DME quantities, missing completion evidence, six complete months using Chicago date boundaries.
- Excel tests: all nine tabs, cached KPI formula result, status dropdown and formula-injection escaping, serializable workbook bytes.
- Runtime HTTP smoke: workspace 200; live-data-disabled API 503; cross-origin mutation 403.
- Browser verification: not completed. No supported browser was available; an attempted Playwright launch found no browser executable. No browser was installed as a fallback.
- Live authentication/MFA, Supabase direct Data API behavior, eCW access, object storage, scan/OCR vendors and production backup restore were not tested. These require the isolated staging project and approved external integrations.

This evidence covers the development baseline, not all scope acceptance criteria or production readiness.

## Standalone continuation — 2026-10-12

- Nine domain/database/catalog/origin test groups pass; TypeScript and Next.js production build pass.
- HTTP integration test with a controlled storage gateway verifies API GET/PUT, 409 stale-write rejection, persistence across a Next.js process restart, and module 16/standalone navigation markers.
- Live test gateway denied a missing credential (401), loaded the seeded workspace, and accepted a synthetic save. Repeated direct container reads timed out; these are not recorded as successful full round-trip tests. Temporary synthetic verification tasks were removed with a versioned save.
- All original assessment tables and functions remain unchanged. No real candidate data was imported.
- Four deployed assessment/quiz entry routes and both MA/Falola source-admin routes returned 200 using authorized fetch. Falola canonical aliases did not resolve; immutable working links are used.
- Browser interaction tests remain NOT TESTED because a supported browser is unavailable in this environment.
