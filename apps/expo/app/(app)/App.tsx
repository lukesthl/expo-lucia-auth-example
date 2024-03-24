import { useEffect, useState } from "react";
import { router } from "expo-router";
import type { InferResponseType } from "hono";
import { Button, Text, View } from "tamagui";

import type { Api } from "../../lib/api.client";
import { useAuth } from "../AuthProvider";

export function App() {
  const { user, signOut, getOAuthAccounts } = useAuth();
  const [accounts, setAccounts] = useState<
    InferResponseType<(typeof Api.client)["user"]["oauth-accounts"]["$get"]>["accounts"]
  >([]);
  useEffect(() => {
    void getOAuthAccounts().then((response) => setAccounts(response));
  }, []);
  return (
    <View>
      <Button
        onPress={() => {
          void signOut().then(() => router.replace("/auth/sign-in"));
        }}
      >
        Sign out
      </Button>
      {user && (
        <View>
          <Text>{user.username}</Text>
          <Text>{user.id}</Text>
          <Text>{user.email}</Text>
          <Text>E-Mail verified: {user.emailVerified}</Text>
          <Text>{user.profilePictureUrl}</Text>
        </View>
      )}
      <Text>OAuth accounts</Text>
      {accounts.map((account) => (
        <View key={account.provider}>
          <Text>{account.provider}</Text>
        </View>
      ))}
    </View>
  );
}
