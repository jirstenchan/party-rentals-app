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
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { fetchTicket, submitPayment, TicketDetailDto } from "@/lib/events-api";
import { setProofDraft } from "@/lib/payment-draft";

export default function PaymentScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<{ uri: string; name: string } | null>(
    null,
  );
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setProof({
      uri: asset.uri,
      name: asset.fileName ?? asset.uri.split("/").pop() ?? "proof.jpg",
    });
  };

  const onSend = async () => {
    if (!proof) {
      Alert.alert("Proof required", "Please upload your proof of payment.");
      return;
    }
    setProofDraft(proof);
    try {
      setSubmitting(true);
      // TODO Uncomment this when /api/payments is implemented
      // await submitPayment(ticketId, proof.uri);
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
  };

  if (loading) return <ActivityIndicator style={styles.loading} />;

  if (!ticket) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: "Payment" }} />
        <ThemedText type="small" style={styles.center}>
          {error ?? "Ticket not found."}
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
        <Pressable onPress={pickImage}>
          <ThemedView
            type="backgroundElement"
            style={[styles.card, styles.proofRow]}
          >
            {proof ? (
              <>
                <Image source={{ uri: proof.uri }} style={styles.thumb} />
                <ThemedText
                  type="small"
                  style={styles.proofName}
                  numberOfLines={1}
                >
                  {proof.name}
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
            {/* TODO: fill in your information here */}
            Your notice goes here.
          </ThemedText>
        </ThemedView>

        {/* Send payment (bottom of the scroll) */}
        <Pressable
          onPress={onSend}
          disabled={submitting}
          style={({ pressed }) => [
            styles.sendButton,
            (pressed || submitting) && { opacity: 0.7 },
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
  sendButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: "#208AEF",
    alignItems: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
