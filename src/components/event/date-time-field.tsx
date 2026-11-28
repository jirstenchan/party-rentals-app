import { BrandColors } from "@/constants/theme";
import { createThemeStyles } from "@/hooks/use-theme";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { createElement, useState, type ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  containerStyle?: StyleProp<ViewStyle>;
  renderTrigger?: (open: () => void) => ReactNode;
};

const pad = (number: number) => String(number).padStart(2, "0");

const toDateValue = (date: Date) =>
  `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toTimeValue = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const toWebValue = (date: Date) =>
  `${toDateValue(date)}T${toTimeValue(date)}`;

export function parseLocalDateTime(date: string, time: string) {
  const value = `${date}T${time}`;
  const result = new Date(value);

  return !isNaN(result.getTime()) && toWebValue(result) === value ? result : null;
}

const display = (date: Date) =>
  date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export function DateTimeField({
  label,
  value,
  onChange,
  containerStyle,
  renderTrigger,
}: Props) {
  const { scheme, theme, styles } = useStyles();
  const [iosVisible, setIosVisible] = useState(false);

  const openAndroid = () => {
    DateTimePickerAndroid.open({
      value,
      mode: "date",
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

  function open() {
    if (Platform.OS === "android") {
      openAndroid();
    } else if (Platform.OS === "ios") {
      setIosVisible(true);
    }
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.field, containerStyle]}>
        {!renderTrigger && <Text style={styles.label}>{label}</Text>}

        {createElement("input", {
          type: "datetime-local",
          value: toWebValue(value),
          onChange: (event: { target: { value: string } }) => {
            const date = new Date(event.target.value);

            if (!isNaN(date.getTime())) {
              onChange(date);
            }
          },
          style: {
            padding: 12,
            fontSize: 16,
            borderRadius: 12,
            border: `1px solid ${theme.controlBorder}`,
            colorScheme: scheme,
            color: theme.text,
            backgroundColor: theme.surface,
          },
        })}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {renderTrigger ? (
        renderTrigger(open)
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>{label}</Text>

          {Platform.OS === "ios" ? (
            <DateTimePicker
              value={value}
              mode="datetime"
              display="compact"
              themeVariant={scheme}
              onValueChange={(_, date) => date && onChange(date)}
              style={styles.iosPicker}
            />
          ) : (
            <Pressable onPress={openAndroid} style={styles.button}>
              <Text style={styles.value}>{display(value)}</Text>
            </Pressable>
          )}
        </View>
      )}

      {Platform.OS === "ios" && renderTrigger && iosVisible && (
        <Modal
          transparent
          animationType="slide"
          visible
          onRequestClose={() => setIosVisible(false)}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <Text style={styles.modalTitle}>{label}</Text>

              <DateTimePicker
                value={value}
                mode="datetime"
                display="spinner"
                themeVariant={scheme}
                onValueChange={(_, date) => date && onChange(date)}
              />

              <Pressable
                onPress={() => setIosVisible(false)}
                style={styles.doneButton}
              >
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

type DateTimePartProps = {
  label: string;
  mode: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  initialDate?: string;
};

export function DateTimePartField({
  label,
  mode,
  value,
  onChange,
  initialDate,
}: DateTimePartProps) {
  const { scheme, theme, styles } = useStyles();
  const [draft, setDraft] = useState<Date | null>(null);
  const isDate = mode === "date";
  const formatValue = isDate ? toDateValue : toTimeValue;

  function pickerValue(selected: string) {
    if (!isDate) return new Date(`2000-01-01T${selected || "12:00"}`);
    return selected ? new Date(`${selected}T12:00`) : new Date();
  }

  function open() {
    const initial = pickerValue(value || initialDate || "");

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initial,
        mode,
        onValueChange: (_, selected) => onChange(formatValue(selected)),
      });
    } else if (Platform.OS === "ios") {
      setDraft(initial);
    }
  }

  if (Platform.OS === "web") {
    return createElement("input", {
      type: mode,
      "aria-label": label,
      value,
      onChange: (event: { target: { value: string } }) =>
        onChange(event.target.value),
      style: {
        minWidth: 0,
        padding: 12,
        fontSize: 15,
        borderRadius: 14,
        border: `1.5px solid ${theme.controlBorder}`,
        colorScheme: scheme,
        color: theme.text,
        backgroundColor: theme.surface,
      },
    });
  }

  let displayValue = isDate ? "Select date" : "Select time";
  if (value) {
    const selected = pickerValue(value);
    displayValue = isDate
      ? selected.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : selected.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        });
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: displayValue }}
        onPress={open}
        style={[styles.button, styles.partButton]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {displayValue}
        </Text>
      </Pressable>

      {draft && (
        <Modal
          transparent
          animationType="slide"
          visible
          onRequestClose={() => setDraft(null)}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <Text style={styles.modalTitle}>{label}</Text>
              <DateTimePicker
                value={draft}
                mode={mode}
                display={isDate ? "inline" : "spinner"}
                themeVariant={scheme}
                onValueChange={(_, selected) => setDraft(selected)}
              />
              <View style={styles.pickerActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDraft(null)}
                  style={styles.pickerAction}
                >
                  <Text style={styles.pickerActionText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(formatValue(draft));
                    setDraft(null);
                  }}
                  style={styles.pickerAction}
                >
                  <Text style={styles.pickerActionText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  field: {
    gap: 6,
    alignItems: "flex-start",
  },
  label: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: theme.text,
    fontSize: 15,
  },
  iosPicker: {
    alignSelf: "flex-start",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.controlBorder,
    backgroundColor: theme.surface,
  },
  partButton: {
    justifyContent: "center",
    minHeight: 48,
  },
  placeholder: {
    color: theme.textSecondary,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.text,
    textAlign: "center",
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerAction: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  pickerActionText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  doneButton: {
    backgroundColor: BrandColors.purple,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 14,
  },
  doneText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
}));

// // Tyrone's
// // // src/components/date-time-field.tsx
// // // Install first:  npx expo install @react-native-community/datetimepicker
// // import DateTimePicker, {
// //   DateTimePickerAndroid,
// // } from "@react-native-community/datetimepicker";
// // import { createElement } from "react";
// // import { Platform, Pressable, StyleSheet } from "react-native";

// // import { ThemedText } from "@/components/themed-text";
// // import { ThemedView } from "@/components/themed-view";
// // import { BrandColors, Spacing } from "@/constants/theme";

// // type Props = {
// //   label: string;
// //   value: Date;
// //   onChange: (date: Date) => void;
// // };

// // const pad = (n: number) => String(n).padStart(2, "0");

// // // <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time
// // const toWebValue = (d: Date) =>
// //   `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// // const display = (d: Date) =>
// //   d.toLocaleString(undefined, {
// //     weekday: "short",
// //     month: "short",
// //     day: "numeric",
// //     year: "numeric",
// //     hour: "numeric",
// //     minute: "2-digit",
// //   });

