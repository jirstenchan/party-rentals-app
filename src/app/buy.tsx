import { createThemeStyles } from "@/hooks/use-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Radius, Spacing } from "@/constants/theme";
import {
  createTicketReservation,
  EventDetailDto,
  EventTableDto,
  EventTicketDto,
  fetchEvent,
} from "@/lib/events-api";
import { setProofDraft } from "@/lib/payment-draft";

// Theme colors

// Not in the theme yet

// Font sizes (same values as the Event Details UI in theme.ts)
const FontSize = {
  headerTitle: 22,
  titleText: 20,
  sectionTitle: 20,
  ctaText: 18,
  cardTitle: 16,
  host: 14,
  detailLine: 14,
  notFound: 12,
  caption: 12,
} as const;

const formatPrice = (price: number) =>
  price === 0 ? "Free" : `₱ ${price.toLocaleString("en-PH")}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

export default function BuyScreen() {
  const { theme, styles } = useStyles();
  const router = useRouter();
  const { eventId, ticketId, tableId } = useLocalSearchParams<{
    eventId: string;
    ticketId: string;
    tableId: string;
  }>();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [ticket, setTicket] = useState<EventTicketDto | null>(null);
  const [table, setTable] = useState<EventTableDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);

  // Reserve the selected ticket and proceed to payment.
  async function proceedToPay() {
    if (!ticket || reserving) return;

    try {
      setReserving(true);

      const reservation = await createTicketReservation(ticket.ticketId);

      if (!reservation.paymentRequired) {
        setProofDraft(null);
        router.replace({
          pathname: "/payment-proof",
          params: {
            ticketId: ticket.ticketId,
            paymentRequired: "false",
          },
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

  // Fetch the event and selected ticket.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchEvent(eventId);

        if (cancelled) return;

        setEvent(data);
        setTicket(
          data.tickets?.find((item) => item.ticketId === ticketId) ?? null,
        );
        setTable(data.tables?.find((item) => item.tableId === tableId) ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, ticketId]);

  // Loading state.
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.accent} style={styles.loading} />
      </ThemedView>
    );
  }

  // Event or ticket not found.
  if (!event || !ticket) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={theme.accent} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>
              RESERVATION DETAILS
            </ThemedText>
          </View>

          <ThemedText style={styles.errorText}>
            {error ?? "Ticket not found."}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // NOTE: adjust these field names to match your EventDetailDto.
  const e = event as any;
  const hostName: string | undefined = e.hostName ?? e.host?.name ?? e.hostedBy;
  const imageUrl: string | undefined = e.eventImageUrl ?? e.imageUrl;
  const endTime: string | undefined = e.endTime;

  const timeText = endTime
    ? `${formatTime(event.startTime)} - ${formatTime(endTime)}`
    : formatTime(event.startTime);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={theme.accent} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>
            RESERVATION DETAILS
          </ThemedText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Event card */}
          <View style={styles.eventCard}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.poster}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]}>
                <Ionicons name="image-outline" size={28} color={theme.textSecondary} />
              </View>
            )}

            <View style={styles.eventInfo}>
              <ThemedText style={styles.eventTitle} numberOfLines={2}>
                {event.name}
              </ThemedText>

              {hostName ? (
                <ThemedText style={styles.hostText}>
                  Hosted by: {hostName}
                </ThemedText>
              ) : null}

              {/* Date */}
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={24} color={theme.accent} />
                <ThemedText style={[styles.infoMain, styles.flex]}>
                  {formatDate(event.startTime)}
                </ThemedText>
              </View>

              {/* Time */}
              <View style={styles.infoRow}>
                <Ionicons name="stopwatch-outline" size={24} color={theme.accent} />
                <ThemedText style={[styles.infoMain, styles.flex]}>
                  {timeText}
                </ThemedText>
              </View>

              {/* Location */}
              {event.location ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={24} color={theme.accent} />
                  <ThemedText style={[styles.infoMain, styles.flex]}>
                    {event.location}
                  </ThemedText>
                </View>
              ) : null}

              {/* Price x persons */}
              <View style={styles.infoRow}>
                <View style={styles.pesoCircle}>
                  <MaterialCommunityIcons
                    name="currency-php"
                    size={12}
                    color={BrandColors.white}
                  />
                </View>
                <ThemedText style={[styles.infoMain, styles.flex]}>
                  {formatPrice(ticket.ticketPrice)} × 1 person
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Ticket card (same as Venue Map) */}
          <View style={styles.ticketCard}>
            <View style={styles.ticketIcon}>
              <Ionicons name="ticket-outline" size={46} color={theme.accent} />
            </View>

            <View style={styles.ticketInfo}>
              <ThemedText style={styles.ticketTitle} numberOfLines={1}>
                {ticket.name}
              </ThemedText>
              <ThemedText style={styles.ticketPrice}>
                {formatPrice(ticket.ticketPrice)}
              </ThemedText>
            </View>

            <Pressable
              onPress={proceedToPay}
              disabled={reserving}
              style={({ pressed }) => [
                styles.buyButton,
                (pressed || reserving) && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Buy ticket"
            >
              <ThemedText style={styles.buyButtonText}>Buy</ThemedText>
            </Pressable>
          </View>

          {/* Pending banner */}
          <View style={styles.pendingCard}>
            <Ionicons name="stopwatch-outline" size={40} color={theme.warning} />

            <View style={styles.flex}>
              <ThemedText style={styles.pendingTitle}>
                Reservation Pending
              </ThemedText>
              <ThemedText style={styles.pendingText}>
                Your reservation is created and waiting for payment.
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + Spacing.three },
          ]}
        >
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
            <ThemedText style={styles.totalValue}>
              {formatPrice(ticket.ticketPrice)}
            </ThemedText>
          </View>

          <Pressable
            onPress={proceedToPay}
            disabled={reserving}
            style={({ pressed }) => [
              styles.payButton,
              (pressed || reserving) && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Proceed to pay"
          >
            {reserving ? (
              <ActivityIndicator color={BrandColors.white} />
            ) : (
              <ThemedText style={styles.payButtonText}>
                Proceed to Pay
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loading: {
    marginTop: Spacing.five,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerTitle: {
    color: theme.accent,
    fontSize: FontSize.headerTitle,
    lineHeight: 30,
    fontWeight: "800",
  },

  // Content
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },

  // Event card
  eventCard: {
    flexDirection: "row",
    padding: Spacing.three,
    gap: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1.5,
    borderColor: theme.accent,
    backgroundColor: theme.surface,
  },
  poster: {
    width: 105,
    height: 160,
    borderRadius: Radius.medium,
  },
  posterPlaceholder: {
    backgroundColor: theme.backgroundElement,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flex: 1,
    gap: Spacing.two,
  },
  eventTitle: {
    color: theme.text,
    fontSize: FontSize.titleText,
    lineHeight: 26,
    fontWeight: "800",
  },
  hostText: {
    color: theme.text,
    fontSize: FontSize.host,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  infoMain: {
    color: theme.text,
    fontSize: FontSize.detailLine,
  },
  pesoCircle: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: BrandColors.purple,
    alignItems: "center",
    justifyContent: "center",
  },

  // Ticket card (same as Venue Map)
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 84,
    paddingLeft: 13,
    paddingRight: 19,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  ticketIcon: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  ticketTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "700",
  },
  ticketPrice: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  buyButton: {
    width: 66,
    height: 28,
    borderRadius: Radius.medium,
    backgroundColor: BrandColors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  buyButtonText: {
    color: BrandColors.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  // Pending banner
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1.5,
    borderColor: theme.warning,
    backgroundColor: theme.warningSurface,
  },
  pendingTitle: {
    color: theme.warning,
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
  },
  pendingText: {
    color: theme.warning,
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.one,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.three,
    backgroundColor: theme.surface,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.three,
    marginBottom: Spacing.three,
    borderTopWidth: 1.5,
    borderTopColor: theme.border,
  },
  totalLabel: {
    color: theme.text,
    fontSize: 18,
    lineHeight: 16,
    fontWeight: "700",
  },
  totalValue: {
    color: theme.text,
    fontSize: FontSize.sectionTitle,
    lineHeight: 28,
    fontWeight: "700",
  },
  payButton: {
    height: 55,
    borderRadius: Radius.large,
    backgroundColor: BrandColors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    color: BrandColors.white,
    fontSize: FontSize.ctaText,
    fontWeight: "600",
  },
  cancelButton: {
    alignSelf: "center",
    marginTop: Spacing.three,
  },
  cancelText: {
    color: theme.textSecondary,
    fontSize: FontSize.cardTitle,
    fontWeight: "500",
    textDecorationLine: "underline",
  },

  // Other
  errorText: {
    textAlign: "center",
    marginTop: Spacing.five,
    color: theme.textSecondary,
    fontSize: FontSize.notFound,
  },
  pressed: {
    opacity: 0.85,
  },
}));
