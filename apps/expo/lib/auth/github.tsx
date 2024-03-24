import * as React from "react";
import { Platform } from "react-native";
import { useAuthRequest } from "expo-auth-session";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Button } from "tamagui";

import { useAuth } from "../../app/AuthProvider";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID!;

const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
  revocationEndpoint: "https://github.com/settings/connections/applications/" + CLIENT_ID,
};

export const GithubSignIn = () => {
  const { signInWithIdToken } = useAuth();
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ["identity", "user:email"],
      redirectUri: `${process.env.EXPO_PUBLIC_API_URL}/${Platform.OS !== "web" ? "redirect-to-app" : ""}`,
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      if (!code) {
        return;
      }
      void signInWithIdToken({ idToken: code, provider: "github" }).then((user) => {
        if (user) {
          void router.replace("/(app)");
        }
      });
    }
  }, [response]);

  // HACK: for android /redirect-to-app is not working so intercepting the url
  React.useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = Linking.addEventListener("url", (event) => {
        const url = new URL(event.url);
        const code = url.searchParams.get("code");
        if (code) {
          void signInWithIdToken({ idToken: code, provider: "github" }).then((user) => {
            if (user) {
              void router.replace("/(app)");
            }
          });
        }
      });
      return () => {
        subscription.remove();
      };
    }
  }, []);

  return (
    <Button
      disabled={!request}
      onPress={() => {
        void promptAsync();
      }}
    >
      Login with github
    </Button>
  );
};
