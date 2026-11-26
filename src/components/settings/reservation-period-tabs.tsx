import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Radius, Spacing } from "@/constants/theme";

const PERIODS = ["Upcoming", "History"] as const;
export type ReservationPeriod = (typeof PERIODS)[number];

export function ReservationPeriodTabs({
  period,
  onChange,
  style,
}: {
  period: ReservationPeriod;
  onChange: (period: ReservationPeriod) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ThemedView
      type="backgroundElement"
      accessibilityRole="tablist"
      style={[styles.tabs, style]}
    >
      {PERIODS.map((label) => (
        <Pressable
          key={label}
          onPress={() => {
            if (period !== label) onChange(label);
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: period === label }}
          style={[styles.tab, period === label && styles.selectedTab]}
        >
          <ThemedText
            type="smallBold"
            style={period === label ? styles.selectedLabel : undefined}
          >
            {label}
          </ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    borderRadius: Radius.medium,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
  },
  selectedTab: { backgroundColor: BrandColors.purple },
  selectedLabel: { color: BrandColors.white },
});
