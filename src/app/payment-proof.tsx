import { createThemeStyles } from "@/hooks/use-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
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
  EventDetailDto,
  EventDto,
  fetchEvent,
  fetchTicket,
  TicketDetailDto,
} from "@/lib/events-api";

// Theme colors

// Not in the theme yet

// Font sizes (same values as the Event Details UI in theme.ts)
const FontSize = {
  confirmTitle: 32,
  titleText: 20,
  ctaText: 18,
  cardTitle: 16,
  host: 14,
  detailLine: 14,
  notFound: 12,
} as const;

const PARTY_ICON = require("@/assets/images/home/party-icon.png");

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

export default function PaymentProofScreen() {
  const { theme, styles } = useStyles();
  const router = useRouter();
  const { ticketId, paymentRequired: paymentRequiredParam } =
    useLocalSearchParams<{
      ticketId: string;
      paymentRequired?: string;
    }>();
  const paymentRequired = paymentRequiredParam !== "false";
  const insets = useSafeAreaInsets();

  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Block Android hardware back button on this screen
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  // Fetch the ticket, then the full event (for the host details).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const t = await fetchTicket(ticketId);
        if (cancelled) return;
        setTicket(t);

        // The host name only comes with the full event. If this fails we
        // still show everything else.
        try {
          const ev = await fetchEvent(t.eventId);
          if (!cancelled) setEvent(ev);
        } catch {}
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
  }, [ticketId]);

  const goHome = () => {
    router.dismissAll(); // clear the whole stack
    router.replace("/");
  };

  const viewEventDetails = () => {
    if (!ticket) return;
    // TODO: adjust to your event details route
    router.push({
      pathname: "/event/[id]" as any,
      params: { id: ticket.eventId },
    });
  };

  // Use the full event when we have it, otherwise the one on the ticket.
  const details: EventDto | null = event ?? ticket?.event ?? null;
  const hostName: string | undefined = event?.host?.name;

  const timeText =
    details && details.endTime
      ? `${formatTime(details.startTime)} - ${formatTime(details.endTime)}`
      : details
        ? formatTime(details.startTime)
        : "";

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={goHome}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={32} color={theme.accent} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Party icon */}
          <View style={styles.iconCircle}>
            <Image
              source={PARTY_ICON}
              style={styles.partyIcon}
              resizeMode="contain"
            />
          </View>

          <ThemedText style={styles.confirmTitle}>
            Reservation Confirmed!
          </ThemedText>
          <ThemedText style={styles.confirmSubtitle}>
            You&apos;ve successfully booked a ticket!
          </ThemedText>
          {paymentRequired ? (
            <ThemedText style={styles.confirmNote}>
              The host will review your payment.
            </ThemedText>
          ) : null}

          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.accent}
              style={styles.loading}
            />
          ) : ticket && details ? (
            <>
              {/* Event card */}
              <View style={styles.eventCard}>
                {details.eventImageUrl ? (
                  <Image
                    source={{ uri: details.eventImageUrl }}
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
                    {details.name}
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
                      {formatDate(details.startTime)}
                    </ThemedText>
                  </View>

                  {/* Time */}
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="stopwatch-outline"
                      size={24}
                      color={theme.accent}
                    />
                    <ThemedText style={[styles.infoMain, styles.flex]}>
                      {timeText}
                    </ThemedText>
                  </View>

                  {/* Location */}
                  {details.location ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="location" size={24} color={theme.accent} />
                      <ThemedText style={[styles.infoMain, styles.flex]}>
                        {details.location}
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
              </View>
            </>
          ) : error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + Spacing.three },
          ]}
        >
          {ticket ? (
            <Pressable
              onPress={viewEventDetails}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="View event details"
            >
              <ThemedText style={styles.ctaButtonText}>
                View Event Details
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            onPress={goHome}
            hitSlop={12}
            style={styles.homeButton}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
          >
            <ThemedText style={styles.homeText}>Back to Home</ThemedText>
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
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.one,
  },

  // Content
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },

  // Party icon + confirmation text
  iconCircle: {
    alignSelf: "center",
    width: 160,
    height: 160,
    borderRadius: Radius.full,
    backgroundColor: theme.accentSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  partyIcon: {
    width: 90,
    height: 90,
  },
  confirmTitle: {
    color: theme.text,
    fontSize: 28,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  confirmSubtitle: {
    color: theme.text,
    fontSize: FontSize.cardTitle,
    textAlign: "center",
    marginTop: -Spacing.two,
  },
  confirmNote: {
    color: theme.warning,
    fontSize: FontSize.detailLine,
    textAlign: "center",
    marginTop: -Spacing.two,
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

  // Footer
  footer: {
    paddingHorizontal: Spacing.three,
    backgroundColor: theme.surface,
  },
  ctaButton: {
    height: 55,
    borderRadius: Radius.large,
    backgroundColor: BrandColors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    color: BrandColors.white,
    fontSize: FontSize.ctaText,
    fontWeight: "600",
  },
  homeButton: {
    alignSelf: "center",
    marginTop: Spacing.three,
  },
  homeText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "700",
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
