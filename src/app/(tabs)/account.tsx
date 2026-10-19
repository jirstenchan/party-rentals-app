// Replace your existing account screen with this (keep its current file name/path).
import { Button, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventList } from "@/components/event/event-list";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/lib/supabase";

export default function AccountScreen() {
  const profile = useProfile();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed part: stays put */}
        <ThemedView style={styles.profile}>
          <ThemedText type="subtitle">{profile?.email}</ThemedText>
          <ThemedText themeColor="textSecondary">
            Role: {profile?.role}
          </ThemedText>
          <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
        </ThemedView>

        <ThemedText type="default" style={styles.sectionTitle}>
          Your events
        </ThemedText>

        {/* Only this part scrolls */}
        <EventList
          scope="mine"
          showStatus
          emptyText="You haven't created any events yet."
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    padding: Spacing.three,
    paddingBottom: BottomTabInset,
    gap: Spacing.three,
  },
  profile: { gap: Spacing.two, alignItems: "flex-start" },
  sectionTitle: { fontWeight: "600" },
});
