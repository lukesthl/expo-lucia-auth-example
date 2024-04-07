import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { AuthMiddleware } from "./auth/auth.middleware";
import { initializeLucia } from "./auth/lucia-auth";
import type { AppContext } from "./context";
import { AuthController } from "./controller/auth/auth.controller";
import { UserController } from "./controller/user/user.controller";
import { initalizeDB } from "./database/db";
import { Env } from "./env";

const app = new Hono<AppContext>();
console.log(process.env.WEB_DOMAIN);
app
  .use(logger())
  .use((c, next) => {
    const handler = cors({ origin: env<Env>(c).WEB_DOMAIN });
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
