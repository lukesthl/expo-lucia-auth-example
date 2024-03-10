import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import * as Linking from "expo-linking";
import * as Browser from "expo-web-browser";

import Storage from "./storage";

interface AuthContextType {
  user: User | null;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
  loading: boolean;
}

interface User {
  userId: string;
  username: string;
}

const API_URL = "http://localhost:8787";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}
Browser.maybeCompleteAuthSession();

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (): Promise<User | null> => {
    const result = await Browser.openAuthSessionAsync(`${API_URL}/auth/login/oauth/github`);
    if (result.type !== "success") {
      return null;
    }
    const url = Linking.parse(result.url);
    const sessionToken = url.queryParams?.token?.toString() ?? null;
    if (!sessionToken) {
      return null;
    }
    const user = await getUser(sessionToken);
    setUser(user);
    await Storage.setItem("session_token", sessionToken);
    return user;
  };

  const getUser = async (sessionToken: string): Promise<User | null> => {
    const response = await fetch(`${API_URL}/user/me`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    if (!response.ok) {
      return null;
    }

    const user = (await response.json()) as User;
    return user;
  };

  const signOut = async () => {
    const sessionToken = await Storage.getItem("session_token");
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    if (!response.ok) {
      return;
    }
    await Storage.deleteItem("session_token");
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const sessionToken = await Storage.getItem("session_token");
      if (sessionToken) {
        const user = await getUser(sessionToken);
        setUser(user);
      }

      setLoading(false);
    };
    void initAuth();
  }, []);

  return <AuthContext.Provider value={{ user, signIn, signOut, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
