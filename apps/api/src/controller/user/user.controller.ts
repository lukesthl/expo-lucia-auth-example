import { Hono } from "hono";

import type { AppContext } from "../../context";

const UserController = new Hono<AppContext>()
  .get("/", (c) => {
    const user = c.get("user");
    return c.json(user);
  })
  .get("/oauth-accounts", async (c) => {
    const oauthAccounts = await c.get("db").query.oauthAccounts.findMany({
      where: (u, { eq }) => eq(u.userId, c.get("user")?.id ?? ""),
    });
    return c.json({
      accounts: oauthAccounts.map((oa) => ({
        provider: oa.provider,
      })),
    });
  });

export { UserController };
