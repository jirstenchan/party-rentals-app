import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, useColorScheme } from "react-native";
import { SignIn } from "@/components/sign-in";
import { useSession } from "@/hooks/use-session";
import { useEffect } from "react";
import { registerForPushNotifications } from "@/lib/notifications";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const session = useSession();
  useEffect(() => {
    console.log("session:", session ? Object.keys(session) : session);
    if (session?.access_token) {
      registerForPushNotifications(session.access_token).catch(console.error);
    }
  }, [session?.user?.id]);
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {session === undefined && <ActivityIndicator style={{ flex: 1 }} />}
      {session === null && <SignIn />}
      {session && (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="event" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      )}
    </ThemeProvider>
  );
}
