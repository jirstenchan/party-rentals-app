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
import {
  createTicketReservation,
  EventDetailDto,
  EventTicketDto,
  fetchEvent,
} from "@/lib/events-api";
import { setProofDraft } from "@/lib/payment-draft";

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
  const [reserving, setReserving] = useState(false);

  async function proceedToPay() {
    if (!ticket) return;
    try {
      setReserving(true);
      const reservation = await createTicketReservation(ticket.ticketId);
      if (!reservation.paymentRequired) {
        setProofDraft(null);
        router.replace({
          pathname: "/payment-proof",
          params: { ticketId: ticket.ticketId, paymentRequired: "false" },
        });
        return;
      }
      router.push({
        pathname: "/payment",
        params: {
          ticketId: ticket.ticketId,
          reservationItemId: reservation.reservationItemId,
        },
      });
    } catch (err) {
      Alert.alert(
        "Couldn't reserve ticket",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setReserving(false);
    }
  }

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
          onPress={proceedToPay}
          disabled={reserving}
          style={({ pressed }) => [
            styles.payButton,
            (pressed || reserving) && { opacity: 0.8 },
          ]}
        >
          {reserving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.payButtonText}>Proceed to pay</ThemedText>
          )}
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
