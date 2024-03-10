import { router, Stack } from "expo-router";
import { Button } from "tamagui";

import { useAuth } from "../AuthProvider";

export default function SignIn() {
  const { signIn } = useAuth();
  return (
    <>
      <Stack.Screen
        options={{
          title: "SignIn",
        }}
      />
      <Button onPress={() => void signIn().then(() => router.replace("/(app)"))}>Sign in</Button>
    </>
  );
}
