import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import { useCallback, useEffect, useState } from "react";

const PURPLE = BrandColors.purple;
const BORDER = BrandColors.border;
const MUTED = BrandColors.muted;
const WHITE = BrandColors.white;
const MARGIN = 25;
const ICON_SIZE = 38;

const formatPrice = (price: number) =>
  price === 0 ? "Free" : `$${price.toFixed(2)}`;

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
  if (t.salesEnd) return `Onsale until ${formatDay(t.salesEnd)}`;
  return null;
};

const isOnSale = (t: EventTicketDto) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (t.salesStart && parseDay(t.salesStart) > today) return false;
  if (t.salesEnd && parseDay(t.salesEnd) > today) return false;
  return true;
};

function BuyButton({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
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
        Buy
      </ThemedText>
    </Pressable>
  );
}

export default function VenueMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [refresh, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setError(null);
      setEvent(await fetchEvent(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading)
    return (
      <>
        <Stack.Screen options={{ title: "Loading..." }} />
        <ActivityIndicator style={styles.loading} />
      </>
    );

  if (!event)
    return (
      <ThemedView>
        <ThemedText>{error ?? "Event not found."}</ThemedText>
      </ThemedView>
    );

  const tickets = event.tickets ?? [];
  // TODO: navigate to checkout when the Buy screen is ready, e.g.
  // router.push({ pathname: "/buy", params: { eventId: id, itemId } })

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

        {!event ? (
          <ThemedText themeColor="textSecondary" style={styles.notFound}>
            This event could not be found.
          </ThemedText>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Floor plan (the image uploaded in Create Event) */}
            <View style={styles.mapFrame}>
              {event.mapUrl ? (
                <Image
                  source={{ uri: event.mapUrl }}
                  style={styles.mapImage}
                  resizeMode="cover"
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
              <ThemedText type="small">No tickets available yet.</ThemedText>
            ) : (
              tickets.map((ticket) => {
                const label = salesLabel(ticket);
                const canBuy = isOnSale(ticket);
                return (
                  <ThemedView
                    key={ticket.ticketId}
                    type="backgroundElement"
                    style={styles.card}
                  >
                    <ThemedText>{ticket.name}</ThemedText>
                    <ThemedText type="small">
                      {formatPrice(ticket.ticketPrice)}
                    </ThemedText>
                    {label ? (
                      <ThemedText type="small">{label}</ThemedText>
                    ) : null}
                    <Pressable
                      disabled={!canBuy}
                      onPress={() =>
                        router.push({
                          pathname: "/buy",
                          params: {
                            eventId: event.id,
                            ticketId: ticket.ticketId,
                          },
                        })
                      }
                      style={({ pressed }) => [
                        styles.buy,
                        !canBuy && styles.buy,
                        pressed && styles.buy,
                      ]}
                    >
                      <ThemedText>Buy</ThemedText>
                    </Pressable>
                  </ThemedView>
                );
              })
            )}

            {/* Tables */}
            {/* {event.tables.length > 0 ? (
              <>
                <ThemedText style={[styles.sectionTitle, styles.sectionGap]}>
                  Tables
                </ThemedText>
                <View style={styles.cards}>
                  {event.tables.map((table) => {
                    const isFull = table.seatsTaken >= table.seats;
                    return (
                      <View key={table.id} style={styles.card}>
                        <Image
                          source={require("../../../assets/images/table-icon.png")}
                          style={[
                            styles.tableIcon,
                            isFull && styles.tableIconFull,
                          ]}
                          resizeMode="contain"
                        />
                        <View style={styles.cardInfo}>
                          <ThemedText
                            style={[
                              styles.cardName,
                              isFull && { color: MUTED },
                            ]}
                            numberOfLines={1}
                          >
                            {table.name}
                          </ThemedText>
                          <ThemedText
                            style={[styles.cardSub, isFull && { color: MUTED }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                          >
                            {table.seatsTaken}/{table.seats} seats ·{" "}
                            {formatPeso(table.pricePerSeat)} each
                          </ThemedText>
                        </View>
                        <BuyButton
                          disabled={isFull}
                          label={
                            isFull
                              ? `${table.name} is full`
                              : `Buy ${table.name}`
                          }
                          onPress={() => handleBuy(table.id)}
                        />
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null} */}
          </ScrollView>
        )}
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
  notFound: { textAlign: "center", marginTop: 64, fontSize: 16 },

  content: {
    paddingHorizontal: MARGIN,
    paddingTop: 4,
    paddingBottom: 40,
  },

  // Map
  mapFrame: {
    width: "100%", // The size depends on the size of the map
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: Radius.large,
    overflow: "hidden",
    backgroundColor: WHITE,
  },
  mapImage: { width: "100%", height: 200, borderRadius: 12 },
  noMap: { alignItems: "center", justifyContent: "center" },

  // Sections
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 3,
    color: PURPLE,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700",
  },
  sectionGap: { marginTop: 32 },
  cards: { gap: 14 },

  // Ticket / table card
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  tableIcon: { width: ICON_SIZE, height: ICON_SIZE },
  tableIconFull: { opacity: 0.4 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "700" },
  cardSub: { fontSize: 12, color: MUTED, marginTop: 0 },

  // Buy
  buy: {
    backgroundColor: PURPLE,
    borderRadius: Radius.small,
    paddingHorizontal: 20,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  buyDisabled: { backgroundColor: MUTED },
  buyText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: "700",
  },
  buyTextDisabled: { color: WHITE },
  pressed: { opacity: 0.85 },
});
