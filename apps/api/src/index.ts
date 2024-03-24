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

app.use(logger());
app.use(cors({ origin: "http://localhost:8081" }));

app.use((c, next) => {
  initalizeDB(c);
  initializeLucia(c);
  return next();
});

app.use(AuthMiddleware);

const routes = app
  .route("/auth", AuthController)
  .route("/user", UserController)
  .get("/hello", (c) => {
    const user = c.get("user");
    return c.json({ message: "Hello, World! " + user?.username });
  });

export type AppType = typeof routes;
export default app;
