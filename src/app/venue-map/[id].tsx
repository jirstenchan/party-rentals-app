import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Radius, Spacing } from "@/constants/theme";
import { EventDetailDto, EventTicketDto, fetchEvent } from "@/lib/events-api";

const PURPLE = BrandColors.purple;
const BORDER = BrandColors.border;
const MUTED = BrandColors.muted;
const WHITE = BrandColors.white;
const MARGIN = 25;

// Format ticket price
const formatPrice = (price: number) =>
  price === 0 ? "Free" : `₱ ${price.toLocaleString("en-PH")}`;

// Convert date string into a Date object
const parseDay = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Format ticket sale dates
const formatDay = (day: string) =>
  parseDay(day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

// Get ticket sales status label
const salesLabel = (ticket: EventTicketDto) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (ticket.salesStart && parseDay(ticket.salesStart) > today) {
    return `On sale ${formatDay(ticket.salesStart)}`;
  }

  if (ticket.salesEnd && parseDay(ticket.salesEnd) < today) {
    return "Sales ended";
  }

  if (ticket.salesEnd) {
    return `On sale until ${formatDay(ticket.salesEnd)}`;
  }

  return null;
};

// Check if tickets are currently available for purchase
const isOnSale = (ticket: EventTicketDto) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (ticket.salesStart && parseDay(ticket.salesStart) > today) {
    return false;
  }

  if (ticket.salesEnd && parseDay(ticket.salesEnd) < today) {
    return false;
  }

  return true;
};

/** Round table with 8 chairs around it. */
function TableIcon({ color }: { color: string }) {
  const SIZE = 50;

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={[
            StyleSheet.absoluteFill,
            {
              alignItems: "center",
              transform: [{ rotate: `${i * 45}deg` }],
            },
          ]}
        >
          <View
            style={{
              width: 15,
              height: 7,
              borderRadius: 3,
              backgroundColor: color,
            }}
          />
        </View>
      ))}

      <View
        style={{
          position: "absolute",
          top: 9,
          left: 9,
          width: SIZE - 18,
          height: SIZE - 18,
          borderRadius: (SIZE - 18) / 2,
          borderWidth: 1,
          borderColor: color,
        }}
      />
    </View>
  );
}

// Buy button
function BuyButton({
  disabled,
  label,
  text = "Buy",
  onPress,
}: {
  disabled?: boolean;
  label: string;
  text?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.buy,
        disabled && styles.buyDisabled,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={label}
    >
      <ThemedText style={[styles.buyText, disabled && styles.buyTextDisabled]}>
        {text}
      </ThemedText>
    </Pressable>
  );
}

