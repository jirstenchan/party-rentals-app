import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

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
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
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
        </View>
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
