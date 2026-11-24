import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BrandColors, Colors, Radius, Spacing } from "@/constants/theme";
import { PickedImage, uploadProofImage } from "@/data/image";
import {
  formatTableHoldTime,
  tableHoldSeconds,
  useTableHoldClock,
} from "@/hooks/use-table-hold-clock";
import {
  fetchEvent,
  fetchTicket,
  submitPayment,
  type EventDto,
  type HostDto,
} from "@/lib/events-api";
import { setProofDraft } from "@/lib/payment-draft";
import {
  cancelTableReservation,
  fetchMyTableReservations,
  type MyTableReservation,
} from "@/lib/reservation-api";

// Theme colors
const PURPLE = BrandColors.purple;
const BORDER = BrandColors.border;
const MUTED = BrandColors.muted;
const BLACK = BrandColors.black;
const WHITE = BrandColors.white;
const DROPZONE_BG = Colors.light.backgroundElement;

// Not in the theme yet
const NOTICE_BG = "#F1EDFB";

// Font sizes (same values as the other screens, from theme.ts)
const FontSize = {
  headerTitle: 22,
  cardTitle: 16,
  host: 14,
  caption: 12,
} as const;

const formatSize = (bytes?: number | null) =>
  bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : null;

type PaymentDetails = {
  event: EventDto & {
    host?: string | (HostDto & { imageUrl?: string });
    hostName?: string;
    hostedBy?: string;
    hostAvatarUrl?: string;
  };
  table?: MyTableReservation;
};

