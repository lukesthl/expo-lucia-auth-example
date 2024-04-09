import { Database as BunDatabase } from "bun:sqlite";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "./schema";

try {
  const sqlite = new BunDatabase("/db/sqlite.db");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./apps/api/src/database/migrations" });
  console.log("Database migrated");
} catch (error) {
  console.error("Error migrating database", error);
  process.exit(1);
}
