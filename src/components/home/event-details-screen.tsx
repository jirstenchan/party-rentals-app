import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors } from "@/constants/theme";
import { formatPeso, getEventById } from "@/data/mock-events";

const PURPLE = BrandColors.purple;
const MARGIN = 25;
const CAROUSEL_HEIGHT = 209;

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const event = getEventById(id);
  const carouselWidth = width - MARGIN * 2;

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
            <Ionicons name="chevron-back" size={24} color={PURPLE} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>EVENT DETAILS</ThemedText>

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

          {/* TODO: hook up the options menu */}
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <Ionicons name="ellipsis-vertical" size={24} color={PURPLE} />
          </Pressable>
        </View>

        {!event ? (
          <ThemedText themeColor="textSecondary" style={styles.notFound}>
            This event could not be found.
          </ThemedText>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Carousel */}
            <View style={[styles.carousel, { width: carouselWidth }]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) =>
                  setPage(
                    Math.round(e.nativeEvent.contentOffset.x / carouselWidth),
                  )
                }
              >
                {event.galleryUris.map((uri) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    style={{ width: carouselWidth, height: CAROUSEL_HEIGHT }}
                  />
                ))}
              </ScrollView>
              <View style={styles.dots} pointerEvents="none">
                {event.galleryUris.map((uri, i) => (
                  <View
                    key={uri}
                    style={[styles.dot, i === page && styles.dotActive]}
                  />
                ))}
              </View>
            </View>

            {/* Title + host */}
            <View style={styles.titleRow}>
              <Image
                source={{ uri: event.hostAvatarUri }}
                style={styles.avatar}
              />
              <View style={styles.titleText}>
                <ThemedText style={styles.title} numberOfLines={1}>
                  {event.title}
                </ThemedText>
                <ThemedText style={styles.host} numberOfLines={1}>
                  Hosted by: {event.hostName}
                </ThemedText>
              </View>
            </View>

            {/* Details */}
            <View style={styles.details}>
              {/* Date + time (two lines sit a little tighter to the next row) */}
              <View style={[styles.detailRow, styles.dateRow]}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar" size={28} color={PURPLE} />
                </View>
                <View style={styles.detailText}>
                  <ThemedText style={styles.detailLine}>
                    {event.detailDate}
                  </ThemedText>
                  <ThemedText style={styles.detailLine}>
                    {event.detailTime}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="location" size={28} color={PURPLE} />
                </View>
                <View style={styles.detailText}>
                  <ThemedText style={styles.detailLine}>
                    {event.location}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <View style={styles.pesoBadge}>
                    <ThemedText style={styles.pesoBadgeText}>$</ThemedText>
                  </View>
                </View>
                <View style={styles.detailText}>
                  <ThemedText style={styles.detailLine}>
                    {formatPeso(event.price)}
                  </ThemedText>
                </View>
              </View>

              {event.tables.length > 0 ? (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="people-outline" size={28} color={PURPLE} />
                  </View>
                  <View style={styles.detailText}>
                    <ThemedText style={styles.detailLine}>
                      Tables are available
                    </ThemedText>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.divider} />

            {/* About */}
            <ThemedText style={styles.aboutTitle}>About this event</ThemedText>
            <ThemedText style={styles.aboutBody}>
              {event.description}
            </ThemedText>

            {/* CTA */}
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
          </ScrollView>
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
    paddingRight: 26,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 10,
    color: PURPLE,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
  },
  notFound: { textAlign: "center", marginTop: 64, fontSize: 16 },

  content: {
    paddingHorizontal: MARGIN,
    paddingTop: 16,
    paddingBottom: 25,
  },

  // Carousel
  carousel: {
    height: CAROUSEL_HEIGHT,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#EEEBF5",
  },
  dots: {
    position: "absolute",
    bottom: 22,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  dotActive: { width: 30, backgroundColor: "#FFFFFF" },

  // Title + host
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 26,
  },
  avatar: {
    width: 69,
    height: 69,
    borderRadius: 35,
    backgroundColor: "#EEEBF5",
  },
  titleText: { flex: 1 },
  title: { fontSize: 32, lineHeight: 40, fontWeight: "800" },
  host: { fontSize: 18, lineHeight: 32 },

  // Details
  details: { marginTop: 17, gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 13 },
  dateRow: { marginBottom: -6 },
  detailIcon: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: { flex: 1 },
  detailLine: { fontSize: 18, lineHeight: 32 },
  pesoBadge: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  pesoBadgeText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
  },

  divider: { height: 1, backgroundColor: "#D9D9DC", marginTop: 16 },

  // About
  aboutTitle: {
    marginTop: 15,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  aboutBody: { marginTop: 2, fontSize: 16, lineHeight: 32 },

  // CTA
  cta: {
    marginTop: 25,
    height: 59,
    borderRadius: 30,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
  },
  pressed: { opacity: 0.85 },
});
