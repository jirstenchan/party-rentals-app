import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { EventDetailDto, EventTableDto, fetchEvent } from "@/lib/events-api";

const formatPrice = (price: number) =>
  price === 0 ? "Free" : `$${price.toFixed(2)}`;

export default function BuyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log("buy params", params);
  const { eventId, tableId } = useLocalSearchParams<{
    eventId: string;
    tableId: string;
  }>();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [table, setTable] = useState<EventTableDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guests, setGuests] = useState<string[]>([]);
  const [inputName, setInputName] = useState("");

  const isFull = table !== null && guests.length >= table.capacity;

  // text submission handler
  const handleAddGuest = () => {
    if (!inputName.trim() || isFull) return;

    setGuests([...guests, inputName.trim()]);
    setInputName(""); // Clear input field
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const e = await fetchEvent(eventId);
        if (cancelled) return;
        setEvent(e);
        setTable(e.tables?.find((t) => t.tableId === tableId) ?? null);
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
  }, [eventId, tableId]);

  if (loading) return <ActivityIndicator style={styles.loading} />;

  if (!event || !table) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: "Buy table" }} />
        <ThemedText type="small" style={styles.center}>
          {error ?? "Table not found."}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Buy table" }} />
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

          {/* Guest Collection UI Section */}
          <View style={styles.guestSection}>
            <ThemedText type="small" style={{ marginBottom: Spacing.one }}>
              Table Capacity: {guests.length} / {table.capacity}
            </ThemedText>

            <View style={styles.inputContainer}>
              <TextInput
                value={inputName}
                onChangeText={setInputName}
                editable={!isFull} //disables input when table is full aka true
                placeholder={isFull ? "Table is full" : "Enter guest name"}
                placeholderTextColor="#888"
                onSubmitEditing={handleAddGuest} // Submits when user clicks Done/Return on keyboard
                returnKeyType="done"
                style={[styles.input, isFull && styles.disabledInput]}
              />
              <Pressable
                onPress={handleAddGuest}
                disabled={isFull} // disables button when true
                style={({ pressed }) => [
                  styles.addButton,
                  isFull && styles.disabledButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ThemedText style={styles.addButtonText}>Add</ThemedText>
              </Pressable>
            </View>

            {/* Guest List Display */}
            <View style={styles.listContainer}>
              {guests.map((guest, idx) => (
                <ThemedText key={idx} style={styles.listItem}>
                  • {guest}
                </ThemedText>
              ))}
            </View>
          </View>
        </ThemedView>
      </ScrollView>

      <ThemedView
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.three },
        ]}
      >
        <Pressable
          onPress={() =>
            router.push({ pathname: "/payment", params: { tableId } })
          }
          style={({ pressed }) => [
            styles.payButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={styles.payButtonText}>Proceed to pay</ThemedText>
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
  payButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: "#208AEF",
    alignItems: "center",
  },
  payButtonText: { color: "#fff", fontWeight: "600" },

  // New Native Layout Styles
  guestSection: { marginTop: Spacing.two },
  inputContainer: {
    flexDirection: "row",
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    height: 40,
    color: "#000",
    backgroundColor: "#fff",
  },
  disabledInput: { backgroundColor: "#f0f0f0", borderColor: "#e0e0e0" },
  addButton: {
    backgroundColor: "#208AEF",
    paddingHorizontal: Spacing.three,
    justifyContent: "center",
    borderRadius: Spacing.one,
    height: 40,
  },
  disabledButton: { backgroundColor: "#b0d4fa" },
  addButtonText: { color: "#fff", fontWeight: "600" },
  listContainer: { marginTop: Spacing.two, gap: 4 },
  listItem: { fontSize: 14 },
});
