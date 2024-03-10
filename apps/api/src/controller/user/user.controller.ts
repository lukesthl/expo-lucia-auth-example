import { Hono } from "hono";

import type { AppContext } from "../../context";

const UserController = new Hono<AppContext>();

UserController.get("/me", (c) => {
  const user = c.get("user");
  return c.json(user);
});

export { UserController };
