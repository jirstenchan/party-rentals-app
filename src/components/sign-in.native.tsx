import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { supabase } from "@/lib/supabase";

const PRIMARY = "#6C2CF5";
const BORDER = "#D1D1D6";
const PLACEHOLDER = "#C7C7CC";
const TEXT = "#000000";

/* small pieces */

type FieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "words";
  editable?: boolean;
};

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secure = false,
  keyboardType,
  autoCapitalize = "none",
  editable = true,
}: FieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={24} color={TEXT} style={styles.fieldIcon} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER}
        secureTextEntry={secure && !visible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
        style={styles.fieldInput}
      />

      {secure && (
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={24}
            color="#B8B8BE"
          />
        </Pressable>
      )}
    </View>
  );
}

function GoogleLogo({ size = 35 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

function SocialRow({ disabled }: { disabled?: boolean }) {
  // TODO: hook these up to supabase.auth.signInWithOAuth once providers are set up
  return (
    <>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <Pressable
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={styles.socialButton}
        >
          <GoogleLogo />
        </Pressable>
      </View>
    </>
  );
}

function PrimaryButton({
  label,
  onPress,
  busy,
}: {
  label: string;
  onPress: () => void;
  busy: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primaryButton,
        (pressed || busy) && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

/* main screen */

export function SignIn() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");

  const signingUp = mode === "signup";

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setProblem("");
    setNotice("");
  }

  async function handleLogin() {
    if (busy) return;

    if (!email.trim().includes("@") || password.length === 0) {
      setProblem("Enter your email and password.");
      return;
    }

    setBusy(true);
    setProblem("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setProblem(error.message);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup() {
    if (busy) return;

    if (fullName.trim() === "") return setProblem("Enter your full name.");
    if (!email.trim().includes("@")) return setProblem("Enter a valid email.");
    if (password.length < 6)
      return setProblem("Use at least 6 characters for your password.");
    if (password !== confirm) return setProblem("Passwords don't match.");
    if (!agreed)
      return setProblem(
        "Please agree to the Terms of Service and Privacy Policy.",
      );

    setBusy(true);
    setProblem("");
    setNotice("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (error) setProblem(error.message);
      else if (!data.session)
        setNotice("Check your email to confirm your account.");
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim().includes("@")) {
      setProblem("Enter your email first, then tap Forgot Password.");
      return;
    }

    setProblem("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) setProblem(error.message);
    else setNotice("Password reset email sent.");
  }

  return (
    <ImageBackground
      source={require("../../assets/images/setup/bg-design.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {signingUp ? (
              /* CREATE ACCOUNT */
              <>
                <Text style={styles.signupTitle}>Create Account</Text>
                <Text style={styles.signupSubtitle}>
                  Discover, book, and enjoy with{" "}
                  <Text style={styles.violet}>PartyLink</Text>
                </Text>

                <View style={styles.fields}>
                  <Field
                    icon="person-outline"
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    editable={!busy}
                  />
                  <Field
                    icon="mail-outline"
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    editable={!busy}
                  />
                  <Field
                    icon="lock-closed-outline"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secure
                    editable={!busy}
                  />
                  <Field
                    icon="lock-closed-outline"
                    placeholder="Confirm Password"
                    value={confirm}
                    onChangeText={setConfirm}
                    secure
                    editable={!busy}
                  />
                </View>

                <Pressable
                  onPress={() => setAgreed((a) => !a)}
                  style={styles.termsRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreed }}
                >
                  <View
                    style={[styles.checkbox, !agreed && styles.checkboxOff]}
                  >
                    {agreed && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </View>

                  <Text style={styles.termsText}>
                    I agree to the{" "}
                    <Text style={styles.violet}>Terms of Service</Text> and{" "}
                    <Text style={styles.violet}>Privacy Policy</Text>
                  </Text>
                </Pressable>

                {problem !== "" && (
                  <Text style={styles.problem}>{problem}</Text>
                )}
                {notice !== "" && <Text style={styles.notice}>{notice}</Text>}

                <PrimaryButton
                  label="Signup"
                  onPress={handleSignup}
                  busy={busy}
                />

                <SocialRow disabled={busy} />

                <View style={styles.switchBlock}>
                  <Text style={styles.switchText}>
                    Already have an account?
                  </Text>
                  <Pressable onPress={() => switchMode("login")} hitSlop={8}>
                    <Text style={styles.switchLink}>Login</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              /* LOGIN */
              <>
                <Image
                  source={require("../../assets/images/setup/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />

                <Text style={styles.loginTitle}>Welcome Back!</Text>
                <Text style={styles.loginSubtitle}>
                  Ready to find your next spot?
                </Text>

                <View style={styles.fields}>
                  {/* Supabase signs in with email, so this field takes the email */}
                  <Field
                    icon="person-outline"
                    placeholder="Username"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    editable={!busy}
                  />
                  <Field
                    icon="lock-closed-outline"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secure
                    editable={!busy}
                  />
                </View>

                <Pressable
                  onPress={handleForgotPassword}
                  hitSlop={8}
                  style={styles.forgot}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                {problem !== "" && (
                  <Text style={styles.problem}>{problem}</Text>
                )}
                {notice !== "" && <Text style={styles.notice}>{notice}</Text>}

                <PrimaryButton
                  label="Login"
                  onPress={handleLogin}
                  busy={busy}
                />

                <SocialRow disabled={busy} />

                <View style={styles.switchBlock}>
                  <Text style={styles.switchText}>Don’t have an account?</Text>
                  <Pressable onPress={() => switchMode("signup")} hitSlop={8}>
                    <Text style={styles.switchLink}>Sign Up</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* styles */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 15,
  },

  violet: {
    color: PRIMARY,
  },

  /* headings */
  signupTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: TEXT,
    marginTop: 26,
  },
  signupSubtitle: {
    fontSize: 17,
    fontWeight: "600",
    color: TEXT,
    marginTop: 8,
  },
  logo: {
    width: "100%",
    height: 225,
    marginTop: 20,
    transform: [{ translateX: -6 }],
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: PRIMARY,
    textAlign: "center",
    marginTop: -20,
  },
  loginSubtitle: {
    fontSize: 18,
    color: TEXT,
    textAlign: "center",
    marginTop: 2,
  },

  /* inputs */
  fields: {
    gap: 16,
    marginTop: 32,
  },
  field: {
    height: 56,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  fieldIcon: {
    marginRight: 16,
  },
  fieldInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
  },

  /* terms */
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 22,
    marginBottom: 20,
    gap: 20,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOff: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  termsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
    textAlign: "center",
  },

  /* login extras */
  forgot: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 16,
    marginRight: 6,
  },
  forgotText: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY,
  },

  /* messages */
  problem: {
    color: "#D93025",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  notice: {
    color: PRIMARY,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },

  /* primary button */
  primaryButton: {
    height: 58,
    borderRadius: 15,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dimmed: {
    opacity: 0.6,
  },

  /* divider + social */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: BORDER,
  },
  dividerText: {
    fontSize: 16,
    color: TEXT,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 54,
    marginTop: 10,
  },
  socialButton: {
    width: 58,
    height: 58,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  /* bottom switch */
  switchBlock: {
    alignItems: "center",
    marginTop: 18,
    gap: 4,
  },
  switchText: {
    fontSize: 16,
    color: TEXT,
  },
  switchLink: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY,
    textDecorationLine: "underline",
  },
});
