// src/components/event-list.tsx
// Just the scrolling list. The screen decides the layout around it.
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleProp,
  StyleSheet,
  ViewStyle,
  Pressable,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { EventDto, fetchEvents } from "@/lib/events-api";

type Props = {
  scope?: "mine"; // omit for the Home list
  emptyText: string;
  showStatus?: boolean; // show draft/cancelled labels
  style?: StyleProp<ViewStyle>; // style for the list itself
  contentContainerStyle?: StyleProp<ViewStyle>; // padding inside the scroll area
  //onPress?: (event: EventDto) => void;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function EventList({
  scope,
  emptyText,
  showStatus,
  style,
  contentContainerStyle,
}: Props) {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setError(null);
      setEvents(await fetchEvents(scope));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, [scope]);

  // Reload whenever the screen comes into focus, so new events show up right away.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <ActivityIndicator style={styles.loading} />;

  return (
    <FlatList
      style={[styles.list, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      data={events}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <ThemedText type="small" style={styles.empty}>
          {error ?? emptyText}
        </ThemedText>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push({ pathname: "/event/[id]", params: { id: item.id } })
          }
          style={({ pressed }) => pressed && { opacity: 0.7 }}
        >
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="default" style={styles.cardTitle}>
              {item.name}
            </ThemedText>
            <ThemedText type="small">{formatDate(item.startTime)}</ThemedText>
            {item.location ? (
              <ThemedText type="small">{item.location}</ThemedText>
            ) : null}
            {item.capacity ? (
              <ThemedText type="small">Capacity: {item.capacity}</ThemedText>
            ) : null}
            {showStatus && item.status !== "published" ? (
              <ThemedText type="code">{item.status}</ThemedText>
            ) : null}
          </ThemedView>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 }, // fills the space left by the rest of the screen, scrolls on its own
  content: { gap: Spacing.two, paddingBottom: Spacing.four },
  loading: { marginTop: Spacing.five },
  empty: { textAlign: "center", marginTop: Spacing.five },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardTitle: { fontWeight: "600" },
});
