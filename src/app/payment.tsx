import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { fetchTicket, submitPayment, TicketDetailDto } from "@/lib/events-api";
import { setProofDraft } from "@/lib/payment-draft";
import { PickedImage, uploadProofImage } from "@/data/image";

export default function PaymentScreen() {
  const { ticketId, reservationItemId } = useLocalSearchParams<{
    ticketId: string;
    reservationItemId: string;
  }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<PickedImage | null>(null);
  const [referenceNum, setReferenceNum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await fetchTicket(ticketId);
        if (!cancelled) setTicket(t);
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
  }, [ticketId]);

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
    } catch (err) {
      Alert.alert(
        "Couldn't choose image",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  async function onSend() {
    if (!proofImage || !referenceNum.trim() || !reservationItemId) return;
    try {
      setSubmitting(true);
      const uploaded = await uploadProofImage(proofImage);
      await submitPayment(
        reservationItemId,
        referenceNum.trim(),
        uploaded.publicUrl,
      );
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
      Alert.alert(
        "Payment failed",
        e instanceof Error ? e.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <ActivityIndicator style={styles.loading} />;

  if (!ticket || !reservationItemId) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: "Payment" }} />
        <ThemedText type="small" style={styles.center}>
          {!reservationItemId
            ? "Reservation is missing. Please return to ticket selection and try again."
            : (error ?? "Ticket not found.")}
        </ThemedText>
      </ThemedView>
    );
  }

  const qrUrl = ticket.event.paymentQrUrl;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Payment" }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* QR */}
        <ThemedText style={styles.sectionTitle}>Scan to pay</ThemedText>
        <ThemedView
          type="backgroundElement"
          style={[styles.card, styles.qrCard]}
        >
          {qrUrl ? (
            <Image
              source={{ uri: qrUrl }}
              style={styles.qr}
              resizeMode="contain"
            />
          ) : (
            <ThemedText type="small">
              The host hasn't uploaded a payment QR code yet.
            </ThemedText>
          )}
        </ThemedView>

        {/* Proof of payment */}
        <ThemedText style={styles.sectionTitle}>Proof of payment</ThemedText>
        <Pressable onPress={pickProofImage}>
          <ThemedView
            type="backgroundElement"
            style={[styles.card, styles.proofRow]}
          >
            {proofImage ? (
              <>
                <Image
                  source={{ uri: proofImage.uri }}
                  style={styles.thumb}
                />
                <ThemedText
                  type="small"
                  style={styles.proofName}
                  numberOfLines={1}
                >
                  {proofImage.fileName ?? "Payment proof"}
                </ThemedText>
              </>
            ) : (
              <ThemedText type="small">Tap to upload an image</ThemedText>
            )}
          </ThemedView>
        </Pressable>

        {/* Important notice */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardTitle}>Important notice</ThemedText>
          <ThemedText type="small">
            Complete your payment, then enter its reference number and attach
            the payment screenshot.
          </ThemedText>
        </ThemedView>

        <ThemedText style={styles.sectionTitle}>
          Payment reference number
        </ThemedText>
        <TextInput
          value={referenceNum}
          onChangeText={setReferenceNum}
          placeholder="Enter your transaction reference"
          maxLength={255}
          autoCapitalize="none"
          style={styles.referenceInput}
        />

        {/* Send payment (bottom of the scroll) */}
        <Pressable
          onPress={onSend}
          disabled={
            submitting ||
            !reservationItemId ||
            !proofImage ||
            !referenceNum.trim()
          }
          style={({ pressed }) => [
            styles.sendButton,
            (pressed ||
              submitting ||
              !reservationItemId ||
              !proofImage ||
              !referenceNum.trim()) && { opacity: 0.7 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.sendButtonText}>Send payment</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.five,
  },
  loading: { marginTop: Spacing.five },
  center: { textAlign: "center", marginTop: Spacing.five },
  sectionTitle: { fontWeight: "700", marginTop: Spacing.two },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardTitle: { fontWeight: "600" },
  qrCard: { alignItems: "center" },
  qr: { width: 240, height: 240 },
  proofRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  thumb: { width: 48, height: 48, borderRadius: Spacing.one },
  proofName: { flex: 1 },
  referenceInput: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    backgroundColor: "#fff",
    color: "#111",
  },
  sendButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: "#208AEF",
    alignItems: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
