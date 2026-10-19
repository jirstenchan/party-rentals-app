// import { Stack } from "expo-router";

// export default function RootLayout() {
//   return (
//     <Stack screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="index" />
//       <Stack.Screen name="loading-preview" />
//       <Stack.Screen name="onboarding-1" />
//       <Stack.Screen name="onboarding-2" />
//       <Stack.Screen name="onboarding-3" />
//       <Stack.Screen name="login" />
//       {/* <Stack.Screen name="dashboard" /> Create a file for dashboard */}
//     </Stack>
//   );
// }

// Remove later before pushing
import { SignIn } from "@/components/sign-in";
import { useSession } from "@/hooks/use-session";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, useColorScheme } from "react-native";

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
