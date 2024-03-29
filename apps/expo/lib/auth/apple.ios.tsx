import React from "react";
import { Platform } from "react-native";
import { SvgUri } from "react-native-svg";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { Button, Image } from "tamagui";

import { useAuth } from "./AuthProvider";

export const AppleSignIn = () => {
  const [loading, setLoading] = React.useState(false);
  const { signInWithIdToken } = useAuth();

  return (
    <Button
      disabled={loading}
      onPress={async () => {
        setLoading(true);
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          if (credential.identityToken) {
            console.log(credential);
            const user = await signInWithIdToken({
              idToken: credential.identityToken,
              user: {
                username: credential.fullName
                  ? credential.fullName?.nickname ??
                    `${credential.fullName?.givenName} ${credential.fullName?.familyName}`
                  : credential.user,
              },
              provider: "apple",
            });
            if (user) {
              void router.replace("/(app)");
            }
          }
        } catch (e) {
          console.log(e);
        }
        setLoading(false);
      }}
      icon={
        Platform.OS === "web" ? (
          <Image src={"https://www.cdnlogo.com/logos/a/2/apple.svg"} width={20} height={20} />
        ) : (
          <SvgUri uri={"https://www.cdnlogo.com/logos/a/2/apple.svg"} width={20} height={20} />
        )
      }
    >
      Continue with Apple
    </Button>
  );
};
