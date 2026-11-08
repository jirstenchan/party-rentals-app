import { Tabs, useSegments } from "expo-router";
import { useColorScheme, Animated, Image } from "react-native";
import { useEffect, useRef } from "react";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const segments = useSegments() as string[];
  const scheme = useColorScheme();

  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const hidden = segments.includes("create");

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
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
    ]).start();
  }, [hidden, translateY, opacity]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,

        // Keep the tab bar outside normal screen layout.
        // This allows Create to occupy the full screen.
        tabBarStyle: {
          height: 70,
          position: "absolute",
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundElement,
          transform: [{ translateY }],
          opacity,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require("@/assets/images/tabIcons/home.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
                opacity: focused ? 1 : 0.6,
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
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require("@/assets/images/tabIcons/create.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
                opacity: focused ? 1 : 0.6,
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
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require("@/assets/images/tabIcons/profile.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
                opacity: focused ? 1 : 0.6,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
