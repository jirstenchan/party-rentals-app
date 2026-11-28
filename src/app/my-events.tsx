import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EventList } from "@/components/event/event-list";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function MyEventsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const allEvents = view === "all";

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/account")}
          >
            <Ionicons name="chevron-back" size={28} color={theme.accent} />
          </Pressable>
          <ThemedText style={styles.title} themeColor="accent">
            {allEvents ? "All My Events" : "Upcoming Events"}
          </ThemedText>
        </View>

        <EventList
          scope="mine"
          showStatus
          upcomingOnly={!allEvents}
          emptyText={
            allEvents ? "You haven't created any events yet." : "You have no upcoming events."
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { flex: 1, paddingHorizontal: Spacing.four },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  title: { fontSize: 22, lineHeight: 30, fontWeight: "800" },
});
