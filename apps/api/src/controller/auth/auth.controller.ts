import { zValidator } from "@hono/zod-validator";
import { generateCodeVerifier, generateState } from "arctic";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { verifyRequestOrigin } from "lucia";
import type { Session } from "lucia";
import { z } from "zod";

import type { AppContext } from "../../context";
import { createAppleSession, getAppleAuthorizationUrl } from "./apple";
import { createGithubSession, getGithubAuthorizationUrl } from "./github";
import { createGoogleSession, getGoogleAuthorizationUrl } from "./google";

const AuthController = new Hono<AppContext>()
  .get(
    "/:provider",
    zValidator("param", z.object({ provider: z.enum(["github", "google", "apple"]) })),
    zValidator(
      "query",
      z
        .object({ redirect: z.enum(["com.expoluciaauth.app://", "http://localhost:8081"]) })
        .default({ redirect: "http://localhost:8081" })
    ),
    async (c) => {
      const provider = c.req.valid("param").provider;
      const redirect = c.req.valid("query").redirect;
      setCookie(c, "redirect", redirect, {
        httpOnly: true,
        maxAge: 60 * 10,
        path: "/",
        secure: c.env.WORKER_ENV === "production",
      });

      const state = generateState();
      if (provider === "github") {
        const url = await getGithubAuthorizationUrl({ c, state });
        setCookie(c, "github_oauth_state", state, {
          httpOnly: true,
          maxAge: 60 * 10,
          path: "/",
          secure: c.env.WORKER_ENV === "production",
        });
        return c.redirect(url.toString());
      } else if (provider === "google") {
        const codeVerifier = generateCodeVerifier();
        const url = await getGoogleAuthorizationUrl({ c, state, codeVerifier });
        setCookie(c, "google_oauth_state", state, {
          httpOnly: true,
          maxAge: 60 * 10,
          path: "/",
          secure: c.env.WORKER_ENV === "production",
        });
        setCookie(c, "google_oauth_code_verifier", codeVerifier, {
          httpOnly: true,
          maxAge: 60 * 10,
          path: "/",
          secure: c.env.WORKER_ENV === "production",
        });
        return c.redirect(url.toString());
      } else if (provider === "apple") {
        const url = await getAppleAuthorizationUrl({ c, state });
        setCookie(c, "apple_oauth_state", state, {
          httpOnly: true,
          maxAge: 60 * 10,
          path: "/",
          secure: c.env.WORKER_ENV === "production",
          sameSite: "None",
        });
        return c.redirect(url.toString());
      }
      return c.json({}, 400);
    }
  )
  .all(
    "/:provider/callback",
    zValidator("param", z.object({ provider: z.enum(["github", "google", "apple"]) })),
    async (c) => {
      const provider = c.req.valid("param").provider;
      let stateCookie = getCookie(c, `${provider}_oauth_state`);
      const codeVerifierCookie = getCookie(c, `${provider}_oauth_code_verifier`);
      let redirect = getCookie(c, "redirect");

      const url = new URL(c.req.url);
      let state = url.searchParams.get("state");
      let code = url.searchParams.get("code");
      const codeVerifierRequired = ["google"].includes(provider);
      if (c.req.method === "POST") {
        const formData = await c.req.formData();
        state = formData.get("state");
        stateCookie = state ?? stateCookie;
        code = formData.get("code");
        redirect = c.env.WEB_DOMAIN;
      }
      if (
        !state ||
        !stateCookie ||
        !code ||
        stateCookie !== state ||
        !redirect ||
        (codeVerifierRequired && !codeVerifierCookie)
      ) {
        console.log({ state, stateCookie, code, redirect, codeVerifierCookie });
        return c.json({ error: "Invalid request" }, 400);
      }
      if (provider === "github") {
        const session = await createGithubSession({ c, idToken: code });
        if (!session) {
          return c.json({}, 400);
        }
        const redirectUrl = new URL(redirect);
        redirectUrl.searchParams.append("token", session.id);
        return c.redirect(redirectUrl.toString());
      } else if (provider === "google") {
        const session = await createGoogleSession({ c, idToken: code, codeVerifier: codeVerifierCookie! });
        if (!session) {
          return c.json({}, 400);
        }
        const redirectUrl = new URL(redirect);
        redirectUrl.searchParams.append("token", session.id);
        return c.redirect(redirectUrl.toString());
      } else if (provider === "apple") {
        const originHeader = c.req.header("Origin");
        const hostHeader = c.req.header("Host");
        if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader, "appleid.apple.com"])) {
          return c.json({}, 403);
        }
        const formData = await c.req.formData();
        const userJSON = formData.get("user"); // only available first time
        let user: { username: string } | undefined;
        if (userJSON) {
          const reqUser = JSON.parse(userJSON) as {
            name: { firstName: string; lastName: string };
            email: string;
          };
          user = {
            username: `${reqUser.name.firstName} ${reqUser.name.lastName}`,
          };
        }
        const session = await createAppleSession({
          c,
          code,
          user,
        });
        if (!session) {
          return c.json({}, 400);
        }
        // always web
        const redirectUrl = new URL(redirect);
        redirectUrl.searchParams.append("token", session.id);
        return c.redirect(redirectUrl.toString());
      }
      return c.json({}, 400);
    }
  )
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
        session = await createGoogleSession({ c, idToken, codeVerifier: "" });
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
