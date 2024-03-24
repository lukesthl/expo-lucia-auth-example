import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { userTable } from "./users";

export const oauthAccountTable = sqliteTable(
  "oauth_account",
  {
    provider: text("provider").notNull(),
    providerUserId: text("provider_user_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerUserId] }),
  })
);
