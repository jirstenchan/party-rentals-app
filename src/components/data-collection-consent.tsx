import { Ionicons } from "@expo/vector-icons";
import { openBrowserAsync } from "expo-web-browser";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLLECTION_NOTICE, LEGAL_VERSION } from "@/lib/signup";

type Props = {
  agreed: boolean;
  onChange: (agreed: boolean) => void;
  disabled?: boolean;
};

export function DataCollectionConsent({ agreed, onChange, disabled }: Props) {
  const [problem, setProblem] = useState("");

  async function openNotice(page: "terms" | "privacy") {
    const website = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
    setProblem("");
    try {
      await openBrowserAsync(`${website.replace(/\/$/, "")}/${page}`);
    } catch {
      setProblem("Could not open the notice. Please try again.");
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Before you create an account</Text>
      <Text style={styles.text}>{COLLECTION_NOTICE}</Text>
      <Pressable
        onPress={() => onChange(!agreed)}
        disabled={disabled}
        style={styles.row}
        accessibilityRole="checkbox"
        accessibilityLabel={`I agree to this data collection notice and the terms and privacy notice (${LEGAL_VERSION}).`}
        accessibilityState={{ checked: agreed, disabled: !!disabled }}
      >
        <View style={[styles.checkbox, agreed && styles.checked]}>
          {agreed && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
        </View>
        <Text style={[styles.text, styles.agreement]}>
          I agree to this data collection notice and the terms and privacy notice{" "}
          ({LEGAL_VERSION}).
        </Text>
      </Pressable>
      <View style={styles.links}>
        <Pressable
          onPress={() => openNotice("terms")}
          disabled={disabled}
          accessibilityRole="link"
          style={styles.linkButton}
        >
          <Text style={styles.link}>Read terms</Text>
        </Pressable>
        <Pressable
          onPress={() => openNotice("privacy")}
          disabled={disabled}
          accessibilityRole="link"
          style={styles.linkButton}
        >
          <Text style={styles.link}>Read privacy notice</Text>
        </Pressable>
      </View>
      {problem !== "" && <Text style={styles.problem}>{problem}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#D1D1D6",
    borderRadius: 15,
    padding: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#000000" },
  text: { fontSize: 14, lineHeight: 21, color: "#333333" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  agreement: { flex: 1 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#D1D1D6",
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: "#6C2CF5", borderColor: "#6C2CF5" },
  links: { flexDirection: "row", flexWrap: "wrap", columnGap: 20 },
  linkButton: { minHeight: 44, justifyContent: "center" },
  link: { fontSize: 14, color: "#6C2CF5", textDecorationLine: "underline" },
  problem: { fontSize: 14, color: "#D93025" },
});
