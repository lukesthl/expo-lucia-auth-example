import jwt from "@tsndr/cloudflare-worker-jwt";
import { Apple } from "arctic";
import type { Context } from "hono";
import { generateId } from "lucia";

import type { DatabaseUserAttributes } from "../../auth/lucia-auth";
import type { AppContext } from "../../context";
import { oauthAccountTable } from "../../database/oauth.accounts";
import { userTable } from "../../database/users";

const appleClient = (c: Context<AppContext>) =>
  new Apple(
    {
      clientId: c.env.APPLE_WEB_CLIENT_ID,
      teamId: c.env.APPLE_TEAM_ID,
      keyId: c.env.APPLE_KEY_ID,
      certificate: c.env.APPLE_PRIVATE_KEY,
    },
    `${c.env.API_DOMAIN}/auth/apple/callback`
  );

export const getAppleAuthorizationUrl = async ({ c, state }: { c: Context<AppContext>; state: string }) => {
  const apple = appleClient(c);
  const url = await apple.createAuthorizationURL(state, {
    scopes: ["name", "email"],
  });
  url.searchParams.set("response_mode", "form_post");
  return url;
};

export const createAppleSession = async ({
  c,
  idToken,
  code,
  user,
  sessionToken,
}: {
  c: Context<AppContext>;
  code?: string;
  idToken?: string;
  sessionToken?: string;
  user?: {
    username: string;
  };
}) => {
  if (!idToken) {
    const apple = appleClient(c);
    if (!code) {
      return null;
    }
    const tokens = await apple.validateAuthorizationCode(code);
    idToken = tokens.idToken;
  }
  const { payload, header } = jwt.decode<
    {
      email: string;
      email_verified: string;
      sub: string;
    },
    { kid: string }
  >(idToken);

  const applePublicKey = await fetch("https://appleid.apple.com/auth/keys");
  const applePublicKeyJson = await applePublicKey.json();
  const publicKey = applePublicKeyJson.keys.find((key) => key.kid === header?.kid);
  if (!publicKey) {
    return null;
  }
  const isValid = await jwt.verify(idToken, publicKey, { algorithm: "RS256" });

  if (
    !isValid ||
    !payload ||
    payload.iss !== "https://appleid.apple.com" ||
    !(payload?.aud === c.env.APPLE_CLIENT_ID || payload.aud === c.env.APPLE_WEB_CLIENT_ID) ||
    !payload.exp ||
    payload?.exp < Date.now() / 1000
  ) {
    return null;
  }
  const existingAccount = await c.get("db").query.oauthAccounts.findFirst({
    where: (account, { eq }) => eq(account.providerUserId, payload.sub.toString()),
  });
  let existingUser: DatabaseUserAttributes | null = null;
  if (sessionToken) {
    const sessionUser = await c.get("lucia").validateSession(sessionToken);
    if (sessionUser.user) {
      existingUser = sessionUser.user as DatabaseUserAttributes;
    }
  } else {
    const response = await c.get("db").query.users.findFirst({
      where: (u, { eq }) => eq(u.email, payload.email),
    });
    if (response) {
      existingUser = response;
    }
  }
  if (existingUser?.emailVerified && payload.email_verified && !existingAccount) {
    await c.get("db").insert(oauthAccountTable).values({
      providerUserId: payload.sub.toString(),
      provider: "apple",
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
    let username = user?.username ?? generateId(10);
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
        email: payload.email,
        emailVerified: payload.email_verified ? 1 : 0,
        profilePictureUrl: null,
      });

    await c.get("db").insert(oauthAccountTable).values({
      providerUserId: payload.sub,
      provider: "apple",
      userId,
    });

    const session = await c.get("lucia").createSession(userId, {});
    return session;
  }
};
