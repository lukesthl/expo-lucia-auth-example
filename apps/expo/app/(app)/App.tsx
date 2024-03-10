import { router } from "expo-router";
import { Button, Text, View } from "tamagui";

import { useAuth } from "../AuthProvider";

export function App() {
  const { user, signIn, signOut } = useAuth();
  return (
    <View>
      {user ? (
        <Button
          onPress={() => {
            void signOut().then(() => router.replace("/auth/sign-in"));
          }}
        >
          Sign out
        </Button>
      ) : (
        <Button
          onPress={() => {
            void signIn();
          }}
        >
          Sign in
        </Button>
      )}
      {user && (
        <View>
          <Text>{user.username}</Text>
        </View>
      )}
    </View>
  );
}
