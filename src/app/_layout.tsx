// app/_layout.tsx
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Colors, type AppColors } from "@/constants/theme";
import { useSession } from "@/hooks/use-session";
import { useThemeScheme } from "@/hooks/use-theme";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

SplashScreen.preventAutoHideAsync();

function navigationTheme(base: typeof DefaultTheme, colors: AppColors) {
  return {
    ...base,
    colors: {
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
}

const navigationThemes = {
  light: navigationTheme(DefaultTheme, Colors.light),
  dark: navigationTheme(DarkTheme, Colors.dark),
};

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <RootNavigator />
    </OnboardingProvider>
  );
}

function RootNavigator() {
  const scheme = useThemeScheme();
  const theme = Colors[scheme];
  const session = useSession();
  const { seen } = useOnboarding();

  const loading = session === undefined || seen === undefined;

  return (
    <ThemeProvider value={navigationThemes[scheme]}>
      <AnimatedSplashOverlay />
      {loading ? (
        <View
          style={{
            flex: 1,
            backgroundColor: theme.background,
            justifyContent: "center",
          }}
        >
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            statusBarStyle: scheme === "dark" ? "light" : "dark",
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          {/* First launch on this phone */}
          <Stack.Screen name="index" />
          <Stack.Screen
            name="loading-preview"
            options={{ statusBarStyle: "dark" }}
          />
          <Stack.Protected guard={!seen}>
            <Stack.Screen
              name="onboarding"
              options={{ statusBarStyle: "dark" }}
            />
          </Stack.Protected>

          {/* Logged in */}
          <Stack.Protected guard={!!seen && !!session}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="event" />
            <Stack.Screen name="my-events" />
            <Stack.Screen name="my-tickets" />
            <Stack.Screen name="my-tables" />
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
