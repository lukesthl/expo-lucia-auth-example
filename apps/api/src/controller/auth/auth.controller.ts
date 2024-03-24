import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { Session } from "lucia";
import { z } from "zod";

import type { AppContext } from "../../context";
import { createAppleSession } from "./apple";
import { createGithubSession } from "./github";
import { createGoogleSession } from "./google";

const AuthController = new Hono<AppContext>()
  .post(
    "/login/:provider",
    zValidator(
      "json",
      z.object({
        idToken: z.string(),
        user: z
          .object({
            username: z.string(),
          })
          .optional(),
      })
    ),
    zValidator(
      "param",
      z.object({
        provider: z.enum(["github", "google", "apple"]),
      })
    ),
    async (c) => {
      const provider = c.req.param("provider");
      const idToken = c.req.valid("json").idToken;
      let session: Session | null = null;
      if (provider === "github") {
        session = await createGithubSession({ c, idToken });
      } else if (provider === "google") {
        session = await createGoogleSession({ c, idToken });
      } else if (provider === "apple") {
        session = await createAppleSession({ c, idToken, user: c.req.valid("json").user });
      }
      if (!session) {
        return c.json({}, 400);
      }
      return c.json({ token: session.id });
    }
  )
  .post("/logout", async (c) => {
    const authorizationHeader = c.req.header("Authorization");
    const bearerSessionId = c.get("lucia").readBearerToken(authorizationHeader ?? "");
    const sessionId = bearerSessionId;
    if (!sessionId) {
      return c.json({ error: "Not logged in" }, 400);
    }
    await c.get("lucia").invalidateSession(sessionId);
    return c.json(null, 200);
  });

export { AuthController };
