import { createThemeStyles } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LogoutConfirmationModal } from "@/components/settings/logout-confirmation-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Radius, Spacing } from "@/constants/theme";

// Account rows lead to the same personal details and verification flow as the website.
const SECTIONS = [
  {
    title: "Account",
    items: [
      {
        id: "personal",
        label: "Personal Information",
        icon: "person-outline",
      },
      {
        id: "verification",
        label: "Account Verification",
        icon: "id-card-outline",
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
  const { theme, styles } = useStyles();
  const router = useRouter();
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
            <Ionicons name="chevron-back" size={28} color={theme.accent} />
          </Pressable>

          <ThemedText style={styles.headerTitle}>SETTINGS</ThemedText>
        </View>

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
                  onPress={
                    item.id === "personal"
                      ? () => router.push("/settings/personal-information")
                      : item.id === "verification"
                        ? () => router.push("/settings/verify-identity")
                        : undefined
                  }
                >
                  <Ionicons name={item.icon} size={22} color={theme.text} />

                  <ThemedText style={styles.rowLabel} numberOfLines={1}>
                    {item.label}
                  </ThemedText>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
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
            <Ionicons name="log-out-outline" size={28} color={theme.accent} />
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


const useStyles = createThemeStyles((theme) => StyleSheet.create({
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
    color: theme.accent,
    fontSize: 22,
    lineHeight: 30,
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
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 55,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "500",
  },

  // Log Out
  footer: {
    paddingBottom: 22,
  },
  logOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 55,
    borderRadius: Radius.medium,
    backgroundColor: theme.accentSurface,
  },
  logOutPressed: {
    backgroundColor: theme.accentSurfacePressed,
    transform: [{ scale: 0.98 }],
  },
  logOutText: {
    color: theme.accent,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
}));
