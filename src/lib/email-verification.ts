import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const PENDING_EMAIL_KEY = "pending_signup_email_v1";
export const RESEND_DELAY_SECONDS = 60;

export function isValidVerificationEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isUnconfirmedEmailError(
  error: { code?: string; message: string } | null,
) {
  return (
    error?.code === "email_not_confirmed" ||
    !!error?.message.toLowerCase().includes("email not confirmed")
  );
}

export function confirmedSession(session: Session | null): Session | null {
  return session?.user.email_confirmed_at ? session : null;
}

// Remember only the email and resend time, never a password or verification code.
export async function rememberPendingEmail(email: string, sentAt = 0) {
  if (!isValidVerificationEmail(email)) return;
  if (!sentAt) {
    const previous = await readPendingEmail();
    if (previous?.email.toLowerCase() === email.trim().toLowerCase())
      sentAt = previous.sentAt;
  }
  await AsyncStorage.setItem(
    PENDING_EMAIL_KEY,
    JSON.stringify({ email: email.trim(), sentAt }),
  ).catch(() => {});
}

export async function readPendingEmail(): Promise<{
  email: string;
  sentAt: number;
} | null> {
  try {
    const saved = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
    if (!saved) return null;
    const value = JSON.parse(saved);
    if (!isValidVerificationEmail(value?.email ?? "")) return null;
    return {
      email: value.email,
      sentAt: Number.isFinite(value.sentAt) ? value.sentAt : 0,
    };
  } catch {
    return null;
  }
}

export function resendSecondsRemaining(
  sentAt: number,
  now = Date.now(),
): number {
  return Math.max(
    0,
    Math.min(
      RESEND_DELAY_SECONDS,
      Math.ceil((sentAt + RESEND_DELAY_SECONDS * 1000 - now) / 1000),
    ),
  );
}

export async function verifySignupCode(email: string, code: string) {
  if (!isValidVerificationEmail(email))
    throw new Error("Enter the email address you used to sign up.");
  if (!/^\d{6}$/.test(code.trim()))
    throw new Error("Enter the 6-digit code from your email.");
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: "signup",
  });
  if (error)
    throw new Error(
      error.code === "otp_expired"
        ? "Invalid or expired code. Check the code or request a new one."
        : error.message || "Could not verify the code. Please try again.",
    );
  if (!data.user?.email_confirmed_at || !confirmedSession(data.session))
    throw new Error("Email could not be confirmed. Please request a new code.");
  await AsyncStorage.removeItem(PENDING_EMAIL_KEY).catch(() => {});
}

export async function resendSignupCode(email: string) {
  if (!isValidVerificationEmail(email))
    throw new Error("Enter the email address you used to sign up.");
  const { error } = await supabase.auth.resend({
    email: email.trim(),
    type: "signup",
  });
  if (error)
    throw new Error(
      error.message || "Could not send a code. Wait a minute and try again.",
    );
  const sentAt = Date.now();
  await rememberPendingEmail(email, sentAt);
  return sentAt;
}
