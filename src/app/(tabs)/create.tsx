import { useState } from "react";
import { Button, Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { CreateEventForm } from "@/components/event/create-event-form";
import { EventRow } from "@/components/event/event-row";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { deleteEvent, Event, listMyEvents } from "@/data/event";
import { problemFor } from "@/data/problem";

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState("");

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  async function handleRefresh() {
    try {
      setEvents(await listMyEvents());
    } catch (e) {
      setStatus("List failed: " + problemFor(e));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEvent(id);
      setStatus("Deleted");
      await handleRefresh();
    } catch (e) {
      setStatus("Delete failed: " + problemFor(e));
    }
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <CreateEventForm onCreated={handleRefresh} />

        <ThemedView style={styles.sectionsWrapper}>
          <Button title="Refresh list" onPress={handleRefresh} />
          {status ? <ThemedText>{status}</ThemedText> : null}

          {events.map((ev) => (
            <EventRow
              key={ev.id}
              event={ev}
              onDelete={handleDelete}
              onStatus={setStatus}
            />
          ))}
        </ThemedView>

        {Platform.OS === "web" && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: "row", justifyContent: "center" },
  container: { maxWidth: MaxContentWidth, flexGrow: 1 },
  sectionsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
});
