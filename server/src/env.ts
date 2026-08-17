import "dotenv/config";
import { z } from "zod";

// Some platforms (Vercel among them, in some configurations) can set an
// environment variable's key with an empty string value rather than
// omitting it — which is NOT the same thing to Zod: `.default()` only
// applies to a truly-missing (`undefined`) value, not an empty string. This
// preprocessor treats "" as unset for any field it wraps, so a blank value
// falls back to the default instead of failing validation.
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z.object({
  NODE_ENV: z.preprocess(emptyToUndefined, z.enum(["development", "production", "test"]).default("development")),
  PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(5000)),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required — a Postgres connection string."),
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters — used to sign session cookies."),
  CLIENT_ORIGIN: z.preprocess(emptyToUndefined, z.string().min(1).default("http://localhost:5173")),
  // Set automatically by Vercel on every deployment — used to make small
  // serverless-specific adjustments (see db/client.ts) without a manual flag.
  VERCEL: z
    .string()
    .optional()
    .transform((value) => value === "1"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = ["Invalid environment configuration:", ...parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)].join(
    "\n",
  );
  // Throwing (rather than process.exit) fails cleanly in both a normal Node
  // process and inside a serverless function's module scope — process.exit
  // inside a serverless runtime can abruptly kill the whole instance instead
  // of just this invocation.
  throw new Error(message);
}

export const env = parsed.data;
