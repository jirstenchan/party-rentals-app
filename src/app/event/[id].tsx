import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Radius } from "@/constants/theme";
import { EventDetailDto, EventTicketDto, fetchEvent } from "@/lib/events-api";

const PURPLE = BrandColors.purple;
const BORDER = BrandColors.border;
const MARGIN = 25;
const COVER_HEIGHT = 180;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Same day:  "2:00 PM – 6:00 PM"
// Multi-day: "Nov 20, 2:00 PM – Nov 21, 10:00 AM"
const formatEventTime = (startIso: string, endIso?: string | null) => {
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return "Time not specified";

  if (!endIso) return formatTime(startIso);

  const end = new Date(endIso);
  if (isNaN(end.getTime())) return formatTime(startIso);

  if (isSameDay(start, end)) {
    return `${formatTime(startIso)} – ${formatTime(endIso)}`;
  }

  return `${formatShortDate(startIso)}, ${formatTime(startIso)} – ${formatShortDate(endIso)}, ${formatTime(endIso)}`;
};

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

// Format ticket price in Philippine pesos.
const formatPeso = (price: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(price);

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [isFavorite, setIsFavorite] = useState(false);
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverWidth = width - MARGIN * 2;

  // Fetch event details from the backend.
  const loadEvent = useCallback(async () => {
    if (!id) {
      setError("Invalid event ID.");
      setEvent(null);
      return;
    }

    try {
      setError(null);

      const result = await fetchEvent(id);
      setFailedAvatarUrl(null);
      setEvent(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't load this event. Please try again.",
      );
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);

    loadEvent().finally(() => {
      setLoading(false);
    });
  }, [loadEvent]);

  // Pull-to-refresh.
  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvent();
    setRefreshing(false);
  };

  // Get the lowest ticket price.
  const startingPrice =
    event?.tickets && event.tickets.length > 0
      ? Math.min(...event.tickets.map((ticket) => ticket.ticketPrice))
      : null;
  const hostName = event?.host?.name;
  const avatarUrl = event?.host?.avatarUrl;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={PURPLE} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>EVENT DETAILS</ThemedText>

          {/* Heart Icon - Saved Events */}
          <Pressable
            onPress={() => setIsFavorite((v) => !v)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Remove from saved" : "Save event"}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={26}
              color={PURPLE}
            />
          </Pressable>

          {/* TODO: Hook up the options menu */}
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Ionicons name="ellipsis-vertical" size={24} color={PURPLE} />
          </Pressable>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={PURPLE} />
            <ThemedText style={styles.stateText}>
              Loading event details...
            </ThemedText>
          </View>
        ) : error ? (
          /* Error State */
          <View style={styles.stateContainer}>
            <Ionicons name="alert-circle-outline" size={42} color={PURPLE} />

            <ThemedText style={styles.stateText}>{error}</ThemedText>

            <Pressable
              onPress={loadEvent}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={styles.retryText}>Try Again</ThemedText>
            </Pressable>
          </View>
        ) : !event ? (
          <ThemedText themeColor="textSecondary" style={styles.notFound}>
            This event could not be found.
          </ThemedText>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={PURPLE}
                />
              }
            >
              {/* Cover Image */}
              <View style={[styles.coverImage, { width: coverWidth }]}>
                {event.eventImageUrl ? (
                  <Image
                    source={{ uri: event.eventImageUrl }}
                    style={{
                      width: coverWidth,
                      height: COVER_HEIGHT,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color={PURPLE} />
                    <ThemedText style={styles.placeholderText}>
                      No event image available
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Title + Host */}
              <View style={styles.titleRow}>
                {avatarUrl && avatarUrl !== failedAvatarUrl ? (
                  <ExpoImage
                    key={avatarUrl}
                    source={{ uri: avatarUrl }}
                    onError={() => setFailedAvatarUrl(avatarUrl)}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={28} color={PURPLE} />
                  </View>
                )}

                <View style={styles.titleText}>
                  <ThemedText style={styles.title} numberOfLines={1}>
                    {event.name}
                  </ThemedText>

                  <ThemedText style={styles.host} numberOfLines={1}>
                    {hostName ? `Hosted by ${hostName}` : "Host name unavailable"}
                  </ThemedText>
                </View>
              </View>

              {/* Event Details */}
              <View style={styles.details}>
                {/* Date */}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="calendar" size={22} color={PURPLE} />
                  </View>

                  <ThemedText style={styles.detailLine}>
                    {formatDateTime(event.startTime)}
                  </ThemedText>
                </View>

                {/* Time */}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="time" size={22} color={PURPLE} />
                  </View>

                  <ThemedText style={styles.detailLine}>
                    {formatEventTime(event.startTime, event.endTime)}
                  </ThemedText>
                </View>

                {/* Location */}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="location" size={28} color={PURPLE} />
                  </View>

                  <View style={styles.detailText}>
                    <ThemedText style={styles.detailLine}>
                      {event.location || "Location not specified"}
                    </ThemedText>
                  </View>
                </View>

                {/* Ticket Price */}
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <View style={styles.pesoBadge}>
                      <ThemedText style={styles.pesoBadgeText}>₱</ThemedText>
                    </View>
                  </View>

                  <View style={styles.detailText}>
                    <ThemedText style={styles.detailLine}>
                      {startingPrice !== null
                        ? `Starting at ${formatPeso(startingPrice)}`
                        : "Ticket price unavailable"}
                    </ThemedText>
                  </View>
                </View>

                {/* Event Capacity */}
                {event.capacity != null ? (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons
                        name="people-outline"
                        size={28}
                        color={PURPLE}
                      />
                    </View>

                    <View style={styles.detailText}>
                      <ThemedText style={styles.detailLine}>
                        Capacity: {event.capacity} guests
                      </ThemedText>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.divider} />

              {/* About */}
              <ThemedText style={styles.aboutTitle}>
                About this event
              </ThemedText>

              <ThemedText style={styles.aboutBody}>
                {event.description || "No event description available."}
              </ThemedText>
            </ScrollView>

            {/* Pinned CTA */}
            <View style={styles.footer}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/venue-map/[id]",
                    params: { id: event.id },
                  })
                }
                style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="View venue map"
              >
                <ThemedText style={styles.ctaText}>View Venue Map</ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingLeft: 16,
    paddingRight: 18,
    gap: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 10,
    color: PURPLE,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
  },

  // Loading and Error States
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: MARGIN,
    gap: 14,
  },
  stateText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Radius.large,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  notFound: {
    textAlign: "center",
    marginTop: 64,
    fontSize: 12,
  },

  content: {
    paddingHorizontal: MARGIN,
    paddingTop: 4,
    paddingBottom: 12,
  },

  // Cover Image
  coverImage: {
    height: COVER_HEIGHT,
    borderRadius: Radius.large,
    overflow: "hidden",
    backgroundColor: BORDER,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeholderText: {
    fontSize: 12,
  },

  // Title + Host
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 20,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: Radius.full,
    backgroundColor: BORDER,
  },
  avatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: Radius.full,
    backgroundColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: { flex: 1 },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  host: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Details
  details: {
    marginTop: 12,
    gap: 0,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  detailIcon: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: { flex: 1 },
  detailLine: {
    fontSize: 14,
    lineHeight: 18,
  },
  pesoBadge: {
    width: 23,
    height: 23,
    borderRadius: Radius.full,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  pesoBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 16,
  },

  // About
  aboutTitle: {
    marginTop: 15,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "600",
  },
  aboutBody: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 26,
    fontWeight: "400",
  },

  // CTA
  footer: {
    paddingHorizontal: MARGIN,
    paddingTop: 12,
    paddingBottom: 25,
  },
  cta: {
    height: 55,
    borderRadius: Radius.large,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
  },
  pressed: { opacity: 0.85 },
});
