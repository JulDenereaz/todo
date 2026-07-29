import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH ?? "./data/todo.db";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath, { timeout: 5000 });
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

migrate(db, { migrationsFolder: path.join(__dirname, "..", "drizzle") });

console.log(`Migrations applied to ${dbPath}`);
sqlite.close();
