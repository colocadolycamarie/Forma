import ConnectPgSimple from "connect-pg-simple";
import session, { type SessionOptions } from "express-session";
import { env } from "../env.js";
import { pool } from "../db/client.js";

const PgSession = ConnectPgSimple(session);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const sessionOptions: SessionOptions = {
  store: new PgSession({
    pool,
    // Auto-creates the `session` table on first boot — no manual migration needed.
    createTableIfMissing: true,
    tableName: "session",
  }),
  name: "forma.sid",
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: ONE_WEEK_MS,
  },
};

export const sessionMiddleware = session(sessionOptions);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