export default function VenueMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Shape (width / height) of the uploaded map, read when the image loads
  const [mapRatio, setMapRatio] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void fetchEvent(id)
        .then((result) => {
          if (!active) return;
          setEvent(result);
          setError(null);
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [id]),
  );

  // Loading screen
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Loading..." }} />
        <ActivityIndicator style={styles.loading} />
      </>
    );
  }

  // Event not found or failed to load
  if (!event) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={PURPLE} />
            </Pressable>

            <ThemedText style={styles.headerTitle}>VENUE MAP</ThemedText>
          </View>

          <ThemedText themeColor="textSecondary" style={styles.notFound}>
            {error ?? "This event could not be found."}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const tickets = event.tickets ?? [];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        {/* Fixed header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={PURPLE} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>VENUE MAP</ThemedText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Floor plan uploaded in Create Event */}
          <View style={styles.mapFrame}>
            {event.mapUrl ? (
              <Image
                source={{ uri: event.mapUrl }}
                style={[styles.mapImage, { aspectRatio: mapRatio ?? 3 / 2 }]}
                resizeMode="contain"
                onLoad={(e) => {
                  const { width, height } = e.nativeEvent.source;
                  if (width && height) setMapRatio(width / height);
                }}
                accessibilityLabel={`${event.name} floor plan`}
              />
            ) : (
              <View style={[styles.mapImage, styles.noMap]}>
                <ThemedText themeColor="textSecondary">
                  No venue map uploaded for this event.
                </ThemedText>
              </View>
            )}
          </View>

          {/* Tickets */}
          <ThemedText style={styles.sectionTitle}>Tickets</ThemedText>

          {tickets.length === 0 ? (
            <ThemedText themeColor="textSecondary">
              No tickets available yet.
            </ThemedText>
          ) : (
            <View style={styles.cards}>
              {tickets.map((ticket) => {
                const label = salesLabel(ticket);
                const canBuy = isOnSale(ticket);

                return (
                  <View key={ticket.ticketId} style={styles.card}>
                    <View style={styles.cardIcon}>
                      <Ionicons
                        name="ticket-outline"
                        size={46}
                        color={PURPLE}
                      />
                    </View>

                    <View style={styles.cardInfo}>
                      <ThemedText style={styles.cardName} numberOfLines={1}>
                        {ticket.name}
                      </ThemedText>

                      <ThemedText style={styles.cardSub}>
                        {formatPrice(ticket.ticketPrice)}
                      </ThemedText>

                      {label ? (
                        <ThemedText style={styles.cardSub}>{label}</ThemedText>
                      ) : null}
                    </View>

                    <BuyButton
                      disabled={!canBuy}
                      label={`Buy ${ticket.name}`}
                      onPress={() =>
                        router.push({
                          pathname: "/buy",
                          params: {
                            eventId: event.id,
                            ticketId: ticket.ticketId,
                          },
                        })
                      }
                    />
                  </View>
                );
              })}
            </View>
          )}

          {event.tables.length > 0 && (
            <>
              <ThemedText style={styles.sectionTitle}>Tables</ThemedText>
              <View style={styles.cards}>
                {event.tables.map((table) => {
                  const available = table.status === "Available";
                  return (
                    <View key={table.tableId} style={styles.card}>
                      <View style={styles.cardIcon}>
                        <TableIcon color={PURPLE} />
                      </View>
                      <View style={styles.cardInfo}>
                        <ThemedText style={styles.cardName}>{table.label}</ThemedText>
                        <ThemedText style={styles.cardSub}>
                          {formatPrice(table.tablePrice)}
                        </ThemedText>
                        {table.capacity !== null && (
                          <ThemedText style={styles.cardSub}>
                            {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
                          </ThemedText>
                        )}
                      </View>
                      <BuyButton
                        disabled={!available}
                        label={
                          available
                            ? `Reserve ${table.label}`
                            : `${table.label} is reserved`
                        }
                        text={available ? "Reserve" : "Reserved"}
                        onPress={() =>
                          router.push({
                            pathname: "/tableBuy",
                            params: { eventId: event.id, tableId: table.tableId },
                          })
                        }
                      />
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loading: { marginTop: Spacing.five },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingLeft: 16,
    paddingRight: 26,
    gap: 20,
  },
  headerTitle: {
    color: PURPLE,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
  },
  notFound: {
    textAlign: "center",
    marginTop: 64,
    fontSize: 16,
  },

  content: {
    paddingHorizontal: MARGIN,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Map
  mapFrame: {
    marginHorizontal: 3,
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: Radius.large,
    overflow: "hidden",
    backgroundColor: WHITE,
  },
  mapImage: {
    width: "100%",
    aspectRatio: 3 / 2, // fallback; the photo uses mapRatio once it loads
  },
  noMap: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Sections
  sectionTitle: {
    marginTop: 22,
    marginBottom: 20,
    marginLeft: 3,
    color: PURPLE,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
  },
  sectionGap: { marginTop: 22 },
  cards: { gap: 18 },

  // Ticket / table card
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 84,
    paddingLeft: 13,
    paddingRight: 19,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardIcon: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 13,
    color: "#77737F",
  },

  // Buy
  buy: {
    width: 66,
    height: 28,
    borderRadius: Radius.medium,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  buyDisabled: { backgroundColor: MUTED },
  buyText: {
    color: WHITE,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  buyTextDisabled: { color: "#EDEDEF" },
  pressed: { opacity: 0.85 },
});
