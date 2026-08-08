/**
 * Thin Postgres client wrapper over @neondatabase/serverless, matching this
 * hub's other integrations (integration-notion, integration-wave):
 * credential-gated, throws rather than silently no-ops.
 *
 * DATABASE_URL points at the real "wvw-platform" Neon project (project id
 * frosty-hill-13583502), confirmed live 2026-08-07. That project's default
 * `neondb` database is SHARED with an existing, unrelated business-ops
 * application (Prisma-managed, PascalCase table names like `User`,
 * `Organization`, `Invoice`) -- confirmed intentional by Tiána. This hub's
 * own tables (supabase/migrations/0001 and 0002, applied against the same
 * database 2026-08-07) are lowercase/snake_case and do not collide with
 * that schema.
 */

import { Pool } from "@neondatabase/serverless";

export class PostgresNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not set — cannot connect to Postgres.");
    this.name = "PostgresNotConfiguredError";
  }
}

let pool: Pool | undefined;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new PostgresNotConfiguredError();
  if (!pool) pool = new Pool({ connectionString });
  return pool;
}
