import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// Show notifications as a banner even while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(accessToken: string) {
  // console.log("1. register called");
  // console.log("2. isDevice:", Device.isDevice);
  // Push only works on a real phone, not a simulator
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  // Ask for permission (only prompts the guest if they haven't decided yet)
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== "granted") return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("No EAS projectId found. Run `eas init` in your app.");
    return;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  // Save the token on your website, as the logged-in guest
  const res = await fetch(`${API_URL}/api/push-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) console.warn("Saving push token failed:", res.status);
}
