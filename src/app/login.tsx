//Signup & Login
import { SignIn } from "@/components/sign-in";
import { useSession } from "@/hooks/use-session";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function LoginScreen() {
  const session = useSession();

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

  if (session) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <SignIn />;
}
