import { Platform } from "react-native";
import { SvgUri } from "react-native-svg";
import { router } from "expo-router";
import { Button, Image } from "tamagui";

import { useAuth } from "./AuthProvider";

export const AppleSignIn = () => {
  const { signInWithOAuth } = useAuth();

  return (
    <Button
      onPress={() => {
        void signInWithOAuth({ provider: "apple" }).then((user) => {
          if (user) {
            void router.replace("/(app)");
          }
        });
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
