# Source migration

Imported from kekadi/claude-uzor, branch claude/referral-dme-management-3SPPu, source commit 90ae75692ee0c218f403c6d526f0c8faee2892d3.

This branch retains the application source and Prisma SQLite schema. The seed file containing patient-like records and hardcoded demo passwords was excluded, and the login page's demo credential shortcuts were removed. Seed scripts were removed from package.json. No live data, credentials, or Supabase resources were transferred. Configure DATABASE_URL and NEXTAUTH_SECRET outside Git, and provision users securely before use.
