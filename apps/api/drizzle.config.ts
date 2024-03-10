import type { Config } from "drizzle-kit";
import { defineConfig } from "drizzle-kit";

console.log(process.env.LOCAL_DB_PATH);
export default defineConfig(
  process.env.LOCAL_DB_PATH
    ? ({
        schema: "./src/database/schema.ts",
        driver: "better-sqlite",
        dbCredentials: {
          url: process.env.LOCAL_DB_PATH,
        },
      } satisfies Config)
    : ({
        schema: "./src/database/schema.ts",
        out: "./src/database/migrations",
        driver: "d1",
        dbCredentials: {
          wranglerConfigPath: __dirname + "/wrangler.toml",
          dbName: "demo",
        },
      } satisfies Config)
);
