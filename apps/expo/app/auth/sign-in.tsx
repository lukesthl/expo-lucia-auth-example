import { Stack } from "expo-router";

import { AppleSignIn } from "../../lib/auth/apple";
import { GithubSignIn } from "../../lib/auth/github";
import { GoogleSignIn } from "../../lib/auth/google";

export default function SignIn() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "SignIn",
        }}
      />
      <GithubSignIn />
      <GoogleSignIn />
      <AppleSignIn />
    </>
  );
}
