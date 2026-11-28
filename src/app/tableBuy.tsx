import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Spacing } from "@/constants/theme";
import {
  createTableReservation,
  fetchEvent,
  type EventDetailDto,
} from "@/lib/events-api";

const formatPrice = (price: number) =>
  price === 0 ? "Free" : `₱${price.toLocaleString("en-PH")}`;

export default function TableBuyScreen() {
  const router = useRouter();
  const { eventId, tableId } = useLocalSearchParams<{
    eventId: string;
    tableId: string;
  }>();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const table = event?.tables.find((item) => item.tableId === tableId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const requestInProgress = useRef(false);

  async function reserve() {
    if (!table || requestInProgress.current) return;

    requestInProgress.current = true;
    setReserving(true);
    setReserveError(null);
    try {
      const booking = await createTableReservation(table.tableId);
      if (
        booking.reservationStatus === "Pending" &&
        booking.paymentRequired &&
        !booking.paymentSubmitted
      ) {
        router.replace({
          pathname: "/payment",
          params: {
            itemType: "table",
            reservationItemId: booking.reservationItemId,
          },
        });
      } else {
        router.replace("/my-tables");
      }
    } catch (err) {
      setReserveError(
        err instanceof Error ? err.message : "Couldn't reserve this table.",
      );
    } finally {
      requestInProgress.current = false;
      setReserving(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchEvent(eventId);
        if (!cancelled) setEvent(result);
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
  }, [eventId]);

  if (loading) return <ActivityIndicator style={styles.loading} />;

  if (!event || !table) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: "Reserve table" }} />
        <ThemedText type="small" style={styles.center}>
          {error ?? "Table not found."}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Reserve table" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.sectionTitle}>Event</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">{event.name}</ThemedText>
          {event.location ? (
            <ThemedText type="small">{event.location}</ThemedText>
          ) : null}
        </ThemedView>

        <ThemedText style={styles.sectionTitle}>Table</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardTitle}>{table.label}</ThemedText>
          <ThemedText type="small">{formatPrice(table.tablePrice)}</ThemedText>
          {table.capacity !== null && (
            <ThemedText type="small">
              {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
            </ThemedText>
          )}
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary">
          {table.tablePrice > 0
            ? "Submit payment proof before the table hold expires. You can add guest names after the host approves."
            : "You can add guest names once the host approves this reservation."}
        </ThemedText>
      </ScrollView>

      <ThemedView
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.three },
        ]}
      >
        {reserveError && (
          <ThemedText accessibilityRole="alert" themeColor="danger" style={styles.error}>
            {reserveError}
          </ThemedText>
        )}
        <Pressable
          onPress={reserve}
          disabled={reserving}
          accessibilityRole="button"
          accessibilityState={{ busy: reserving, disabled: reserving }}
          style={({ pressed }) => [
            styles.payButton,
            (pressed || reserving) && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={styles.payButtonText}>
            {reserving
              ? "Reserving…"
              : table.tablePrice > 0
                ? "Reserve and pay"
                : "Request reservation"}
          </ThemedText>
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
  error: { marginBottom: Spacing.two },
  payButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: BrandColors.purple,
    alignItems: "center",
  },
  payButtonText: { color: "#fff", fontWeight: "600" },
});
