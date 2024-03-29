import { GitHub } from "arctic";
import type { Context } from "hono";
import { generateId } from "lucia";

import type { AppContext } from "../../context";
import { oauthAccountTable } from "../../database/oauth.accounts";
import { userTable } from "../../database/users";

export const getGithubAuthorizationUrl = async ({ c, state }: { c: Context<AppContext>; state: string }) => {
  const github = new GitHub(c.env.GITHUB_CLIENT_ID, c.env.GITHUB_CLIENT_SECRET);
  return await github.createAuthorizationURL(state);
};

export const createGithubSession = async ({ c, idToken }: { c: Context<AppContext>; idToken: string }) => {
  const github = new GitHub(c.env.GITHUB_CLIENT_ID, c.env.GITHUB_CLIENT_SECRET);
  const tokens = await github.validateAuthorizationCode(idToken);
  const githubUserResponse = await fetch("https://api.github.com/user", {
    headers: {
      "User-Agent": "hono",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const githubUserResult = (await githubUserResponse.json()) as {
    id: number;
    login: string; // username
    name: string;
    avatar_url: string;
  };

  const userEmailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      "User-Agent": "hono",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const userEmailResult = (await userEmailResponse.json()) as {
    email: string;
    primary: boolean;
    verified: boolean;
  }[];

  const primaryEmail = userEmailResult.find((email) => email.primary);
  if (!primaryEmail) {
    return null;
  }
  const existingAccount = await c.get("db").query.oauthAccounts.findFirst({
    where: (account, { eq }) => eq(account.providerUserId, githubUserResult.id.toString()),
  });
  const existingUser = await c.get("db").query.users.findFirst({
    where: (u, { eq }) => eq(u.email, primaryEmail.email),
  });
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
