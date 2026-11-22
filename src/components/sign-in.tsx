import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { DataCollectionConsent } from "@/components/data-collection-consent";
import { DateOfBirthField } from "@/components/date-of-birth-field";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getSignupError, getSignupMetadata } from "@/lib/signup";
import {
  isUnconfirmedEmailError,
  rememberPendingEmail,
} from "@/lib/email-verification";
import { supabase } from "@/lib/supabase";

export function SignIn() {
  const router = useRouter();
  const theme = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const valid = email.includes("@") && password.length >= (creating ? 8 : 6);
  async function submit() {
    if (busy) return;
    const details = {
      fullName,
      email,
      dateOfBirth,
      password,
      confirmPassword,
      agreed,
    };
    if (creating) {
      const validationError = getSignupError(details);
      if (validationError) return setProblem(validationError);
    }
    setBusy(true);
    setProblem("");
    setNotice("");
    try {
      if (creating) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: getSignupMetadata(details) },
        });
        if (error) setProblem(error.message);
        else if (!data.session) {
          await rememberPendingEmail(email.trim(), Date.now());
          setPassword("");
          setConfirmPassword("");
          router.push({
            pathname: "/verify-email",
            params: { email: email.trim() },
          });
        } else {
          await supabase.auth.signOut();
          setProblem("Email confirmation must be enabled before signing up.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (isUnconfirmedEmailError(error)) {
          await rememberPendingEmail(email.trim());
          router.push({
            pathname: "/verify-email",
            params: { email: email.trim() },
          });
        } else if (error) setProblem(error.message);
      }
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = [
    styles.input,
    { color: theme.text, borderColor: theme.textSecondary },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title">Party Link</ThemedText>
        <ThemedText themeColor="textSecondary">
          {creating ? "Create an account" : "Sign in"}
        </ThemedText>
        {creating && (
          <>
            <DataCollectionConsent
              agreed={agreed}
              onChange={setAgreed}
              disabled={busy}
            />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              accessibilityLabel="Full name"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              editable={!busy}
              style={input}
            />
          </>
        )}
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
        {creating && (
          <DateOfBirthField
            value={dateOfBirth}
            onChange={setDateOfBirth}
            disabled={busy}
          />
        )}
        <View
          style={[styles.passwordRow, { borderColor: theme.textSecondary }]}
        >
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={`Password, ${creating ? 8 : 6} or more characters`}
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
        {creating && (
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm Password"
            accessibilityLabel="Confirm password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!busy}
            style={input}
          />
        )}
        {problem !== "" && <ThemedText>{problem}</ThemedText>}
        {notice !== "" && <ThemedText>{notice}</ThemedText>}
        <Button
          title={busy ? "Please wait" : creating ? "Create account" : "Sign in"}
          onPress={submit}
          disabled={!valid || busy}
        />
        <Button
          title={creating ? "I have an account" : "Create an account"}
          onPress={() => {
            setCreating(!creating);
            setProblem("");
            setNotice("");
          }}
          disabled={busy}
        />
        {!creating && (
          <Button
            title="Enter verification code"
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: "/verify-email",
                params: { email: email.trim() },
              })
            }
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: {
    flexGrow: 1,
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
