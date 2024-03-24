import { useState } from "react";
import { generateHexStringAsync } from "expo-auth-session";
import { router } from "expo-router";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { Button } from "tamagui";

import { useAuth } from "../../app/AuthProvider";

export const GoogleSignIn = () => {
  return (
    <GoogleOAuthProvider clientId={process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!}>
      <GoogleSignInButton />
    </GoogleOAuthProvider>
  );
};

const GoogleSignInButton = () => {
  const [state, setState] = useState("");
  const { signInWithIdToken } = useAuth();

  const login = useGoogleLogin({
    state,
    onSuccess: (codeResponse) => {
      console.log(window.location.href);
      console.log(codeResponse);
      void signInWithIdToken({
        idToken: codeResponse.code,
        provider: "google",
      }).then(() => {
        void router.replace("/(app)");
      });
    },
    flow: "auth-code",
    redirect_uri: process.env.EXPO_PUBLIC_API_URL,
  });
  return (
    <Button
      onPress={async () => {
        const state = await generateHexStringAsync(16);
        setState(state);
        login();
      }}
    >
      Login with google
    </Button>
  );
};
