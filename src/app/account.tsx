import { Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/lib/supabase";

export default function AccountScreen() {
  const profile = useProfile();
  return (
    <SafeAreaView
      style={{ flex: 1, padding: Spacing.four, gap: Spacing.three }}
    >
      <ThemedText type="subtitle">{profile?.email}</ThemedText>
      <ThemedText themeColor="textSecondary">Role: {profile?.role}</ThemedText>
      <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
    </SafeAreaView>
  );
}
