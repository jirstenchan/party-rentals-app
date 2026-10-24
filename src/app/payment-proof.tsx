import { useFocusEffect } from "expo-router/react-navigation";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { fetchTicket, TicketDetailDto } from "@/lib/events-api";
import { getProofDraft } from "@/lib/payment-draft";

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

export default function PaymentProofScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const proof = getProofDraft();

  const router = useRouter();

  console.log("proof draft", proof);

  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Block Android hardware back button on this screen
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  useEffect(() => {
    fetchTicket(ticketId)
      .then(setTicket)
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const goHome = () => {
    router.dismissAll(); // clear the whole stack
    router.replace("/");
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Payment sent",
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardTitle}>
            The host will review your payment
          </ThemedText>
          <ThemedText type="small">
            You'll be notified once your booking is confirmed.
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ActivityIndicator style={styles.loading} />
        ) : ticket ? (
          <>
            <ThemedText style={styles.sectionTitle}>Event</ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="subtitle">{ticket.event.name}</ThemedText>
              <ThemedText type="small">
                {formatDateTime(ticket.event.startTime)}
              </ThemedText>
              {ticket.event.location ? (
                <ThemedText type="small">{ticket.event.location}</ThemedText>
              ) : null}
            </ThemedView>

            <ThemedText style={styles.sectionTitle}>Ticket</ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardTitle}>{ticket.name}</ThemedText>
              <ThemedText type="small">
                {formatPrice(ticket.ticketPrice)}
              </ThemedText>
            </ThemedView>
          </>
        ) : null}

        <ThemedText style={styles.sectionTitle}>Proof of payment</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          {proof ? (
            <>
              <Image
                source={{ uri: proof.uri }}
                style={styles.proof}
                resizeMode="contain"
              />
              <ThemedText type="small" numberOfLines={1}>
                {proof.name}
              </ThemedText>
            </>
          ) : null}
        </ThemedView>

        <Pressable
          onPress={goHome}
          style={({ pressed }) => [
            styles.homeButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={styles.homeButtonText}>Back to home</ThemedText>
        </Pressable>
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
  loading: { marginTop: Spacing.three },
  sectionTitle: { fontWeight: "700", marginTop: Spacing.two },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardTitle: { fontWeight: "600" },
  proof: { width: "100%", height: 220 },
  homeButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: "#208AEF",
    alignItems: "center",
  },
  homeButtonText: { color: "#fff", fontWeight: "600" },
});
