import { Redirect, Stack } from "expo-router";
import { Text } from "tamagui";

import { useAuth } from "../AuthProvider";

export default function AppLayout() {
  const { loading, user } = useAuth();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!user) {
    return <Redirect href="/auth/sign-in" />;
  }

  return <Stack />;
}
