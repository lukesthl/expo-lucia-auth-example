import { Database as BunDatabase } from "bun:sqlite";
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
  }
  return db;
};

export type Database = BunSQLiteDatabase<typeof schema>;
