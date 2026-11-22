import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { AccountTier } from "@/lib/account-api";

export function AccountSettingsPage({
  title,
  children,
  refreshing = false,
  onRefresh,
}: {
  title: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/settings")
            }
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={BrandColors.purple}
            />
          </Pressable>
          <ThemedText style={styles.heading}>{title}</ThemedText>
        </View>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

export function AccountCard({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme.backgroundSelected }]}>
      {children}
    </View>
  );
}

export function AccountButton({
  label,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (pressed || disabled || busy) && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? BrandColors.purple : "#fff"} />
      ) : (
        <ThemedText
          style={[styles.buttonText, secondary && styles.secondaryText]}
        >
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

export function AccountField({
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType,
  error,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: error ? BrandColors.error : theme.textSecondary,
            backgroundColor: editable
              ? theme.background
              : theme.backgroundElement,
          },
        ]}
      />
      {error && <AccountMessage error>{error}</AccountMessage>}
    </View>
  );
}

export function AccountMessage({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <ThemedText
      accessibilityLiveRegion="polite"
      style={error ? styles.error : styles.message}
    >
      {children}
    </ThemedText>
  );
}

const TIERS = {
  basic: {
    label: "Basic",
    icon: "person-outline",
    color: "#5A4275",
    background: "#F1EAF8",
  },
  verified_guest: {
    label: "Verified guest",
    icon: "shield-checkmark-outline",
    color: "#166534",
    background: "#DCFCE7",
  },
  verified_host: {
    label: "Verified host",
    icon: "ribbon-outline",
    color: "#5B21B6",
    background: "#EDE9FE",
  },
} as const;

export function AccountTierBadge({ tier }: { tier: AccountTier }) {
  const info = TIERS[tier];
  if (!info) return null;
  return (
    <View
      accessibilityLabel={`Account tier: ${info.label}`}
      style={[styles.badge, { backgroundColor: info.background }]}
    >
      <Ionicons name={info.icon} size={17} color={info.color} />
      <ThemedText style={[styles.badgeText, { color: info.color }]}>
        {info.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
  },
  heading: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: BrandColors.purple,
  },
  content: { paddingHorizontal: 24, paddingBottom: 40, gap: 18 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 16 },
  button: {
    minHeight: 50,
    padding: 12,
    borderRadius: 12,
    backgroundColor: BrandColors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    borderWidth: 1,
    borderColor: BrandColors.purple,
    backgroundColor: "transparent",
  },
  buttonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  secondaryText: { color: BrandColors.purple },
  dimmed: { opacity: 0.55 },
  field: { gap: 8 },
  label: { fontWeight: "600", fontSize: 15 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  error: { color: BrandColors.error, fontSize: 14 },
  message: { fontSize: 14 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeText: { fontWeight: "700", fontSize: 13, lineHeight: 20 },
});
