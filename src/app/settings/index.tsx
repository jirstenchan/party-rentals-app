import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LogoutConfirmationModal } from "@/components/settings/logout-confirmation-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const PURPLE = BrandColors.purple;
const PURPLE_TINT = "#F4EFFD";

// Sections and rows (UI only for now)
const SECTIONS = [
  {
    title: "Account",
    items: [
      {
        id: "personal",
        label: "Personal Information",
        icon: "person-outline",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        id: "privacy",
        label: "Account Privacy",
        icon: "lock-closed-outline",
      },
      {
        id: "data",
        label: "Data & Permissions",
        icon: "shield-checkmark-outline",
      },
    ],
  },
  {
    title: "Support & Legal",
    items: [
      {
        id: "help",
        label: "Help & Support",
        icon: "help-circle-outline",
      },
      {
        id: "terms",
        label: "Terms & Policies",
        icon: "document-text-outline",
      },
    ],
  },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [logoutVisible, setLogoutVisible] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color={PURPLE} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>SETTINGS</ThemedText>
        </View>

        {/* TODO: hook up each row to its screen */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                {section.title}
              </ThemedText>

              {section.items.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Ionicons name={item.icon} size={26} color={theme.text} />

                  <ThemedText style={styles.rowLabel} numberOfLines={1}>
                    {item.label}
                  </ThemedText>

                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={theme.text}
                  />
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Log Out */}
        <View style={styles.footer}>
          <Pressable
            onPress={() => setLogoutVisible(true)}
            style={({ pressed }) => [
              styles.logOut,
              pressed && styles.logOutPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Log Out"
          >
            <Ionicons name="log-out-outline" size={32} color={PURPLE} />
            <ThemedText style={styles.logOutText}>Log Out</ThemedText>
          </Pressable>
        </View>

        {/* Confirmation modal handles signing out */}
        <LogoutConfirmationModal
          visible={logoutVisible}
          onCancel={() => setLogoutVisible(false)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    color: PURPLE,
    fontSize: 26,
    lineHeight: 40,
    fontWeight: "800",
  },

  // Sections
  scroll: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: Spacing.three,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: "700",
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 28,
    fontWeight: "500",
  },

  // Log Out
  footer: {
    paddingBottom: 24,
  },
  logOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 64,
    borderRadius: 20,
    backgroundColor: PURPLE_TINT,
  },
  logOutPressed: {
    backgroundColor: "#E2D5FA",
    transform: [{ scale: 0.98 }],
  },
  logOutText: {
    color: PURPLE,
    fontSize: 20,
    lineHeight: 32,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
