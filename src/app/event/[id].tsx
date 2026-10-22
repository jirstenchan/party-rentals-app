// src/app/event/[id].tsx
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { EventDetailDto, EventTicketDto, fetchEvent } from "@/lib/events-api";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatPrice = (price: number) =>
  price === 0 ? "Free" : `$${price.toFixed(2)}`;

// "YYYY-MM-DD" -> local date. new Date("YYYY-MM-DD") parses as UTC and can
// show the previous day in negative-offset timezones.
const parseDay = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDay = (day: string) =>
  parseDay(day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const salesLabel = (t: EventTicketDto) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (t.salesStart && parseDay(t.salesStart) > today)
    return `On sale ${formatDay(t.salesStart)}`;
  if (t.salesEnd && parseDay(t.salesEnd) < today) return "Sales ended";
  if (t.salesEnd) return `On sale until ${formatDay(t.salesEnd)}`;
  return null;
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setEvent(await fetchEvent(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <ActivityIndicator style={styles.loading} />;

  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="small" style={styles.center}>
          {error ?? "Event not found."}
        </ThemedText>
      </ThemedView>
    );
  }

  const tickets = event.tickets ?? [];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: event.name }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview */}
        <ThemedText type="subtitle">{event.name}</ThemedText>
        {event.status !== "published" ? (
          <ThemedText type="code">{event.status}</ThemedText>
        ) : null}
        <ThemedText type="small">{formatDateTime(event.startTime)}</ThemedText>
        {event.endTime ? (
          <ThemedText type="small">
            Ends {formatDateTime(event.endTime)}
          </ThemedText>
        ) : null}
        {event.location ? (
          <ThemedText type="small">{event.location}</ThemedText>
        ) : null}
        {event.capacity ? (
          <ThemedText type="small">Capacity: {event.capacity}</ThemedText>
        ) : null}
        {event.description ? (
          <ThemedText style={styles.description}>
            {event.description}
          </ThemedText>
        ) : null}

        {/* Tickets */}
        <ThemedText type="default" style={styles.sectionTitle}>
          Tickets
        </ThemedText>
        {tickets.length === 0 ? (
          <ThemedText type="small">No tickets available yet.</ThemedText>
        ) : (
          tickets.map((ticket) => {
            const label = salesLabel(ticket);
            return (
              <ThemedView
                key={ticket.ticketId}
                type="backgroundElement"
                style={styles.card}
              >
                <ThemedText style={styles.cardTitle}>{ticket.name}</ThemedText>
                <ThemedText type="small">
                  {formatPrice(ticket.ticketPrice)}
                </ThemedText>
                {label ? <ThemedText type="small">{label}</ThemedText> : null}
              </ThemedView>
            );
          })
        )}

        {/* Tables (future) */}
        <ThemedText type="default" style={styles.sectionTitle}>
          Tables
        </ThemedText>
        <ThemedText type="small">Table reservations coming soon.</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.five,
  },
  loading: { marginTop: Spacing.five },
  center: { textAlign: "center", marginTop: Spacing.five },
  description: { marginTop: Spacing.two },
  sectionTitle: { fontWeight: "700", marginTop: Spacing.three },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardTitle: { fontWeight: "600" },
});
