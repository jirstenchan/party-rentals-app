import { createThemeStyles } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function toCalendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function initialDate(value: string): Date {
  if (value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const today = new Date();
  return new Date(
    today.getUTCFullYear() - 18,
    today.getUTCMonth(),
    today.getUTCDate(),
  );
}

export function DateOfBirthField({ value, onChange, disabled }: Props) {
  const { scheme, theme, styles } = useStyles();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => initialDate(value));

  function open() {
    if (disabled) return;
    const date = initialDate(value);
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "date",
        maximumDate: new Date(),
        onValueChange: (_, selected) => onChange(toCalendarDate(selected)),
      });
    } else {
      setDraft(date);
      setVisible(true);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Date of birth</Text>
      <Pressable
        onPress={open}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Date of birth"
        accessibilityValue={{ text: value || "Not selected" }}
        accessibilityHint="Choose your date of birth. You must be 18 or older."
        accessibilityState={{ disabled: !!disabled }}
        style={styles.field}
      >
        <Ionicons name="calendar-outline" size={24} color={theme.text} />
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value
            ? initialDate(value).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "Select your date of birth"}
        </Text>
      </Pressable>
      <Text style={styles.hint}>You must be 18 or older.</Text>
      {Platform.OS === "ios" && visible && (
        <Modal
          transparent
          animationType="slide"
          visible
          onRequestClose={() => setVisible(false)}
        >
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <Text style={styles.label}>Date of birth</Text>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                themeVariant={scheme}
                onValueChange={(_, selected) => setDraft(selected)}
              />
              <View style={styles.actions}>
                <Pressable
                  onPress={() => setVisible(false)}
                  accessibilityRole="button"
                  style={styles.action}
                >
                  <Text style={styles.actionText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChange(toCalendarDate(draft));
                    setVisible(false);
                  }}
                  accessibilityRole="button"
                  style={styles.action}
                >
                  <Text style={styles.actionText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 16, fontWeight: "600", color: theme.text },
  field: {
    height: 56,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: theme.controlBorder,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  value: { flex: 1, fontSize: 16, fontWeight: "600", color: theme.text },
  placeholder: { color: theme.textSecondary },
  hint: { fontSize: 14, color: theme.textSecondary },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    backgroundColor: theme.surface,
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  action: { minHeight: 44, paddingHorizontal: 16, justifyContent: "center" },
  actionText: { fontSize: 17, fontWeight: "600", color: theme.accent },
}));
