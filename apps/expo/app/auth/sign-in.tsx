import { Stack } from "expo-router";
import { View, YStack } from "tamagui";

import { AppleSignIn } from "../../lib/auth/apple";
import { GithubSignIn } from "../../lib/auth/github";
import { GoogleSignIn } from "../../lib/auth/google";

export default function SignIn() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Sign In",
        }}
      />
      <View alignItems="center" flex={1} margin={8}>
        <YStack gap={12} flex={1} width={"100%"} maxWidth={500}>
          <GithubSignIn />
          <GoogleSignIn />
          <AppleSignIn />
        </YStack>
      </View>
    </>
  );
}
