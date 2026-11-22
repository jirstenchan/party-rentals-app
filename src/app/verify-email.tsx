import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  isValidVerificationEmail,
  readPendingEmail,
  rememberPendingEmail,
  resendSecondsRemaining,
  resendSignupCode,
  verifySignupCode,
} from "@/lib/email-verification";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail =
    typeof params.email === "string" ? params.email.trim() : "";
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState<"verify" | "resend" | null>(null);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const requestPending = useRef(false);
  const seconds = resendSecondsRemaining(sentAt, now);

  useEffect(() => {
    let active = true;
    readPendingEmail().then((pending) => {
      if (!active) return;
      if (!initialEmail && pending) setEmail(pending.email);
      if (
        pending &&
        (!initialEmail ||
          pending.email.toLowerCase() === initialEmail.toLowerCase())
      )
        setSentAt(pending.sentAt);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [initialEmail]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function verify() {
    if (requestPending.current) return;
    requestPending.current = true;
    setBusy("verify");
    setProblem("");
    setNotice("");
    try {
      await verifySignupCode(email, code);
      // The confirmed Supabase session opens the protected app automatically.
      setNotice("Email verified. Signing you in...");
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "Could not verify your code. Please try again.",
      );
    } finally {
      requestPending.current = false;
      setBusy(null);
    }
  }

  async function resend() {
    if (requestPending.current || seconds > 0) return;
    requestPending.current = true;
    setBusy("resend");
    setProblem("");
    setNotice("");
    // Keep the retry delay even if the server rate-limits the request.
    setSentAt(Date.now());
    setNow(Date.now());
    try {
      const sent = await resendSignupCode(email);
      setSentAt(sent);
      setNow(Date.now());
      setCode("");
      setNotice(
        "If confirmation is needed, a new code has been sent. Check your inbox and spam folder.",
      );
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "Could not send a new code. Please try again.",
      );
    } finally {
      requestPending.current = false;
      setBusy(null);
    }
  }

  function changeEmail(value: string) {
    setEmail(value);
    setCode("");
    setProblem("");
    setNotice("");
    setSentAt(0);
  }

  return (
    <ImageBackground
      source={require("../../assets/images/setup/bg-design.png")}
      style={styles.fill}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              onPress={() => router.replace("/login")}
              disabled={!!busy}
              accessibilityRole="button"
              accessibilityLabel="Back to login"
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={24} color={PURPLE} />
              <Text style={styles.link}>Back to login</Text>
            </Pressable>
            <View style={styles.card}>
              <Ionicons name="mail-open-outline" size={48} color={PURPLE} />
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.body}>
                Enter the 6-digit code sent to your email to finish creating
                your Party Link account.
              </Text>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                value={email}
                onChangeText={changeEmail}
                onEndEditing={() => {
                  void rememberPendingEmail(email, sentAt);
                }}
                accessibilityLabel="Signup email address"
                placeholder="Email used to sign up"
                placeholderTextColor="#60646C"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                editable={ready && !busy}
                style={styles.input}
              />
              <Text style={styles.label}>6-digit email code</Text>
              <TextInput
                value={code}
                onChangeText={(value) =>
                  setCode(value.replace(/\D/g, "").slice(0, 6))
                }
                accessibilityLabel="6-digit email verification code"
                placeholder="123456"
                placeholderTextColor="#60646C"
                keyboardType="number-pad"
                inputMode="numeric"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={6}
                editable={ready && !busy}
                returnKeyType="done"
                onSubmitEditing={() => {
                  void verify();
                }}
                style={[styles.input, styles.code]}
              />
              {problem !== "" && (
                <Text accessibilityRole="alert" style={styles.problem}>
                  {problem}
                </Text>
              )}
              {notice !== "" && (
                <Text accessibilityLiveRegion="polite" style={styles.notice}>
                  {notice}
                </Text>
              )}
              <Pressable
                onPress={verify}
                disabled={
                  !ready ||
                  !!busy ||
                  code.length !== 6 ||
                  !isValidVerificationEmail(email)
                }
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    !ready ||
                    !!busy ||
                    code.length !== 6 ||
                    !isValidVerificationEmail(email),
                  busy: busy === "verify",
                }}
                style={({ pressed }) => [
                  styles.button,
                  (!ready ||
                    !!busy ||
                    code.length !== 6 ||
                    !isValidVerificationEmail(email) ||
                    pressed) &&
                    styles.dimmed,
                ]}
              >
                <Text style={styles.buttonText}>
                  {busy === "verify" ? "Checking code..." : "Verify email"}
                </Text>
              </Pressable>
              <Pressable
                onPress={resend}
                disabled={
                  !ready ||
                  !!busy ||
                  seconds > 0 ||
                  !isValidVerificationEmail(email)
                }
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    !ready ||
                    !!busy ||
                    seconds > 0 ||
                    !isValidVerificationEmail(email),
                }}
                style={({ pressed }) => [
                  styles.button,
                  styles.secondary,
                  (!ready ||
                    !!busy ||
                    seconds > 0 ||
                    !isValidVerificationEmail(email) ||
                    pressed) &&
                    styles.dimmed,
                ]}
              >
                <Text style={styles.link}>
                  {busy === "resend"
                    ? "Sending code..."
                    : seconds > 0
                      ? `Resend code in ${seconds}s`
                      : "Resend code"}
                </Text>
              </Pressable>
              <Text style={styles.hint}>
                You can switch to your email app, copy the code, and come back
                here.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const PURPLE = "#6C2CF5";
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flexGrow: 1, padding: 24, gap: 24 },
  back: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  card: { gap: 16, paddingTop: 20 },
  title: { fontSize: 32, fontWeight: "800", color: "#000000" },
  body: { fontSize: 16, lineHeight: 24, color: "#333333" },
  label: { fontSize: 15, fontWeight: "600", color: "#000000" },
  input: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: "#D1D1D6",
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#FFFFFF",
  },
  code: { fontSize: 26, letterSpacing: 8, textAlign: "center" },
  button: {
    minHeight: 56,
    borderRadius: 15,
    backgroundColor: PURPLE,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: PURPLE,
  },
  buttonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  link: { color: PURPLE, fontSize: 16, fontWeight: "600" },
  dimmed: { opacity: 0.5 },
  problem: { color: "#D93025", fontSize: 15 },
  notice: { color: PURPLE, fontSize: 15 },
  hint: { color: "#60646C", fontSize: 14, lineHeight: 21 },
});
