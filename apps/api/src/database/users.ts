import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  username: text("username").notNull().unique(),
  hashed_password: text("hashed_password"),
  first_name: text("first_name"),
  last_name: text("last_name"),
  github_id: text("github_id").unique(),
});