const tablePrice = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export default function PaymentScreen() {
  const { ticketId, reservationItemId, itemType } = useLocalSearchParams<{
    ticketId: string;
    reservationItemId: string;
    itemType: string;
  }>();
  const isTablePayment = itemType === "table";
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<PickedImage | null>(null);
  const [proofSize, setProofSize] = useState<number | null>(null);
  const [referenceNum, setReferenceNum] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const deadline = payment?.table?.expiresAt;
  const now = useTableHoldClock(!!deadline);
  const secondsLeft = tableHoldSeconds(deadline, now);
  const expired = secondsLeft === 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let details: PaymentDetails;
        if (isTablePayment) {
          if (!reservationItemId) return;
          const [booking] = await fetchMyTableReservations(
            undefined,
            reservationItemId,
          );
          if (!booking) throw new Error("Table reservation not found.");
          if (booking.reservationStatus === "Expired") {
            throw new Error("This table hold has expired.");
          }
          if (
            booking.reservationStatus !== "Pending" ||
            booking.paymentSubmitted ||
            booking.unitPrice <= 0
          ) {
            throw new Error("Check My Tables for the current status of this reservation.");
          }
          details = { event: await fetchEvent(booking.eventId), table: booking };
        } else {
          details = await fetchTicket(ticketId);
        }
        if (!cancelled) setPayment(details);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isTablePayment, reservationItemId, ticketId]);

  async function pickProofImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert("Image unavailable", "Please choose another image.");
        return;
      }
      setProofImage({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName,
      });
      setProofSize(asset.fileSize ?? null);
    } catch (err) {
      Alert.alert(
        "Couldn't choose image",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  function removeProofImage() {
    setProofImage(null);
    setProofSize(null);
  }

  const canSend =
    !submitting &&
    !cancelling &&
    !expired &&
    !!reservationItemId &&
    !!proofImage &&
    !!referenceNum.trim();

  async function onSend() {
    if (!canSend || !proofImage || tableHoldSeconds(deadline, Date.now()) === 0)
      return;
    try {
      setSubmitting(true);
      setSendError(null);
      const uploaded = await uploadProofImage(proofImage);
      await submitPayment(
        reservationItemId,
        referenceNum.trim(),
        uploaded.publicUrl,
      );
      if (isTablePayment) {
        router.replace("/my-tables");
        return;
      }
      setProofDraft({
        uri: proofImage.uri,
        name: proofImage.fileName ?? "Payment proof",
      });
      // replace, not push: this screen is removed from the history
      router.replace({
        pathname: "/payment-proof",
        params: { ticketId },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      if (isTablePayment) setSendError(message);
      else Alert.alert("Payment failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelReservation() {
    if (submitting || cancelling || !reservationItemId) return;
    setCancelling(true);
    setSendError(null);
    try {
      await cancelTableReservation(reservationItemId);
      router.replace("/my-tables");
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Couldn't cancel this reservation.",
      );
    } finally {
      setCancelling(false);
    }
  }

  // Loading state.
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={PURPLE} style={styles.loading} />
      </ThemedView>
    );
  }

  if (!payment || !reservationItemId || (expired && !submitting && !cancelling)) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={PURPLE} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>PAYMENT</ThemedText>
          </View>

          <ThemedText type="small" style={styles.center}>
            {expired
              ? "The time to submit payment proof has ended."
              : !reservationItemId
                ? "Reservation is missing. Please return to your selection and try again."
                : (error ?? "Reservation not found.")}
          </ThemedText>
          {isTablePayment && (
            <Pressable
              onPress={() => router.replace("/my-tables")}
              style={styles.cancelButton}
              accessibilityRole="button"
            >
              <ThemedText style={styles.cancelText}>View My Tables</ThemedText>
            </Pressable>
          )}
        </SafeAreaView>
      </ThemedView>
    );
  }

  const { event } = payment;
  const qrUrl = event.paymentQrUrl;
  const host = typeof event.host === "object" ? event.host : undefined;
  const hostName = event.hostName ?? host?.name ?? event.hostedBy;
  const hostAvatar = event.hostAvatarUrl ?? host?.avatarUrl ?? host?.imageUrl;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Sticky header (outside the ScrollView) */}
          <View style={styles.headerClip} pointerEvents="box-none">
            <View style={[styles.header, scrolled && styles.headerShadow]}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={24} color={PURPLE} />
              </Pressable>

              <ThemedText style={styles.headerTitle}>PAYMENT</ThemedText>
            </View>
          </View>

          <ScrollView
            onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 0)}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {/* QR */}
            <ThemedText style={styles.sectionTitle}>Scan to pay</ThemedText>
            {payment.table && (
              <ThemedText type="smallBold">
                {payment.table.tableLabel} · {tablePrice.format(payment.table.unitPrice)}
              </ThemedText>
            )}
            {secondsLeft !== null && (
              <ThemedText type="small">
                Time left to submit proof {formatTableHoldTime(secondsLeft)}
              </ThemedText>
            )}
            <View style={styles.qrBox}>
              {hostName ? (
                <View style={styles.hostRow}>
                  {hostAvatar ? (
                    <Image source={{ uri: hostAvatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={24} color={MUTED} />
                    </View>
                  )}

                  <View>
                    <ThemedText style={styles.hostName}>{hostName}</ThemedText>
                    <ThemedText style={styles.hostRole}>Event Host</ThemedText>
                  </View>
                </View>
              ) : null}

              {qrUrl ? (
                <Image
                  source={{ uri: qrUrl }}
                  style={styles.qr}
                  resizeMode="contain"
                />
              ) : (
                <ThemedText type="small" style={styles.qrEmpty}>
                  The host hasn&apos;t uploaded a payment QR code yet.
                </ThemedText>
              )}
            </View>

            {/* Proof of payment */}
            <ThemedText style={styles.sectionTitle}>
              Proof of payment
            </ThemedText>
            <Pressable
              onPress={pickProofImage}
              style={({ pressed }) => [
                styles.dropzone,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Upload proof of payment"
            >
              <MaterialCommunityIcons
                name="file-upload-outline"
                size={40}
                color={PURPLE}
              />
              <ThemedText type="small" style={styles.dropzoneText}>
                Tap to upload an image
              </ThemedText>
            </Pressable>

            {proofImage ? (
              <View style={styles.fileCard}>
                <Image source={{ uri: proofImage.uri }} style={styles.thumb} />

                <View style={styles.flex}>
                  <ThemedText
                    type="small"
                    style={styles.fileName}
                    numberOfLines={1}
                  >
                    {proofImage.fileName ?? "Payment proof"}
                  </ThemedText>
                  {formatSize(proofSize) ? (
                    <ThemedText style={styles.fileSize}>
                      {formatSize(proofSize)}
                    </ThemedText>
                  ) : null}
                </View>

                <Pressable
                  onPress={removeProofImage}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Remove image"
                >
                  <Ionicons name="close" size={24} color={MUTED} />
                </Pressable>
              </View>
            ) : null}

            {/* Important notice */}
            <View style={styles.notice}>
              <View style={styles.noticeHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={PURPLE}
                />
                <ThemedText style={styles.noticeTitle}>
                  Important notice
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.noticeText}>
                Complete your payment, then enter its reference number and
                attach the payment screenshot.
              </ThemedText>
            </View>

            <ThemedText style={styles.sectionTitle}>
              Payment reference number
            </ThemedText>
            <TextInput
              value={referenceNum}
              onChangeText={setReferenceNum}
              placeholder="Enter your transaction reference"
              placeholderTextColor={MUTED}
              maxLength={100}
              autoCapitalize="none"
              style={styles.referenceInput}
            />
            {sendError && (
              <ThemedText accessibilityRole="alert" style={{ color: BrandColors.error }}>
                {sendError}
              </ThemedText>
            )}
          </ScrollView>

          {/* Footer (pinned at the bottom) */}
          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + Spacing.three },
            ]}
          >
            <Pressable
              onPress={onSend}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButton,
                (pressed || !canSend) && styles.dimmed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send payment"
            >
              {submitting ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <ThemedText style={styles.sendButtonText}>
                  Send payment
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={isTablePayment ? cancelReservation : () => router.back()}
              disabled={isTablePayment && (submitting || cancelling || expired)}
              hitSlop={12}
              style={styles.cancelButton}
              accessibilityRole="button"
              accessibilityLabel={isTablePayment ? "Cancel reservation" : "Cancel"}
            >
              <ThemedText style={styles.cancelText}>
                {isTablePayment
                  ? cancelling
                    ? "Cancelling…"
                    : "Cancel reservation"
                  : "Cancel"}
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loading: {
    marginTop: Spacing.five,
  },
  center: {
    textAlign: "center",
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.three,
  },

  // Header (sticky)
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
    backgroundColor: WHITE,
  },
  // Clips the shadow so it only shows below the header (not on the sides/top).
  // The negative margin keeps the layout unchanged.
  headerClip: {
    overflow: "hidden",
    paddingBottom: 8,
    marginBottom: -8,
    zIndex: 1,
  },
  headerShadow: {
    // iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Android
    elevation: 4,
  },
  headerTitle: {
    color: PURPLE,
    fontSize: FontSize.headerTitle,
    lineHeight: 30,
    fontWeight: "800",
  },

  // Content
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontWeight: "700",
  },

  // QR box
  qrBox: {
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1.5,
    borderColor: PURPLE,
    backgroundColor: WHITE,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
  },
  avatarPlaceholder: {
    backgroundColor: DROPZONE_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  hostName: {
    color: BLACK,
    fontSize: FontSize.cardTitle,
    fontWeight: "700",
  },
  hostRole: {
    color: BLACK,
    fontSize: FontSize.host,
  },
  qr: {
    width: "100%",
    aspectRatio: 1,
  },
  qrEmpty: {
    textAlign: "center",
    paddingVertical: Spacing.five,
  },

  // Upload dropzone
  dropzone: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    minHeight: 160,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: BORDER,
    backgroundColor: DROPZONE_BG,
  },
  dropzoneText: {
    color: MUTED,
    fontWeight: "700",
  },

  // Uploaded file row
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.small,
  },
  fileName: {
    color: BLACK,
    fontWeight: "700",
  },
  fileSize: {
    color: MUTED,
    fontSize: FontSize.caption,
  },

  // Important notice
  notice: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
    backgroundColor: NOTICE_BG,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  noticeTitle: {
    color: PURPLE,
    fontWeight: "600",
  },
  noticeText: {
    color: PURPLE,
  },

  // Reference input
  referenceInput: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    color: BLACK,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    backgroundColor: WHITE,
  },
  sendButton: {
    height: 55,
    borderRadius: Radius.large,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: WHITE,
    fontWeight: "600",
  },
  cancelButton: {
    alignSelf: "center",
    marginTop: Spacing.three,
  },
  cancelText: {
    color: MUTED,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  // Other
  pressed: {
    opacity: 0.85,
  },
  dimmed: {
    opacity: 0.7,
  },
});
