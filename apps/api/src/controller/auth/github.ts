import { GitHub } from "arctic";
import type { Context } from "hono";
import { env } from "hono/adapter";
import { generateId } from "lucia";

import type { DatabaseUserAttributes } from "../../auth/lucia-auth";
import type { AppContext } from "../../context";
import { oauthAccountTable } from "../../database/oauth.accounts";
import { userTable } from "../../database/users";

const githubClient = (c: Context<AppContext>) => new GitHub(env(c).GITHUB_CLIENT_ID, env(c).GITHUB_CLIENT_SECRET);

export const getGithubAuthorizationUrl = async ({ c, state }: { c: Context<AppContext>; state: string }) => {
  const github = githubClient(c);
  return await github.createAuthorizationURL(state, {
    scopes: ["read:user", "user:email"],
  });
};

export const createGithubSession = async ({
  c,
  idToken,
  sessionToken,
}: {
  c: Context<AppContext>;
  idToken: string;
  sessionToken?: string;
}) => {
  const github = githubClient(c);
  const tokens = await github.validateAuthorizationCode(idToken);
  const githubUserResponse = await fetch("https://api.github.com/user", {
    headers: {
      "User-Agent": "hono",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const githubUserResult: {
    id: number;
    login: string; // username
    name: string;
    avatar_url: string;
  } = await githubUserResponse.json();

  const userEmailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      "User-Agent": "hono",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const userEmailResult: {
    email: string;
    primary: boolean;
    verified: boolean;
  }[] = await userEmailResponse.json();

  const primaryEmail = userEmailResult.find((email) => email.primary);
  if (!primaryEmail) {
    return null;
  }
  const existingAccount = await c.get("db").query.oauthAccounts.findFirst({
    where: (account, { eq }) => eq(account.providerUserId, githubUserResult.id.toString()),
  });
  let existingUser: DatabaseUserAttributes | null = null;
  if (sessionToken) {
    const sessionUser = await c.get("lucia").validateSession(sessionToken);
    if (sessionUser.user) {
      existingUser = sessionUser.user as DatabaseUserAttributes;
    }
  } else {
    const response = await c.get("db").query.users.findFirst({
      where: (u, { eq }) => eq(u.email, primaryEmail.email),
    });
    if (response) {
      existingUser = response;
    }
  }
  if (existingUser?.emailVerified && primaryEmail.verified && !existingAccount) {
    await c.get("db").insert(oauthAccountTable).values({
      providerUserId: githubUserResult.id.toString(),
      provider: "github",
      userId: existingUser.id,
    });
    const session = await c.get("lucia").createSession(existingUser.id, {});
    return session;
  }

  if (existingAccount) {
    const session = await c.get("lucia").createSession(existingAccount.userId, {});
    return session;
  } else {
    const userId = generateId(15);
    let username = githubUserResult.login;
    const existingUsername = await c.get("db").query.users.findFirst({
      where: (u, { eq }) => eq(u.username, username),
    });
    if (existingUsername) {
      username = `${username}-${generateId(5)}`;
    }
    await c
      .get("db")
      .insert(userTable)
      .values({
        id: userId,
        username,
        profilePictureUrl: githubUserResult.avatar_url,
        email: primaryEmail.email ?? "",
        emailVerified: primaryEmail.verified ? 1 : 0,
      });
    await c.get("db").insert(oauthAccountTable).values({
      providerUserId: githubUserResult.id.toString(),
      provider: "github",
      userId,
    });
    const session = await c.get("lucia").createSession(userId, {});
    return session;
  }
};
