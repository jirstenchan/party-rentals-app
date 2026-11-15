import AppTabs from "@/components/app-tabs";
import { useSession } from "@/hooks/use-session";
import { registerForPushNotifications } from "@/lib/notifications";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function TabsLayout() {
  const session = useSession();

  // Ask for notification permission here, so the prompt appears over the home tab
  useEffect(() => {
    if (session?.access_token) {
      registerForPushNotifications(session.access_token).catch(console.error);
    }
  }, [session?.user?.id]);

  if (session === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  // Logged out: the root layout swaps to <SignIn /> by itself, so render nothing
  if (!session) return null;

  return <AppTabs />;
}
