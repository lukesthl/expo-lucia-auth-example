import React from "react";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Button } from "tamagui";

import { useAuth } from "../../app/AuthProvider";

GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!,
  offlineAccess: true,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
});

export const GoogleSignIn = () => {
  const [loading, setLoading] = React.useState(false);
  const { signInWithIdToken } = useAuth();

  return (
    <Button
      disabled={loading}
      onPress={async () => {
        setLoading(true);
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          if (userInfo.serverAuthCode) {
            const user = await signInWithIdToken({
              idToken: userInfo.serverAuthCode,
              provider: "google",
            });
            if (user) {
              void router.replace("/(app)");
            }
          }
        } catch (error) {
          console.log(error);
        }
        setLoading(false);
      }}
    >
      Login with google
    </Button>
  );
};
