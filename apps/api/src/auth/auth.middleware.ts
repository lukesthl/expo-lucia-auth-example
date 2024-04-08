import type { Context } from "hono";
import { env } from "hono/adapter";
import type { User } from "lucia";
import { verifyRequestOrigin } from "lucia";

import type { AppContext } from "../context";
import type { DatabaseUserAttributes } from "./lucia-auth";

export const AuthMiddleware = async (c: Context<AppContext>, next: () => Promise<void>) => {
  if (c.req.path.startsWith("/auth")) {
    return next();
  }
  const lucia = c.get("lucia");

  const originHeader = c.req.header("Origin");
  const hostHeader = c.req.header("Host") ?? c.req.header("X-Forwarded-Host");
  if (
    (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) &&
    env(c).WORKER_ENV === "production"
  ) {
    return new Response(null, {
      status: 403,
    });
  }

  const authorizationHeader = c.req.header("Authorization");
  const bearerSessionId = lucia.readBearerToken(authorizationHeader ?? "");
  const sessionId = bearerSessionId;
  if (!sessionId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    c.header("Set-Cookie", sessionCookie.serialize());
  }
  c.set("user", user as User & DatabaseUserAttributes);
  c.set("session", session);
  await next();
};
