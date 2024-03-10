import { generateState, GitHub, OAuth2RequestError } from "arctic";
import type { Context } from "hono";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { generateId } from "lucia";
import { parseCookies } from "oslo/cookie";

import type { AppContext } from "../../context";
import { userTable } from "../../database/users";

interface GitHubUserResult {
  id: number;
  login: string; // username
  name: string;
}

const initGithub = (c: Context<AppContext>) => new GitHub(c.env.GITHUB_CLIENT_ID, c.env.GITHUB_CLIENT_SECRET);

const OAuthController = new Hono<AppContext>();

OAuthController.get("/login/oauth/github", async (c) => {
  const github = initGithub(c);
  const state = generateState();
  const url = await github.createAuthorizationURL(state);
  setCookie(c, "github_oauth_state", state, {
    httpOnly: true,
    secure: c.env.WORKER_ENV === "production", // set `Secure` flag in HTTPS
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  return c.redirect(url.toString(), 302);
});

OAuthController.get("/login/oauth/github/callback", async (c) => {
  const cookies = parseCookies(c.req.header("Cookie") ?? "");
  const stateCookie = cookies.get("github_oauth_state") ?? null;

  const url = new URL(c.req.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  // verify state
  if (!state || !stateCookie || !code || stateCookie !== state) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const github = initGithub(c);
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        "User-Agent": "hono",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUserResult = (await githubUserResponse.json()) as GitHubUserResult;
    const existingUser = await c.get("db").query.users.findFirst({
      where: (users, { eq }) => eq(users.github_id, githubUserResult.id.toString()),
    });

    if (existingUser) {
      const session = await c.get("lucia").createSession(existingUser.id, {});
      const sessionCookie = c.get("lucia").createSessionCookie(session.id);
      setCookie(c, sessionCookie.name, sessionCookie.name, {
        ...sessionCookie.attributes,
        sameSite: "Lax",
      });
      return c.redirect(`http://localhost:8081/login?token=${session.id}`, 302);
    }

    const userId = generateId(15);
    await c.get("db").insert(userTable).values({
      id: userId,
      username: githubUserResult.login,
      first_name: githubUserResult.name,
      github_id: githubUserResult.id.toString(),
    });

    const session = await c.get("lucia").createSession(userId, {});
    const sessionCookie = c.get("lucia").createSessionCookie(session.id);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      // bad verification code, invalid credentials, etc
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
});

export { OAuthController };
