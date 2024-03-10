import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import type { Context } from "hono";
import { Lucia } from "lucia";

import type { AppContext } from "../context";
import { sessionTable } from "../database/sessions";
import { userTable } from "../database/users";

export const initializeLucia = (c: Context<AppContext>) => {
  let lucia = c.get("lucia");
  if (lucia) {
    return lucia;
  }
  const adapter = new DrizzleSQLiteAdapter(c.get("db") as never, sessionTable, userTable);

  lucia = new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: c.env.WORKER_ENV !== "development",
      },
    },
    getUserAttributes: (attributes) => {
      return {
        username: attributes.username,
        name: attributes.name,
        githubId: attributes.githubId,
      };
    },
  });
  c.set("lucia", lucia);
  return lucia;
};

export interface DatabaseUserAttributes {
  name: string;
  username: string;
  githubId: string;
}
