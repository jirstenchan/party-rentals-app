import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandColors } from "@/constants/theme";

type ConfirmCreateModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmCreateModal({
  visible,
  onCancel,
  onConfirm,
}: ConfirmCreateModalProps) {
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
  return (
    <Modal
      transparent
      animationType="fade"
      visible={mounted}
      statusBarTranslucent
      onShow={playPop}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[styles.sheet, { opacity, transform: [{ scale }] }]}
        >
          {/* Document icon with a check badge */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="document-text-outline"
                size={54}
                color={BrandColors.purple}
              />
            </View>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={22} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.title}>Create Event?</Text>
          <Text style={styles.question}>
            Would you like to create this event?
          </Text>
          <Text style={styles.note}>
            Once created, the event will be visible to other users.
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.confirmText]}>
                Confirm
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
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
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
  },

  // Icon
  iconWrapper: {
    width: 106,
    height: 106,
  },
  iconCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "#F1EDFC",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    position: "absolute",
    right: 3,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: BrandColors.purple,
    alignItems: "center",
    justifyContent: "center",
  },

  // Text
  title: {
    marginTop: 14,
    fontSize: 30,
    fontWeight: "800",
    color: "#000",
    textAlign: "center",
  },
  question: {
    marginTop: 14,
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  note: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#6E6E78",
    textAlign: "center",
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 26,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#CDCDCD",
  },
  confirmButton: {
    backgroundColor: BrandColors.purple,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
  },
  cancelText: {
    color: "#000",
  },
  confirmText: {
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.85,
  },
});
