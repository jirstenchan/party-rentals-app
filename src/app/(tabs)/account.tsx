import { createThemeStyles } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventList } from "@/components/event/event-list";
import { AccountTierBadge } from "@/components/settings/account-controls";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";
import { fetchEvents } from "@/lib/events-api";
import { fetchMyReservations } from "@/lib/reservation-api";
import { useCallback, useState } from "react";


// Quick actions row (UI)
const QUICK_ACTIONS = [
  { id: "tickets", label: "My Tickets", icon: "ticket-outline" },
  { id: "tables", label: "My Tables", icon: "grid-outline" },
  { id: "events", label: "My Events", icon: "calendar-outline" },
  { id: "saved", label: "Saved", icon: "heart-outline" },
] as const;

export default function AccountScreen() {
  const { theme, styles } = useStyles();
  const profile = useProfile();
  const router = useRouter();

  const [eventCount, setEventCount] = useState<number | null>(null);
  const [reservationCount, setReservationCount] = useState<number | null>(null);

  //Getting the total number of events created by the user logged in
  useFocusEffect(
    useCallback(() => {
      let active = true;

      fetchEvents("mine")
        .then((events) => {
          if (active) setEventCount(events.length);
        })
        .catch(() => {
          if (active) setEventCount(null);
        });

      return () => {
        active = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      Promise.allSettled([fetchEvents("mine"), fetchMyReservations()]).then(
        ([events, reservations]) => {
          if (!active) return;
          setEventCount(
            events.status === "fulfilled" ? events.value.length : null,
          );
          setReservationCount(
            reservations.status === "fulfilled"
              ? new Set(
                  reservations.value
                    .filter((r) =>
                      r.reservationStatus === "Pending" || r.reservationStatus === "Confirmed",
                    )
                    .map((r) => r.reservationId),
                ).size
              : null,
          );
        },
      );

      return () => {
        active = false;
      };
    }, []),
  );

  const name = profile?.host_name || profile?.name || "User";

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed part: stays put */}
        <ThemedView style={styles.profile}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>PROFILE</ThemedText>
            {/* Hook up the settings screen */}
            <Pressable
              onPress={() => router.push("/settings")}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={30} color={theme.accent} />
            </Pressable>
          </View>

          {/* Avatar + name */}
          <View style={styles.userRow}>
            {/* Show the user's photo here once the profile has one */}
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  accessibilityLabel={name}
                />
              ) : (
                <Text style={styles.avatarLetter}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <View style={styles.userInfo}>
              <ThemedText style={styles.name} numberOfLines={2}>
                {name}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.handle}>
                Role: {profile?.role}
              </ThemedText>
              {profile && (
                <Pressable
                  onPress={() => router.push("/settings/verify-identity")}
                  accessibilityRole="button"
                  accessibilityLabel="View account verification"
                >
                  <AccountTierBadge tier={profile.tier} />
                </Pressable>
              )}
              {/* TODO: replace the placeholder with the real location */}
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={22}
                  color={theme.textSecondary}
                  style={styles.locationIcon}
                />
                <ThemedText style={styles.location}>Cebu City</ThemedText>
              </View>
            </View>
          </View>

          {/* Stats */}
          {/* TODO: replace the placeholder numbers with real counts */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <ThemedText style={styles.statNumber}>
                {eventCount ?? "–"}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                Events
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={styles.statNumber}>
                {reservationCount ?? "–"}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                Reservations
              </ThemedText>
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.id}
                style={styles.action}
                onPress={
                  a.id === "tickets"
                    ? () => router.push("/my-tickets")
                    : a.id === "tables"
                      ? () => router.push("/my-tables")
                      : undefined
                }
                accessibilityRole="button"
                accessibilityLabel={a.label}
              >
                <View style={styles.actionCircle}>
                  <Ionicons name={a.icon} size={30} color={theme.accent} />
                </View>
                <ThemedText style={styles.actionLabel}>{a.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Edit Profile */}
          <Pressable
            onPress={() => router.push("/settings/personal-information")}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="pencil-outline" size={22} color={theme.accent} />
            <ThemedText style={styles.editText}>Edit Profile</ThemedText>
          </Pressable>

          {/* History header */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>My Events</ThemedText>
            {/* TODO: hook up the full history screen */}
            <Pressable style={styles.seeAll} hitSlop={8}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={theme.accent} />
            </Pressable>
          </View>
        </ThemedView>

        {/* Only this part scrolls */}
        <EventList
          scope="mine"
          showStatus
          emptyText="You haven't created any events yet."
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset,
    gap: Spacing.three,
  },
  profile: { gap: Spacing.three },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.three,
  },
  headerTitle: {
    color: theme.accent,
    fontSize: 22,
    lineHeight: 40,
    fontWeight: "800",
  },

  // Avatar + name
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    borderWidth: 3,
    borderColor: theme.accent,
    backgroundColor: theme.accentSurface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden", // clips the image to the circle
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.accent,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 22,
    lineHeight: 34,
    fontWeight: "800",
  },
  handle: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 18,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationIcon: {
    marginLeft: -4,
  },
  location: {
    fontSize: 16,
    lineHeight: 18,
  },

  // Stats (Events & Reservations)
  statsRow: {
    flexDirection: "row",
    gap: 62,
    paddingLeft: 12,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 18,
    fontWeight: "500",
  },

  // Quick actions (My Tickets, My Events, Saved)
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.two,
  },
  action: {
    alignItems: "center",
    gap: 8,
  },
  actionCircle: {
    width: 40,
    height: 40,
    borderRadius: 27,
    backgroundColor: theme.accentSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 14,
    lineHeight: 18,
  },

  // Edit Profile
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 40,
    borderRadius: Radius.small,
    backgroundColor: theme.accentSurface,
    marginTop: Spacing.two,
  },
  editText: {
    color: theme.accent,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "600",
    transform: [{ translateX: -5 }],
  },

  // History
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "800",
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    color: theme.accent,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },

  // Button
  pressed: {
    opacity: 0.85,
  },
}));
