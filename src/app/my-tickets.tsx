import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountButton } from "@/components/settings/account-controls";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fetchMyTickets, type MyTicket } from "@/lib/reservation-api";

const FILTERS = ["All", "Pending", "Confirmed"] as const;
const STATUS = {
  Pending: {
    icon: "time-outline",
    color: "#854D0E",
    background: "#FEF3C7",
  },
  Confirmed: {
    icon: "checkmark-circle-outline",
    color: "#166534",
    background: "#DCFCE7",
  },
} as const;

const eventDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});
const ticketPrice = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function TicketCard({ ticket }: { ticket: MyTicket }) {
  const theme = useTheme();
  const status = STATUS[ticket.reservationStatus];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconTile}>
          <Ionicons name="ticket-outline" size={22} color={BrandColors.purple} />
        </View>
        <View style={styles.ticketDetails}>
          <ThemedText style={styles.eventName}>{ticket.eventName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {ticket.itemName || "Event ticket"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.dateRow}>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={theme.textSecondary}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.date}>
          {eventDate.format(new Date(ticket.eventStartTime))}
        </ThemedText>
      </View>

      <View style={[styles.cardFooter, { borderColor: theme.backgroundSelected }]}>
        <View style={[styles.status, { backgroundColor: status.background }]}>
          <Ionicons name={status.icon} size={16} color={status.color} />
          <ThemedText type="smallBold" style={{ color: status.color }}>
            {ticket.reservationStatus}
          </ThemedText>
        </View>
        <ThemedText type="smallBold">
          {ticket.unitPrice === 0 ? "Free" : ticketPrice.format(ticket.unitPrice)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export default function MyTicketsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [tickets, setTickets] = useState<MyTicket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef<AbortController | null>(null);

  const loadTickets = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(false);

    try {
      const rows = await fetchMyTickets(controller.signal);
      if (!controller.signal.aborted) setTickets(rows);
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTickets();
      return () => request.current?.abort();
    }, [loadTickets]),
  );

  const hasTickets = !!tickets?.length;
  const visibleTickets =
    filter === "All"
      ? (tickets ?? undefined)
      : tickets?.filter((ticket) => ticket.reservationStatus === filter);

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.page}>
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/account")
            }
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.iconButton}
          >
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </Pressable>
          <ThemedText accessibilityRole="header" style={styles.heading}>
            My Tickets
          </ThemedText>
          <Pressable
            onPress={loadTickets}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Refresh tickets"
            accessibilityState={{ disabled: loading, busy: loading }}
            style={styles.iconButton}
          >
            {loading && tickets !== null ? (
              <ActivityIndicator color={theme.textSecondary} />
            ) : (
              <Ionicons name="refresh" size={22} color={theme.textSecondary} />
            )}
          </Pressable>
        </View>

        {hasTickets && (
          <ThemedView type="backgroundElement" style={styles.filters}>
            {FILTERS.map((label) => (
              <Pressable
                key={label}
                onPress={() => setFilter(label)}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === label }}
                style={[styles.filter, filter === label && styles.selectedFilter]}
              >
                <ThemedText
                  type="smallBold"
                  style={filter === label ? styles.selectedLabel : undefined}
                >
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        )}

        {tickets === null && loading ? (
          <View style={styles.message}>
            <ActivityIndicator color={BrandColors.purple} />
            <ThemedText type="small" themeColor="textSecondary">
              Loading tickets...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            style={styles.fill}
            contentContainerStyle={styles.list}
            data={visibleTickets}
            keyExtractor={(ticket) => ticket.reservationItemId}
            renderItem={({ item }) => <TicketCard ticket={item} />}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadTickets} />
            }
            ListHeaderComponent={
              error ? (
                <View style={styles.message}>
                  <ThemedText accessibilityRole="alert" style={styles.centered}>
                    {tickets
                      ? "Couldn't refresh your tickets."
                      : "Couldn't load your tickets."}
                  </ThemedText>
                  <AccountButton
                    label="Try again"
                    onPress={loadTickets}
                    secondary
                  />
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              error ? undefined : (
                <View style={styles.message}>
                  <View style={styles.iconTile}>
                    <Ionicons
                      name="ticket-outline"
                      size={24}
                      color={BrandColors.purple}
                    />
                  </View>
                  <ThemedText style={styles.eventName}>
                    {hasTickets
                      ? `No ${filter.toLowerCase()} tickets`
                      : "No pending or confirmed tickets"}
                  </ThemedText>
                </View>
              )
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  heading: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: "800" },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    borderRadius: Radius.medium,
    padding: Spacing.one,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  filter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
  },
  selectedFilter: { backgroundColor: BrandColors.purple },
  selectedLabel: { color: BrandColors.white },
  list: { gap: Spacing.three, paddingBottom: Spacing.four },
  card: { padding: Spacing.three, borderRadius: Radius.large, gap: Spacing.three },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  iconTile: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.medium,
    backgroundColor: "#F1EDFC",
  },
  ticketDetails: { flex: 1 },
  eventName: { fontSize: 18, fontWeight: "700" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  date: { flex: 1 },
  cardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
  },
  message: {
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.three,
    marginTop: Spacing.three,
  },
  centered: { textAlign: "center" },
});
