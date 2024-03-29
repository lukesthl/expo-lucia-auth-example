import { useColorScheme } from "react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { TamaguiProvider } from "tamagui";

import "../tamagui-web.css";

import { AuthProvider } from "../lib/auth/AuthProvider";
import config from "../tamagui.config";

export default function HomeLayout() {
  const [loaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });
  const scheme = useColorScheme();
  if (!loaded) {
    return null;
  }
  return (
    <TamaguiProvider config={config} defaultTheme={scheme ?? ""}>
      <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack />
        </AuthProvider>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
