import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import { Button, Text } from "tamagui";

export default function Screen() {
  const [redirectUri, setRedirectUri] = useState("");
  useEffect(() => {
    try {
      void Linking.canOpenURL("com.expoluciaauth.app").then((supported) => {
        if (supported) {
          const url = window.location.href.replace(
            `${process.env.EXPO_PUBLIC_API_URL}/redirect-to-app`,
            "com.expoluciaauth.app://"
          );
          setRedirectUri(url);
        } else {
          console.log("Don't know how to open URI: " + "com.expoluciaauth.app");
        }
      });
    } catch (error) {
      console.log(error);
      void router.replace("/(app)");
    }
  }, []);
  return (
    <>
      <Stack.Screen
        options={{
          title: "Home",
        }}
      />
      <Text> Redirecting...</Text>
      <Text>{redirectUri}</Text>
      <Text>If you are not redirected, please click the button below</Text>
      <Button
        onPress={() => {
          console.log(redirectUri);
          void router.replace(redirectUri);
        }}
      >
        Open app
      </Button>
    </>
  );
}
