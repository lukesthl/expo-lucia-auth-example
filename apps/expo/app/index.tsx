import { router, Stack } from "expo-router";
import { Button } from "tamagui";

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Home",
        }}
      />
      <Button onPress={() => router.push("/(app)")}>Home</Button>
      {/* <App /> */}
    </>
  );
}
