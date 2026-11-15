// // app/_layout.tsx
// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
//   Stack,
//   usePathname,
//   useRouter,
// } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { ActivityIndicator, useColorScheme } from "react-native";
// import { SignIn } from "@/components/sign-in";
// import { useSession } from "@/hooks/use-session";
// import { useEffect } from "react";
// import { registerForPushNotifications } from "@/lib/notifications";
// import { AnimatedSplashOverlay } from "@/components/animated-icon";
// import { OnboardingProvider, useOnboarding } from "@/lib/onboarding";

// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   return (
//     <OnboardingProvider>
//       <RootNavigator />
//     </OnboardingProvider>
//   );
// }

// function RootNavigator() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const colorScheme = useColorScheme();
//   const session = useSession();
//   const { seen } = useOnboarding();

//   console.log("gate:", {
//     session:
//       session === undefined ? "loading" : session ? "logged-in" : "logged-out",
//     seen,
//   });

//   useEffect(() => {
//     if (session?.access_token) {
//       registerForPushNotifications(session.access_token).catch(console.error);
//     }
//   }, [session?.user?.id]);

//   const inEntryFlow = pathname === "/" || pathname.startsWith("/onboarding");

//   useEffect(() => {
//     if (seen && session && inEntryFlow) {
//       router.replace("/home");
//     }
//   }, [seen, session, pathname]);

//   const loading = session === undefined || seen === undefined;

//   return (
//     <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//       <AnimatedSplashOverlay />
//       {loading && <ActivityIndicator style={{ flex: 1 }} />}

//       {/* Logged out, first time on this phone → onboarding */}
//       {!loading && session === null && !seen && (
//         <Stack screenOptions={{ headerShown: false }} />
//       )}

//       {/* Logged out, already saw onboarding → sign in */}
//       {!loading && session === null && seen && <SignIn />}

//       {/* Logged in */}
//       {session && (
//         <Stack>
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           <Stack.Screen name="event" options={{ headerShown: false }} />
//           <Stack.Screen name="settings" options={{ headerShown: false }} />
//         </Stack>
//       )}
//     </ThemeProvider>
//   );
// }

// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, useColorScheme } from "react-native";
import { useSession } from "@/hooks/use-session";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding";

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
            <Stack.Screen name="settings" />
            <Stack.Screen name="buy" />
            <Stack.Screen name="payment" />
            <Stack.Screen name="payment-proof" />
          </Stack.Protected>

          {/* Logged out, onboarding already seen */}
          <Stack.Protected guard={!!seen && !session}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}
