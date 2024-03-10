import { Hono } from "hono";
import { logger } from "hono/logger";

import { AuthMiddleware } from "./auth/auth.middleware";
import { initializeLucia } from "./auth/lucia-auth";
import type { AppContext } from "./context";
import { AuthController } from "./controller/auth/auth.controller";
import { UserController } from "./controller/user/user.controller";
import { initalizeDB } from "./database/db";

const app = new Hono<AppContext>();

app.use(logger());

app.use((c, next) => {
  initalizeDB(c);
  initializeLucia(c);
  return next();
});

app.use(AuthMiddleware);

app.route("/auth", AuthController);

app.route("/user", UserController);

app.get("/hello", (c) => {
  const user = c.get("user");
  return c.json({ message: "Hello, World! " + user?.username });
});

export default app;
