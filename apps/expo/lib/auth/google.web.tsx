import { Platform } from "react-native";
import { SvgUri } from "react-native-svg";
import { router } from "expo-router";
import { Button, Image } from "tamagui";

import { useAuth } from "./AuthProvider";

export const GoogleSignIn = () => {
  const { signInWithOAuth } = useAuth();
  return (
    <Button
      onPress={() => {
        void signInWithOAuth({ provider: "google" }).then((user) => {
          if (user) {
            void router.replace("/(app)");
          }
        });
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
