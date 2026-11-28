import { createThemeStyles } from "@/hooks/use-theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import {
  AccountButton,
  AccountCard,
  AccountField,
  AccountMessage,
  AccountSettingsPage,
  AccountTierBadge,
} from "@/components/settings/account-controls";
import { ThemedText } from "@/components/themed-text";
import {
  AccountApiError,
  fetchAccountProfile,
  updateAccountProfile,
  type AccountImage,
  type AccountProfile,
} from "@/lib/account-api";
import { chooseProfilePhoto } from "@/lib/profile-photo";

export default function PersonalInformationScreen() {
  const { theme, styles } = useStyles();
  const router = useRouter();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hostName, setHostName] = useState("");
  const [avatar, setAvatar] = useState<AccountImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchAccountProfile()
        .then((next) => {
          if (!active) return;
          setProfile(next);
          setName(next.name);
          setPhone(next.phone ?? "");
          setHostName(next.host_name ?? "");
          setProblem("");
        })
        .catch((error: unknown) => {
          if (active)
            setProblem(
              error instanceof Error
                ? error.message
                : "Could not load your profile.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  async function choosePhoto() {
    if (busy) return;
    setBusy(true);
    setProblem("");
    try {
      const image = await chooseProfilePhoto();
      if (image) setAvatar(image);
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Could not choose a photo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (busy || !profile) return;
    setBusy(true);
    setProblem("");
    setNotice("");
    setFieldErrors({});
    try {
      const result = await updateAccountProfile({
        name,
        phone,
        hostName,
        avatar,
      });
      setNotice(result.message);
      const next = await fetchAccountProfile().catch(() => null);
      if (next) {
        setProfile(next);
        setName(next.name);
        setPhone(next.phone ?? "");
        setHostName(next.host_name ?? "");
        setAvatar(null);
      }
    } catch (error) {
      if (error instanceof AccountApiError) setFieldErrors(error.fieldErrors);
      setProblem(
        error instanceof Error ? error.message : "Could not save your profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  const photo = avatar?.uri ?? profile?.avatar_url;
  return (
    <AccountSettingsPage title="PERSONAL INFORMATION">
      {loading && <ActivityIndicator color={theme.accent} />}
      {problem !== "" && <AccountMessage error>{problem}</AccountMessage>}
      {!loading && !profile && (
        <AccountButton
          label="Try again"
          onPress={() => router.replace("/settings/personal-information")}
        />
      )}
      {profile && (
        <>
          <AccountCard>
            <ThemedText type="subtitle">Account status</ThemedText>
            <AccountTierBadge tier={profile.tier} />
            <ThemedText>ID status: {profile.identity_status}</ThemedText>
            <AccountButton
              label={
                profile.identity_status === "verified"
                  ? "View verification"
                  : "Verify my account"
              }
              secondary
              onPress={() => router.push("/settings/verify-identity")}
            />
          </AccountCard>
          <AccountCard>
            <ThemedText type="subtitle">Profile information</ThemedText>
            <View style={styles.photoRow}>
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                  accessibilityLabel="Your profile photo"
                />
              ) : (
                <View style={[styles.photo, styles.placeholder]}>
                  <ThemedText style={styles.initial}>
                    {(name || profile.email).charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
              )}
              <View style={styles.photoAction}>
                <AccountButton
                  label="Change photo"
                  secondary
                  onPress={choosePhoto}
                  disabled={busy}
                />
                <ThemedText style={styles.hint}>
                  Profile photos have a 2 MB upload limit.
                </ThemedText>
              </View>
            </View>
            {fieldErrors.avatar && (
              <AccountMessage error>{fieldErrors.avatar}</AccountMessage>
            )}
            <AccountField
              label="Full name"
              value={name}
              onChangeText={setName}
              editable={!busy}
              error={fieldErrors.name}
            />
            <AccountField
              label="Email address"
              value={profile.email}
              keyboardType="email-address"
              editable={false}
            />
            <AccountField
              label="Date of birth"
              value={profile.date_of_birth ?? "Not recorded"}
              editable={false}
            />
            <AccountField
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!busy}
              error={fieldErrors.phone}
            />
            <ThemedText style={styles.hint}>
              PH mobile number, e.g. +63 917 123 4567.
            </ThemedText>
            <AccountField
              label="Host name / brand name"
              value={hostName}
              onChangeText={setHostName}
              editable={!busy}
              error={fieldErrors.hostName}
            />
            <ThemedText style={styles.hint}>
              This name will be displayed to guests.
            </ThemedText>
            {notice !== "" && <AccountMessage>{notice}</AccountMessage>}
            <AccountButton label="Save changes" onPress={save} busy={busy} />
          </AccountCard>
        </>
      )}
    </AccountSettingsPage>
  );
}

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  photoRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  photo: { width: 80, height: 80, borderRadius: 40 },
  placeholder: {
    backgroundColor: theme.accentSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 28, color: theme.accent, fontWeight: "700" },
  photoAction: { flex: 1, gap: 8 },
  hint: { fontSize: 13 },
}));
