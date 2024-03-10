import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { generateId } from "lucia";
import { z } from "zod";

import { sha256 } from "../../auth/crypto";
import type { AppContext } from "../../context";
import { userTable } from "../../database/users";
import { OAuthController } from "./oauth.controller";

const AuthController = new Hono<AppContext>();

AuthController.route("/oauth", OAuthController);

AuthController.post(
  "/login",
  zValidator(
    "json",
    z.object({
      username: z
        .string()
        .min(3)
        .max(31)
        .regex(/^[a-z0-9_-]+$/),
      password: z.string().min(6).max(255),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const hashedPassword = await sha256(body.password);
    if (!hashedPassword) {
      return c.json({ error: "Error hashing password" }, 500);
    }
    const user = await c.get("db").query.users.findFirst({
      where: (users, { eq }) => eq(users.username, body.username),
    });
    if (!user || user.hashed_password !== hashedPassword) {
      return c.json({ error: "Invalid username or password" }, 400);
    }
    const session = await c.get("lucia").createSession(user.id, {});
    const sessionCookie = c.get("lucia").createSessionCookie(session.id);
    return c.json(
      {
        sessionId: session.id,
      },
      200,
      {
        "Set-Cookie": sessionCookie.serialize(),
      }
    );
  }
);

AuthController.post(
  "/signup",
  zValidator(
    "json",
    z.object({
      username: z
        .string()
        .min(3)
        .max(31)
        .regex(/^[a-z0-9_-]+$/),
      password: z.string().min(6).max(255),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");
    const hashedPassword = await sha256(body.password); // sha256 is not ideal for passwords, but it's fine for this example
    if (!hashedPassword) {
      return c.json(
        {
          error: "Error hashing password",
        },
        500
      );
    }
    const userId = generateId(15);
    const existingUser = await c.get("db").query.users.findFirst({
      where: (users, { eq }) => eq(users.username, body.username),
    });
    if (existingUser) {
      return c.json(
        {
          error: "Username already exists",
        },
        400
      );
    }
    await c.get("db").insert(userTable).values({
      id: userId,
      username: body.username,
      hashed_password: hashedPassword,
    });

    const session = await c.get("lucia").createSession(userId, {});
    const cookie = c.get("lucia").createSessionCookie(session.id);
    return c.json(null, 200, {
      "Set-Cookie": cookie.serialize(),
    });
  }
);

AuthController.post("/logout", async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ error: "Not logged in" }, 400);
  }
  await c.get("lucia").invalidateSession(session?.id);
  return c.json(null, 200);
});

export { AuthController };
