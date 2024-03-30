import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import * as Browser from "expo-web-browser";
import type { InferRequestType, InferResponseType } from "hono/client";

import { Api } from "../api.client";
import Storage from "../storage";

type User = NonNullable<InferResponseType<(typeof Api.client)["user"]["$get"]>>;

type Provider = NonNullable<
  InferRequestType<(typeof Api.client)["auth"]["login"][":provider"]["$post"]>
>["param"]["provider"];

interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  signInWithIdToken: (args: {
    idToken: string;
    provider: Provider;
    user?: {
      username: string;
    };
  }) => Promise<User | null>;
  getOAuthAccounts: () => Promise<InferResponseType<(typeof Api.client)["user"]["oauth-accounts"]["$get"]>["accounts"]>;
  signInWithOAuth: (args: { provider: Provider; redirect?: string }) => Promise<User | null>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}
Browser.maybeCompleteAuthSession();

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const signInWithOAuth = async ({
    provider,
    redirect = makeRedirectUri(),
  }: {
    provider: Provider;
    redirect?: string;
  }) => {
    const oauthUrl = new URL(`${process.env.EXPO_PUBLIC_API_URL!}/auth/${provider}?redirect=${redirect}`);
    const sesionToken = await Storage.getItem("session_token");
    if (sesionToken) {
      oauthUrl.searchParams.append("sessionToken", sesionToken);
    }
    console.log(oauthUrl.toString());
    const result = await Browser.openAuthSessionAsync(oauthUrl.toString(), redirect);
    if (result.type !== "success") {
      return null;
    }
    const url = Linking.parse(result.url);
    const sessionToken = url.queryParams?.token?.toString() ?? null;
    if (!sessionToken) {
      return null;
    }
    Api.addSessionToken(sessionToken);
    const user = await getUser();
    setUser(user);
    await Storage.setItem("session_token", sessionToken);
    return user;
  };

  const signInWithIdToken = async ({
    idToken,
    provider,
    user: createUser,
  }: {
    idToken: string;
    provider: Provider;
    user?: {
      username: string;
    };
  }): Promise<User | null> => {
    const response = await Api.client.auth.login[":provider"].$post({
      param: { provider },
      json: { idToken, user: createUser },
    });
    if (!response.ok) {
      return null;
    }
    const sessionToken = ((await response.json()) as { token: string }).token;
    if (!sessionToken) {
      return null;
    }
    Api.addSessionToken(sessionToken);
    const user = await getUser();
    setUser(user);
    await Storage.setItem("session_token", sessionToken);
    return user;
  };

  const getUser = async (): Promise<User | null> => {
    const response = await Api.client.user.$get();
    if (!response.ok) {
      return null;
    }
    const user = await response.json();
    return user;
  };

  const signOut = async () => {
    const response = await Api.client.auth.logout.$post();
    if (!response.ok) {
      return;
    }
    setUser(null);
    await Storage.deleteItem("session_token");
  };

  const getOAuthAccounts = async () => {
    const response = await Api.client.user["oauth-accounts"].$get();
    if (!response.ok) {
      return [];
    }
    return (await response.json()).accounts;
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const sessionToken = await Storage.getItem("session_token");
      if (sessionToken) {
        Api.addSessionToken(sessionToken);
        const user = await getUser();
        setUser(user);
      }
      setLoading(false);
    };
    void init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, signOut, loading, signInWithIdToken, getOAuthAccounts, signInWithOAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
