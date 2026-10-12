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
