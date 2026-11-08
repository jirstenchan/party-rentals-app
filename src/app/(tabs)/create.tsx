import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateEventForm } from "@/components/event/create-event-form";
import { EventRow } from "@/components/event/event-row";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { deleteEvent, listMyEvents, type Event } from "@/data/event";
import { problemFor } from "@/data/problem";

const PURPLE = "#6B2CF5";

export default function CreateEventScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();

  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState("");

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
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
      style={styles.scrollView}
      keyboardShouldPersistTaps="handled"
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace("/home")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
          >
            <Ionicons name="chevron-back" size={28} color={PURPLE} />
          </Pressable>

          <Text style={styles.headerTitle}>CREATE EVENT</Text>
        </View>

        <CreateEventForm onCreated={handleRefresh} />

        <View style={styles.eventsSection}>
          {status ? <Text style={styles.status}>{status}</Text> : null}

          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onDelete={handleDelete}
              onStatus={setStatus}
            />
          ))}
        </View>

        {Platform.OS === "web" && <WebBadge />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    color: PURPLE,
    fontSize: 26,
    fontWeight: "800",
  },
  eventsSection: {
    gap: 14,
  },
  refreshButton: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  refreshText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: "600",
  },
  status: {
    color: "#000",
    fontSize: 14,
    textAlign: "center",
  },
});
