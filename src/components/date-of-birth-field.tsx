import { createElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme, useThemeScheme } from "@/hooks/use-theme";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function DateOfBirthField({ value, onChange, disabled }: Props) {
  const scheme = useThemeScheme();
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text
        nativeID="date-of-birth-label"
        style={[styles.label, { color: theme.text }]}
      >
        Date of birth
      </Text>
      {createElement("input", {
        type: "date",
        value,
        onChange: (event: { target: { value: string } }) =>
          onChange(event.target.value),
        disabled,
        required: true,
        autoComplete: "bday",
        "aria-labelledby": "date-of-birth-label",
        "aria-describedby": "date-of-birth-hint",
        style: {
          boxSizing: "border-box",
          width: "100%",
          height: 56,
          padding: "0 20px",
          borderRadius: 15,
          border: `1.5px solid ${theme.controlBorder}`,
          colorScheme: scheme,
          fontFamily: "inherit",
          fontSize: 16,
          color: theme.text,
          backgroundColor: theme.surface,
        },
      })}
      <Text
        nativeID="date-of-birth-hint"
        style={[styles.hint, { color: theme.textSecondary }]}
      >
        You must be 18 or older.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 14 },
});
