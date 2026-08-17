import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../env.js";
import * as schema from "./schema.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Most managed Postgres providers (Neon, Supabase, RDS) require TLS.
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  // On a serverless platform (Vercel), every function instance opens its own
  // pool, so each one should hold very few connections — otherwise many cold
  // starts can exhaust your database's connection limit. Use your provider's
  // pooled/PgBouncer connection string (Neon and Supabase both offer one) as
  // DATABASE_URL when deploying serverless; this cap is a second safety net.
  max: env.VERCEL ? 1 : 10,
});

export const db = drizzle(pool, { schema });
