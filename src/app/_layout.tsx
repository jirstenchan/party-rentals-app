// app/_layout.tsx
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useSession } from "@/hooks/use-session";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, useColorScheme } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <RootNavigator />
    </OnboardingProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const session = useSession();
  const { seen } = useOnboarding();

  const loading = session === undefined || seen === undefined;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          {/* First launch on this phone */}
          <Stack.Screen name="index" />
          <Stack.Protected guard={!seen}>
            <Stack.Screen name="onboarding-1" />
            <Stack.Screen name="onboarding-2" />
            <Stack.Screen name="onboarding-3" />
          </Stack.Protected>

          {/* Logged in */}
          <Stack.Protected guard={!!seen && !!session}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="event" />
            <Stack.Screen name="my-tickets" />
            <Stack.Screen name="settings" />
          </Stack.Protected>

          {/* Logged out, onboarding already seen */}
          <Stack.Protected guard={!!seen && !session}>
            <Stack.Screen name="login" />
            <Stack.Screen name="verify-email" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}
