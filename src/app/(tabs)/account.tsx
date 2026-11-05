import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventList } from "@/components/event/event-list";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, BrandColors, Spacing } from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";

const PURPLE = BrandColors.purple;
const PURPLE_TINT = "#F1EDFC";

// Quick actions row (UI)
const QUICK_ACTIONS = [
  { id: "tickets", label: "My Tickets", icon: "ticket-outline" },
  { id: "events", label: "My Events", icon: "calendar-outline" },
  { id: "saved", label: "Saved", icon: "heart-outline" },
] as const;

export default function AccountScreen() {
  const profile = useProfile();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed part: stays put */}
        <ThemedView style={styles.profile}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>PROFILE</ThemedText>
            {/* TODO: hook up the settings screen */}
            <Pressable
              onPress={() => router.push("/settings")}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={30} color={PURPLE} />
            </Pressable>
          </View>

          {/* Avatar + name */}
          <View style={styles.userRow}>
            {/* TODO: show the user's photo here once the profile has one */}
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={PURPLE} />
            </View>

            <View style={styles.userInfo}>
              <ThemedText style={styles.name} numberOfLines={1}>
                {profile?.email}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.handle}>
                Role: {profile?.role}
              </ThemedText>
              {/* TODO: replace the placeholder with the real location */}
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={22}
                  color="#000"
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
              <ThemedText style={styles.statNumber}>12</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                Events
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <ThemedText style={styles.statNumber}>8</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                Reservations
              </ThemedText>
            </View>
          </View>

          {/* Quick actions */}
          {/* TODO: hook up each action to its screen */}
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.id}
                style={styles.action}
                accessibilityRole="button"
                accessibilityLabel={a.label}
              >
                <View style={styles.actionCircle}>
                  <Ionicons name={a.icon} size={30} color={PURPLE} />
                </View>
                <ThemedText style={styles.actionLabel}>{a.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Edit Profile */}
          {/* TODO: hook up the edit profile screen */}
          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="pencil-outline" size={22} color={PURPLE} />
            <ThemedText style={styles.editText}>Edit Profile</ThemedText>
          </Pressable>

          {/* History header */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>History</ThemedText>
            {/* TODO: hook up the full history screen */}
            <Pressable style={styles.seeAll} hitSlop={8}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={PURPLE} />
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

const styles = StyleSheet.create({
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
    color: PURPLE,
    fontSize: 26,
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
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: PURPLE,
    backgroundColor: PURPLE_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "800",
  },
  handle: {
    fontSize: 17,
    color: "#716D78",
    lineHeight: 24,
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
    fontSize: 17,
    lineHeight: 24,
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
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 17,
    color: "#716D78",
    lineHeight: 24,
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: PURPLE_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 16,
    lineHeight: 22,
  },

  // Edit Profile
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 44,
    borderRadius: 16,
    backgroundColor: PURPLE_TINT,
    marginTop: Spacing.two,
  },
  editText: {
    color: PURPLE,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600",
  },

  // History
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 36,
    fontWeight: "800",
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    color: PURPLE,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },

  // Button
  pressed: {
    opacity: 0.85,
  },
});
