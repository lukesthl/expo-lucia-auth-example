import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { AuthMiddleware } from "./auth/auth.middleware";
import { initializeLucia } from "./auth/lucia-auth";
import type { AppContext } from "./context";
import { AuthController } from "./controller/auth/auth.controller";
import { UserController } from "./controller/user/user.controller";
import { initalizeDB } from "./database/db";

const app = new Hono<AppContext>();

app
  .use(logger())
  .use((c, next) => {
    const handler = cors({ origin: c.env.WEB_DOMAIN });
    return handler(c, next);
  })
  .use((c, next) => {
    initalizeDB(c);
    initializeLucia(c);
    return next();
  })
  .use(AuthMiddleware);

const routes = app.route("/auth", AuthController).route("/user", UserController);

export type AppType = typeof routes;
export default {
  port: 3000,
  fetch: app.fetch,
};
