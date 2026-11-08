import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { Radius } from "@/constants/theme";

type Props = {
  visible: boolean;
  onCancel: () => void;
};

const RED = "#FF292F";

export function LogoutConfirmationModal({ visible, onCancel }: Props) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [mounted, setMounted] = useState(visible);

  function playClose() {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }

  useEffect(() => {
    if (visible) {
      if (mounted) {
        playPop(); // reopened while the close animation was still running
      } else {
        setMounted(true); // fresh open, onShow will play the pop
      }
    } else if (mounted) {
      playClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function playPop() {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6, // lower = bouncier
        tension: 90, // higher = faster
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutInProgress = useRef(false);

  function handleCancel() {
    if (!logoutInProgress.current) {
      onCancel();
    }
  }

  async function handleLogout() {
    if (logoutInProgress.current) return;

    logoutInProgress.current = true;
    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      onCancel();
      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Unable to log out",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      logoutInProgress.current = false;
      setLoggingOut(false);
    }
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={mounted}
      onShow={playPop}
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Animated.View
          style={[styles.sheet, { transform: [{ scale }] }]}
          accessibilityViewIsModal
        >
          <View style={styles.iconCircle}>
            <Ionicons name="log-in-outline" size={50} color={RED} />
          </View>

          <Text style={styles.title}>Log Out</Text>

          <Text style={styles.question}>
            Are you sure you want to log out of your account?
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleCancel}
              disabled={loggingOut}
              accessibilityRole="button"
              accessibilityLabel="Cancel log out"
              accessibilityState={{ disabled: loggingOut }}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.pressed,
                loggingOut && styles.disabled,
              ]}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              disabled={loggingOut}
              accessibilityRole="button"
              accessibilityLabel="Confirm log out"
              accessibilityState={{
                disabled: loggingOut,
                busy: loggingOut,
              }}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.pressed,
                loggingOut && styles.disabled,
              ]}
            >
              <Text style={[styles.buttonText, styles.confirmText]}>
                Confirm
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.large,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  // Icon
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FDEFF0",
    alignItems: "center",
    justifyContent: "center",
  },

  // Text
  title: {
    marginTop: 16,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
  },
  question: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 25,
    color: "#777380",
    textAlign: "center",
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    width: "100%",
  },
  button: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: "#CDCDCD",
  },
  confirmButton: {
    backgroundColor: RED,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  cancelText: {
    color: "#000000",
  },
  confirmText: {
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
