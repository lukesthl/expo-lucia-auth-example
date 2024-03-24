import jwt from "@tsndr/cloudflare-worker-jwt";
import type { Context } from "hono";
import { generateId } from "lucia";

import type { AppContext } from "../../context";
import { oauthAccountTable } from "../../database/oauth.accounts";
import { userTable } from "../../database/users";

export const createAppleSession = async ({
  c,
  idToken,
  user,
}: {
  c: Context<AppContext>;
  idToken: string;
  user?: {
    username: string;
  };
}) => {
  const { payload, header } = jwt.decode<
    {
      email: string;
      email_verified: string;
      sub: string;
    },
    { kid: string }
  >(idToken);

  const applePublicKey = await fetch("https://appleid.apple.com/auth/keys");
  const applePublicKeyJson = (await applePublicKey.json()) as { keys: (JsonWebKey & { kid: string })[] };
  const publicKey = applePublicKeyJson.keys.find((key) => key.kid === header?.kid);
  if (!publicKey) {
    return null;
  }
  const isValid = await jwt.verify(idToken, publicKey, { algorithm: "RS256" });

  if (
    !isValid ||
    !payload ||
    payload.iss !== "https://appleid.apple.com" ||
    payload?.aud !== c.env.APPLE_CLIENT_ID ||
    !payload.exp ||
    payload?.exp < Date.now() / 1000
  ) {
    return null;
  }
  const existingAccount = await c.get("db").query.oauthAccounts.findFirst({
    where: (account, { eq }) => eq(account.providerUserId, payload.sub.toString()),
  });
  const existingUser = await c.get("db").query.users.findFirst({
    where: (u, { eq }) => eq(u.email, payload.email),
  });
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
