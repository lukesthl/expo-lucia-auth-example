import type { Context } from "hono";
import { generateId } from "lucia";

import type { AppContext } from "../../context";
import { oauthAccountTable } from "../../database/oauth.accounts";
import { userTable } from "../../database/users";

export const createGoogleSession = async ({ c, idToken }: { c: Context<AppContext>; idToken: string }) => {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: JSON.stringify({
      code: idToken,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "http://localhost:8081",
      grant_type: "authorization_code",
    }),
  });
  const tokens = (await tokenResponse.json()) as { access_token: string };
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });
  const user = (await response.json()) as {
    sub: string;
    name: string;
    email: string;
    email_verified: boolean;
    picture: string;
  };
  const existingAccount = await c.get("db").query.oauthAccounts.findFirst({
    where: (account, { eq }) => eq(account.providerUserId, user.sub.toString()),
  });
  const existingUser = await c.get("db").query.users.findFirst({
    where: (u, { eq }) => eq(u.email, user.email),
  });
  if (existingUser?.emailVerified && user.email_verified && !existingAccount) {
    await c.get("db").insert(oauthAccountTable).values({
      providerUserId: user.sub,
      provider: "google",
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
    let username = user.name;
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
        email: user.email,
        emailVerified: user.email_verified ? 1 : 0,
        profilePictureUrl: user.picture,
      });
    await c.get("db").insert(oauthAccountTable).values({
      providerUserId: user.sub,
      provider: "google",
      userId,
    });
    const session = await c.get("lucia").createSession(userId, {});
    return session;
  }
};
