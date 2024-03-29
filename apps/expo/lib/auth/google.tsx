import React from "react";
import { Platform } from "react-native";
import { SvgUri } from "react-native-svg";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Button, Image } from "tamagui";

import { useAuth } from "./AuthProvider";

GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!,
  offlineAccess: true,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
});

export const GoogleSignIn = () => {
  const { signInWithIdToken } = useAuth();

  return (
    <Button
      onPress={async () => {
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
      }}
      icon={
        Platform.OS === "web" ? (
          <Image src={"https://www.cdnlogo.com/logos/g/35/google-icon.svg"} width={20} height={20} />
        ) : (
          <SvgUri uri={"https://www.cdnlogo.com/logos/g/35/google-icon.svg"} width={20} height={20} />
        )
      }
    >
      Continue with Google
    </Button>
  );
};
