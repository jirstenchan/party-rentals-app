import { useState } from "react";
import {
  Button,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
//import React from "react";

export function SignIn() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const valid = email.includes("@") && password.length >= 6;
  async function submit() {
    setBusy(true);
    setProblem("");
    const { error } = creating
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setProblem(error.message);
    setBusy(false);
  }

  const input = [
    styles.input,
    { color: theme.text, borderColor: theme.textSecondary },
  ];

  return (
    <ThemedView style={styles.screen}>
      <ThemedText type="title">Party Link</ThemedText>
      <ThemedText themeColor="textSecondary">
        {creating ? "Create an account" : "Sign in"}
      </ThemedText>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!busy}
        style={input}
      />
      <View style={[styles.passwordRow, { borderColor: theme.textSecondary }]}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password, 6 or more characters"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!busy}
          style={[styles.passwordInput, { color: theme.text }]}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={8}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {problem !== "" && <ThemedText>{problem}</ThemedText>}{" "}
      <Button
        title={busy ? "Please wait" : creating ? "Create account" : "Sign in"}
        onPress={submit}
        disabled={!valid || busy}
      />
      <Button
        title={creating ? "I have an account" : "Create an account"}
        onPress={() => setCreating(!creating)}
        disabled={busy}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.three },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingRight: Spacing.three,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.three,
  },
});
