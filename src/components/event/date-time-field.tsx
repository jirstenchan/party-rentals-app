// src/components/date-time-field.tsx
// Install first:  npx expo install @react-native-community/datetimepicker
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { createElement } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time
const toWebValue = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const display = (d: Date) =>
  d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function DateTimeField({ label, value, onChange }: Props) {
  // Android has no combined picker: open the date dialog, then the time dialog.
  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value,
      mode: "date",
      // onValueChange only fires when the user confirms; cancelling fires onDismiss instead
      onValueChange: (_, picked) => {
        if (!picked) return;
        DateTimePickerAndroid.open({
          value: picked,
          mode: "time",
          onValueChange: (__, withTime) => {
            if (withTime) onChange(withTime);
          },
        });
      },
    });
  };

  return (
    <ThemedView style={styles.field}>
      <ThemedText type="small">{label}</ThemedText>

      {Platform.OS === "ios" && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="compact"
          onValueChange={(_, d) => d && onChange(d)}
          style={styles.iosPicker}
        />
      )}

      {Platform.OS === "android" && (
        <Pressable onPress={openAndroid} style={styles.button}>
          <ThemedText>{display(value)}</ThemedText>
        </Pressable>
      )}

      {Platform.OS === "web" &&
        createElement("input", {
          type: "datetime-local",
          value: toWebValue(value),
          onChange: (e: any) => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onChange(d);
          },
          style: { padding: 12, fontSize: 16, borderRadius: 12 },
        })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one, alignItems: "flex-start" },
  iosPicker: { alignSelf: "flex-start" },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
