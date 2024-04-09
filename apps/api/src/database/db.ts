import { Database as BunDatabase } from "bun:sqlite";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import type { Context } from "hono";

import type { AppContext } from "../context";
import * as schema from "./schema";

export const initalizeDB = (c: Context<AppContext>) => {
  let db = c.get("db");
  if (!db) {
    const sqlite = new BunDatabase("/db/sqlite.db");
    db = drizzle(sqlite, { schema });
    c.set("db", db);
    console.log("Database initialized");
    void migrate(db, { migrationsFolder: "./apps/api/src/database/migrations" })
      .then(() => console.log("Migrated"))
      .catch((e) => console.error(e));
  }
  return db;
};

export type Database = BunSQLiteDatabase<typeof schema>;
