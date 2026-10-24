import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { EventDetailDto, EventTicketDto, fetchEvent } from "@/lib/events-api";

const formatPrice = (price: number) =>
  price === 0 ? "Free" : `$${price.toFixed(2)}`;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function BuyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log("buy params", params);
  const { eventId, ticketId } = useLocalSearchParams<{
    eventId: string;
    ticketId: string;
  }>();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [ticket, setTicket] = useState<EventTicketDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const e = await fetchEvent(eventId);
        if (cancelled) return;
        setEvent(e);
        setTicket(e.tickets?.find((t) => t.ticketId === ticketId) ?? null);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Something went wrong.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, ticketId]);

  if (loading) return <ActivityIndicator style={styles.loading} />;

  if (!event || !ticket) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: "Buy ticket" }} />
        <ThemedText type="small" style={styles.center}>
          {error ?? "Ticket not found."}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Buy ticket" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.sectionTitle}>Event</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">{event.name}</ThemedText>
          <ThemedText type="small">
            {formatDateTime(event.startTime)}
          </ThemedText>
          {event.location ? (
            <ThemedText type="small">{event.location}</ThemedText>
          ) : null}
        </ThemedView>

        <ThemedText style={styles.sectionTitle}>Ticket</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardTitle}>{ticket.name}</ThemedText>
          <ThemedText type="small">
            {formatPrice(ticket.ticketPrice)}
          </ThemedText>
        </ThemedView>
      </ScrollView>

      <ThemedView
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.three },
        ]}
      >
        <Pressable
          onPress={() =>
            router.push({ pathname: "/payment", params: { ticketId } })
          }
          style={({ pressed }) => [
            styles.payButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={styles.payButtonText}>Proceed to pay</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.two },
  loading: { marginTop: Spacing.five },
  center: { textAlign: "center", marginTop: Spacing.five },
  sectionTitle: { fontWeight: "700", marginTop: Spacing.two },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardTitle: { fontWeight: "600" },
  footer: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  payButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: "#208AEF",
    alignItems: "center",
  },
  payButtonText: { color: "#fff", fontWeight: "600" },
});
