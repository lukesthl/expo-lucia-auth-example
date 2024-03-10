import { Stack } from "expo-router";

import { App } from "./App";

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Home",
        }}
      />
      <App />
    </>
  );
}
