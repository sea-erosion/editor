import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// For local development, use in-memory SQLite
// For production, replace with Turso credentials:
// const url = process.env.TURSO_DATABASE_URL!;
// const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export type DB = typeof db;
