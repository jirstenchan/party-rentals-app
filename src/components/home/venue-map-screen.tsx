import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors } from "@/constants/theme";
import { formatPeso, getEventById } from "@/data/mock-events";

const PURPLE = BrandColors.purple;
const BORDER = "#D6D6DA";
const MUTED_ICON = "#9C9AA3";
const MUTED_TEXT = "#8A8791";
const MARGIN = 25;

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
            { alignItems: "center", transform: [{ rotate: `${i * 45}deg` }] },
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
          borderWidth: 3,
          borderColor: color,
        }}
      />
    </View>
  );
}

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
  const event = getEventById(id);

  // TODO: navigate to checkout when the Buy screen is ready, e.g.
  // router.push({ pathname: "/buy", params: { eventId: id, itemId } })
  function handleBuy(_itemId: string) {}

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
              {event.venueMapUri ? (
                <Image
                  source={{ uri: event.venueMapUri }}
                  style={styles.mapImage}
                  resizeMode="contain"
                  accessibilityLabel={`${event.venueName} floor plan`}
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
            <View style={styles.cards}>
              {event.tickets.map((ticket) => (
                <View key={ticket.id} style={styles.card}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="ticket-outline" size={46} color={PURPLE} />
                  </View>
                  <View style={styles.cardInfo}>
                    <ThemedText style={styles.cardName} numberOfLines={1}>
                      {ticket.name}
                    </ThemedText>
                    <ThemedText style={styles.cardSub}>
                      {formatPeso(ticket.price)}
                    </ThemedText>
                  </View>
                  <BuyButton
                    label={`Buy ${ticket.name}`}
                    onPress={() => handleBuy(ticket.id)}
                  />
                </View>
              ))}
            </View>

            {/* Tables */}
            {event.tables.length > 0 ? (
              <>
                <ThemedText style={[styles.sectionTitle, styles.sectionGap]}>
                  Tables
                </ThemedText>
                <View style={styles.cards}>
                  {event.tables.map((table) => {
                    const isFull = table.seatsTaken >= table.seats;
                    return (
                      <View key={table.id} style={styles.card}>
                        <View style={styles.cardIcon}>
                          <TableIcon color={isFull ? MUTED_ICON : PURPLE} />
                        </View>
                        <View style={styles.cardInfo}>
                          <ThemedText
                            style={[
                              styles.cardName,
                              isFull && { color: MUTED_TEXT },
                            ]}
                            numberOfLines={1}
                          >
                            {table.name}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.cardSub,
                              isFull && { color: MUTED_TEXT },
                            ]}
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
            ) : null}
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
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Map
  mapFrame: {
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: PURPLE,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  mapImage: { width: "100%", aspectRatio: 2 / 3 },
  noMap: { alignItems: "center", justifyContent: "center" },

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
  cards: { gap: 32 },

  // Ticket / table card
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 84,
    paddingLeft: 13,
    paddingRight: 19,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardIcon: { width: 52, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, marginLeft: 14, marginRight: 8, gap: 6 },
  cardName: { fontSize: 17, lineHeight: 24, fontWeight: "700" },
  cardSub: { fontSize: 15, lineHeight: 24, color: "#77737F" },

  // Buy
  buy: {
    width: 66,
    height: 28,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  buyDisabled: { backgroundColor: "#C9C9CC" },
  buyText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  buyTextDisabled: { color: "#EDEDEF" },
  pressed: { opacity: 0.85 },
});
