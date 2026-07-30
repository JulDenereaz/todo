import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { Logger as DrizzleLogger } from "drizzle-orm/logger";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { logger } from "@/lib/logger";

class PinoDrizzleLogger implements DrizzleLogger {
  logQuery(query: string, params: unknown[]) {
    logger.debug({ query, params }, "db query");
  }
}

const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

const dbPath = process.env.DATABASE_PATH ?? "./data/todo.db";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = globalForDb.sqlite ?? new Database(dbPath, { timeout: 5000 });
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema, logger: new PinoDrizzleLogger() });
