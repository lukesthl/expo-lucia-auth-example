import { Redirect, Stack } from "expo-router";
import { Text } from "tamagui";

import { useAuth } from "../../lib/auth/AuthProvider";

export default function AppLayout() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <>
        <Text>Loading...</Text> <Stack.Screen options={{ headerShown: false }} />
      </>
    );
  }

  if (!user) {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
    <>
      <Stack />
      <Stack.Screen options={{ headerShown: false }} />
    </>
  );
}