// // export function DateTimeField({ label, value, onChange }: Props) {
// //   // Android has no combined picker: open the date dialog, then the time dialog.
// //   const openAndroid = () => {
// //     DateTimePickerAndroid.open({
// //       value,
// //       mode: "date",
// //       // onValueChange only fires when the user confirms; cancelling fires onDismiss instead
// //       onValueChange: (_, picked) => {
// //         if (!picked) return;
// //         DateTimePickerAndroid.open({
// //           value: picked,
// //           mode: "time",
// //           onValueChange: (__, withTime) => {
// //             if (withTime) onChange(withTime);
// //           },
// //         });
// //       },
// //     });
// //   };

// //   return (
// //     <ThemedView style={styles.field}>
// //       <ThemedText type="small">{label}</ThemedText>

// //       {Platform.OS === "ios" && (
// //         <DateTimePicker
// //           value={value}
// //           mode="datetime"
// //           display="compact"
// //           onValueChange={(_, d) => d && onChange(d)}
// //           style={styles.iosPicker}
// //         />
// //       )}

// //       {Platform.OS === "android" && (
// //         <Pressable onPress={openAndroid} style={styles.button}>
// //           <ThemedText>{display(value)}</ThemedText>
// //         </Pressable>
// //       )}

// //       {Platform.OS === "web" &&
// //         createElement("input", {
// //           type: "datetime-local",
// //           value: toWebValue(value),
// //           onChange: (e: any) => {
// //             const d = new Date(e.target.value);
// //             if (!isNaN(d.getTime())) onChange(d);
// //           },
// //           style: { padding: 12, fontSize: 16, borderRadius: 12 },
// //         })}
// //     </ThemedView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   field: { gap: Spacing.one, alignItems: "flex-start" },
// //   iosPicker: { alignSelf: "flex-start" },
// //   button: {
// //     paddingVertical: Spacing.two,
// //     paddingHorizontal: Spacing.three,
// //     borderRadius: Spacing.three,
// //     borderWidth: StyleSheet.hairlineWidth,
// //   },
// // });
