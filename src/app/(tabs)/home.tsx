import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, BrandColors, Radius } from "@/constants/theme";
import { EventDto, fetchEvents } from "@/lib/events-api";

const PURPLE = BrandColors.purple;
const BORDER = BrandColors.border;
const MUTED = BrandColors.muted;
const BLACK = BrandColors.black;
const WHITE = BrandColors.white;

// Logo
const LOGO = require("../../../assets/images/home/partylink-logo.png");

// TODO: hook up the filters and header icons. UI only for now.
const FILTERS = [
  { id: "dates", label: "All Dates", active: true },
  { id: "types", label: "All Types", active: false },
  { id: "distance", label: "Distance", active: false },
] as const;

const HEADER_ICONS = [
  { id: "calendar", icon: "calendar-outline", label: "Calendar" },
  {
    id: "notifications",
    icon: "notifications-outline",
    label: "Notifications",
  },
  // { id: "saved", icon: "heart-outline", label: "Saved events" }, - remove this if saved (heart icon) is needed
] as const;

// Format the API date for the event card.
function formatEventDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomeScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  // Backend event data
  const [allEvents, setAllEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from the backend
  const loadEvents = useCallback(async () => {
    try {
      setError(null);

      const data = await fetchEvents();

      setAllEvents(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load events. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch events when the Home Page loads
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  // Search through the backend events
  const events = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return allEvents;

    return allEvents.filter(
      (event) =>
        event.name.toLowerCase().includes(q) ||
        (event.location ?? "").toLowerCase().includes(q),
    );
  }, [allEvents, query]);

  // Toggle saved events
  const toggleFavorite = (id: string) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />

          <View style={styles.headerIcons}>
            {HEADER_ICONS.map((h) => (
              <Pressable
                key={h.id}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={h.label}
              >
                <Ionicons name={h.icon} size={24} color={PURPLE} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search events, venues, or hosts..."
            placeholderTextColor={MUTED}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <Ionicons name="search" size={22} color={MUTED} />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={({ pressed }) => [
                styles.filter,
                f.active && styles.filterActive,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={f.label}
            >
              <ThemedText
                style={[styles.filterText, f.active && styles.filterTextActive]}
              >
                {f.label}
              </ThemedText>

              <Ionicons
                name="chevron-down"
                size={18}
                color={f.active ? BrandColors.white : BLACK}
              />
            </Pressable>
          ))}
        </View>

        {/* Events */}
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PURPLE}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {loading ? (
                <>
                  <ActivityIndicator size="large" color={PURPLE} />
                  <ThemedText style={styles.empty}>
                    Loading events...
                  </ThemedText>
                </>
              ) : error ? (
                <>
                  <ThemedText themeColor="textSecondary" style={styles.empty}>
                    {error}
                  </ThemedText>

                  <Pressable onPress={loadEvents} style={styles.retryButton}>
                    <ThemedText style={styles.retryText}>Try Again</ThemedText>
                  </Pressable>
                </>
              ) : (
                <ThemedText themeColor="textSecondary" style={styles.empty}>
                  {query.trim()
                    ? "No events match your search."
                    : "No events available right now."}
                </ThemedText>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isFavorite = favorites.includes(item.id);

            return (
              <View style={styles.card}>
                {/* Event Cover */}
                {item.eventImageUrl ? (
                  <Image
                    source={{ uri: item.eventImageUrl }}
                    style={styles.cover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.cover} />
                )}

                <View style={styles.cardBody}>
                  {/* Event Title */}
                  <View style={styles.titleRow}>
                    <ThemedText style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </ThemedText>

                    {/* Heart Icon - Saved Events*/}
                    <Pressable
                      onPress={() => toggleFavorite(item.id)}
                      hitSlop={12}
                      style={{ paddingTop: 2, paddingRight: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isFavorite ? "Remove from saved" : "Save event"
                      }
                    >
                      <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={24}
                        color={PURPLE}
                      />
                    </Pressable>
                  </View>

                  {/* Event Date */}
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={15} color={BLACK} />
                    <ThemedText style={styles.infoText} numberOfLines={1}>
                      {formatEventDate(item.startTime)}
                    </ThemedText>
                  </View>

                  {/* Event Location */}
                  <View style={[styles.infoRow, styles.rowGap]}>
                    <Ionicons name="location-outline" size={15} color={BLACK} />
                    <ThemedText style={styles.infoText} numberOfLines={1}>
                      {item.location || "Location not specified"}
                    </ThemedText>
                  </View>

                  {/* Event Footer */}
                  <View style={[styles.footer, styles.rowGap]}>
                    <View style={styles.infoRow}>
                      <Ionicons name="cash-outline" size={15} color={BLACK} />
                      <ThemedText style={styles.infoText}>
                        View ticket prices
                      </ThemedText>
                    </View>

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/event/[id]",
                          params: { id: item.id },
                        })
                      }
                      style={({ pressed }) => [
                        styles.viewButton,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${item.name}`}
                    >
                      <ThemedText style={styles.viewButtonText}>
                        View Event
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 25 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -24,
    marginBottom: -16,
  },
  logo: { width: 180, height: 85 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 12 },

  // Search
  search: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    paddingHorizontal: 10,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontSize: 14, height: "100%", color: BLACK },

  // Filters
  filters: { flexDirection: "row", gap: 10, marginBottom: 18 },
  filter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 34,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  filterText: { fontSize: 12, lineHeight: 14, fontWeight: "500" },
  filterTextActive: { color: BrandColors.white },

  // List
  list: {
    gap: 18,
    paddingBottom: BottomTabInset + 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 12,
  },
  empty: { textAlign: "center", fontSize: 12 },
  retryButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radius.small,
  },
  retryText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "700",
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cover: {
    width: 90,
    height: 95,
    borderRadius: Radius.medium,
    backgroundColor: BORDER,
  },
  cardBody: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    height: 24,
  },
  cardTitle: { flex: 1, fontSize: 16, lineHeight: 15, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 16,
  },
  infoText: { flexShrink: 1, fontSize: 10, lineHeight: 15 },
  rowGap: { marginTop: 7 },
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  viewButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 10,
    width: 80,
    height: 25,
    borderRadius: Radius.small,
    alignItems: "center",
    justifyContent: "center",
  },
  viewButtonText: {
    color: BrandColors.white,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },

  pressed: { opacity: 0.85 },
});
