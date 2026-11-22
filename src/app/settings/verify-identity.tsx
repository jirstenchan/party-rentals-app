import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  AccountButton,
  AccountCard,
  AccountMessage,
  AccountSettingsPage,
  AccountTierBadge,
} from "@/components/settings/account-controls";
import { ThemedText } from "@/components/themed-text";
import {
  acceptHostAgreement,
  discardIdentityUpload,
  fetchVerificationStatus,
  submitIdentity,
  type AccountImage,
  type VerificationStatus,
} from "@/lib/account-api";
import { chooseAccountImage } from "@/lib/account-image";
import { isAdult } from "@/lib/signup";

export default function VerifyIdentityScreen() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [idType, setIdType] = useState<"government" | "student">("government");
  const [image, setImage] = useState<AccountImage | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loadProblem, setLoadProblem] = useState("");
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const next = await fetchVerificationStatus();
      setStatus(next);
      if (["pending", "verified"].includes(next.profile.identity_status))
        setImage(null);
      setLoadProblem("");
    } catch (error) {
      setLoadProblem(
        error instanceof Error
          ? error.message
          : "Could not refresh verification status.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function chooseImage() {
    if (busy) return;
    setBusy(true);
    setProblem("");
    try {
      const selected = await chooseAccountImage(5);
      if (selected) setImage(selected);
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Could not read your image.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function perform(
    action: () => Promise<{ message: string }>,
    clearImage = false,
  ) {
    if (busy) return;
    setBusy(true);
    setProblem("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result.message);
      if (clearImage) setImage(null);
      setAgreed(false);
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "Could not complete the request.",
      );
    } finally {
      // A lost response may still have submitted the ID. Refresh before retrying.
      await refresh();
      setBusy(false);
    }
  }

  const profile = status?.profile;
  const latest = status?.submission;
  const hasAdultDob =
    !!profile?.date_of_birth && isAdult(profile.date_of_birth);
  const canSubmit =
    profile?.tier === "basic" &&
    ["none", "failed"].includes(profile.identity_status) &&
    hasAdultDob &&
    !loadProblem;

  return (
    <AccountSettingsPage
      title="ACCOUNT VERIFICATION"
      refreshing={refreshing}
      onRefresh={() => {
        if (!busy) {
          setRefreshing(true);
          void refresh();
        }
      }}
    >
      {loading && <ActivityIndicator color="#6B2CF5" />}
      {loadProblem !== "" && (
        <AccountMessage error>{loadProblem}</AccountMessage>
      )}
      {profile && (
        <AccountCard>
          <ThemedText type="subtitle">Your account</ThemedText>
          <AccountTierBadge tier={profile.tier} />
          <ThemedText>ID status: {profile.identity_status}</ThemedText>
          <ThemedText>
            Verified means a government or student ID was reviewed and age
            confirmed by our team.
          </ThemedText>
          {profile.identity_status === "verified" && (
            <AccountMessage>Your ID review is complete.</AccountMessage>
          )}
          {profile.identity_status === "pending" && (
            <>
              <AccountMessage>
                Your ID is under review. Refresh this page to check for a
                decision.
              </AccountMessage>
              {latest?.uploaded_at && (
                <ThemedText style={styles.hint}>
                  Submitted {new Date(latest.created_at).toLocaleString()}.
                </ThemedText>
              )}
              {latest?.status === "pending" && !latest.uploaded_at && (
                <>
                  <ThemedText>
                    An unfinished upload can be discarded after 10 minutes.
                  </ThemedText>
                  <AccountButton
                    label="Discard interrupted upload"
                    secondary
                    busy={busy}
                    disabled={!!loadProblem}
                    onPress={() =>
                      perform(() => discardIdentityUpload(latest.id))
                    }
                  />
                </>
              )}
            </>
          )}
          {profile.identity_status === "failed" && (
            <AccountMessage error>
              Review result:{" "}
              {latest?.reject_reason ??
                "Your previous submission was not approved."}{" "}
              You may resubmit.
            </AccountMessage>
          )}
          {!hasAdultDob && profile.identity_status !== "verified" && (
            <AccountMessage>
              An adult date of birth is required. Contact the project
              administrator to complete this legacy account.
            </AccountMessage>
          )}
        </AccountCard>
      )}

      {canSubmit && (
        <AccountCard>
          <ThemedText type="subtitle">Submit an ID</ThemedText>
          <ThemedText>
            The admin team manually reviews this image and deletes it right
            after review. Upload only the front of your ID. Name and photo must
            be clearly readable. You may cover ID numbers.
          </ThemedText>
          <ThemedText style={styles.label}>ID type</ThemedText>
          <View style={styles.options}>
            {(["government", "student"] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setIdType(type)}
                disabled={busy}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: idType === type,
                  disabled: busy,
                }}
                style={[styles.option, idType === type && styles.selected]}
              >
                <ThemedText
                  style={idType === type ? styles.selectedText : undefined}
                >
                  {type === "government" ? "Government ID" : "Student ID"}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText style={styles.hint}>
            JPEG, PNG or WebP, up to 5 MB.
          </ThemedText>
          {image && (
            <Image
              source={{ uri: image.uri }}
              style={styles.preview}
              resizeMode="contain"
              accessibilityLabel="Selected front of ID"
            />
          )}
          <AccountButton
            label={image ? "Choose another image" : "Choose front of ID"}
            secondary
            onPress={chooseImage}
            disabled={busy}
          />
          {image && (
            <AccountButton
              label="Remove selected image"
              secondary
              onPress={() => setImage(null)}
              disabled={busy}
            />
          )}
          <AccountButton
            label="Submit ID for review"
            busy={busy}
            disabled={!image}
            onPress={() => {
              if (image)
                void perform(() => submitIdentity(idType, image), true);
            }}
          />
        </AccountCard>
      )}

      {profile?.tier === "verified_guest" && (
        <AccountCard>
          <ThemedText type="subtitle">Become a host</ThemedText>
          <ThemedText style={styles.label}>
            Host agreement — project placeholder
          </ThemedText>
          <ThemedText>
            Hosts are independent. Party Link does not organize or supervise
            events.
          </ThemedText>
          <ThemedText>
            You are responsible for following local laws and requirements
            concerning alcohol, noise, capacity, permits, and your event
            activities.
          </ThemedText>
          <ThemedText style={styles.hint}>
            Payout setup is skipped for this school project. This placeholder
            agreement needs legal review before a real launch.
          </ThemedText>
          <Pressable
            onPress={() => setAgreed(!agreed)}
            disabled={busy}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed, disabled: busy }}
            accessibilityLabel="I agree to the host agreement, version 2026-01"
            style={styles.agreement}
          >
            <Ionicons
              name={agreed ? "checkbox" : "square-outline"}
              size={26}
              color="#6B2CF5"
            />
            <ThemedText style={styles.agreementText}>
              I agree to the host agreement (version 2026-01).
            </ThemedText>
          </Pressable>
          <AccountButton
            label="Become a host"
            busy={busy}
            disabled={!agreed || !!loadProblem}
            onPress={() => perform(() => acceptHostAgreement(agreed))}
          />
        </AccountCard>
      )}
      {problem !== "" && <AccountMessage error>{problem}</AccountMessage>}
      {notice !== "" && <AccountMessage>{notice}</AccountMessage>}
      <AccountButton
        label="Refresh status"
        secondary
        disabled={busy}
        onPress={() => {
          setRefreshing(true);
          void refresh();
        }}
      />
    </AccountSettingsPage>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: "600" },
  hint: { fontSize: 13 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: {
    borderWidth: 1,
    borderColor: "#B3B3B3",
    borderRadius: 12,
    padding: 12,
  },
  selected: { borderColor: "#6B2CF5", backgroundColor: "#F1EDFC" },
  selectedText: { color: "#6B2CF5", fontWeight: "600" },
  preview: { width: "100%", height: 200, borderRadius: 12 },
  agreement: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    minHeight: 44,
  },
  agreementText: { flex: 1 },
});
