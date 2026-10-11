import { useState } from "react";
import { Button, Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { createEvent, deleteEvent, Event, listEvents } from "@/data/event";
import { supabase } from "@/lib/supabase";

function describeError(e: unknown) {
  if (e instanceof Error && e.message === "timeout") {
    return "Timed out. Is the Next.js server running, and is EXPO_PUBLIC_API_URL correct?";
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [status, setStatus] = useState("");
  const [events, setEvents] = useState<Event[]>([]);

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
      const list = await listEvents();
      setEvents(list);
    } catch (e) {
      setStatus("List failed: " + describeError(e));
    }
  }

  async function handleCreate() {
    try {
      setStatus("Creating...");
      const start = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
      const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // +3 hours

      const created = await createEvent({
        name: "Test Event " + new Date().toLocaleTimeString(),
        description: "Created from the app",
        location: "Test Venue",
        capacity: 50,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: "published",
      });

      setStatus(`Created: ${created.name}`);
      await handleRefresh();
    } catch (e) {
      setStatus("Create failed: " + describeError(e));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEvent(id);
      setStatus("Deleted");
      await handleRefresh();
    } catch (e) {
      setStatus("Delete failed: " + describeError(e));
    }
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <Button title="Create test event" onPress={handleCreate} />
          <Button title="Refresh list" onPress={handleRefresh} />
          <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
          {status ? <ThemedText>{status}</ThemedText> : null}
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          {events.map((ev) => (
            <ThemedView key={ev.id} style={styles.eventRow}>
              <ThemedText type="smallBold">{ev.name}</ThemedText>
              <ThemedText>
                {ev.status} · {new Date(ev.startTime).toLocaleString()}
              </ThemedText>
              <Button title="Delete" onPress={() => handleDelete(ev.id)} />
            </ThemedView>
          ))}
        </ThemedView>
        {Platform.OS === "web" && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  sectionsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  eventRow: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
});
