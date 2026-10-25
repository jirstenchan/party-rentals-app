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

const toWebValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

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
            border: "1px solid #D4D4D4",
            color: "#000000",
            backgroundColor: "#FFFFFF",
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

const styles = StyleSheet.create({
  field: {
    gap: 6,
    alignItems: "flex-start",
  },
  label: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: "#000",
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
    borderColor: "#D4D4D4",
    backgroundColor: "#FFFFFF",
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  doneButton: {
    backgroundColor: "#6B2CF5",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 14,
  },
  doneText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

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
// // import { Spacing } from "@/constants/theme";

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
