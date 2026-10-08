import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, useColorScheme } from "react-native";
import { SignIn } from "@/components/sign-in";
import { useSession } from "@/hooks/use-session";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const session = useSession();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {session === undefined && <ActivityIndicator style={{ flex: 1 }} />}
      {session === null && <SignIn />}
      {session && <AppTabs />}
    </ThemeProvider>
  );
}
