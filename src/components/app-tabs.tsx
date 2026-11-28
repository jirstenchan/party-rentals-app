import { Tabs, useSegments } from "expo-router";
import { Animated, Image } from "react-native";
import { useEffect, useState } from "react";

import { useTheme } from "@/hooks/use-theme";
import { TabBarVisibilityContext } from "@/lib/tab-bar-visibility";

export default function AppTabs() {
  const segments = useSegments() as string[];
  const colors = useTheme();

  const [hiddenOnCreate, setHiddenOnCreate] = useState(false);
  const hidden = segments.includes("create") && hiddenOnCreate;

  const [translateY] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: hidden ? 120 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: hidden ? 0 : 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [hidden, translateY, opacity]);

  return (
    <TabBarVisibilityContext.Provider value={setHiddenOnCreate}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,

          // Keep the tab bar outside normal screen layout.
          // This allows Create to occupy the full screen.
          tabBarStyle: {
            height: 70,
            position: "absolute",
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            transform: [{ translateY }],
            opacity,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Image
                source={require("@/assets/images/tabIcons/home.png")}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: color,
                }}
                resizeMode="contain"
              />
            ),
          }}
        />

        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarIcon: ({ color }) => (
              <Image
                source={require("@/assets/images/tabIcons/create.png")}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: color,
                }}
                resizeMode="contain"
              />
            ),
          }}
        />

        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ color }) => (
              <Image
                source={require("@/assets/images/tabIcons/profile.png")}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: color,
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
      </Tabs>
    </TabBarVisibilityContext.Provider>
  );
}
