import { BrandColors } from "@/constants/theme";
import { createThemeStyles } from "@/hooks/use-theme";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FormInput } from "@/components/event/form-input";
import { problemFor } from "@/data/problem";
import type { NewTable } from "@/data/table";

type Props = {
  visible: boolean;
  onClose: () => void;
  // Parent decides what to do with the table. Throw to show an error in the modal.
  onSave: (table: NewTable) => Promise<void> | void;
};

export function TableModal({ visible, onClose, onSave }: Props) {
  const { styles } = useStyles();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [mounted, setMounted] = useState(visible);
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  function playPop() {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }

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
      setName("");
      setPrice("");
      setCapacity("");
      setError("");

      if (mounted) {
        playPop(); // reopened while the close animation was still running
      } else {
        setMounted(true); // fresh open, onShow plays the pop
      }
    } else if (mounted) {
      playClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function handleSave() {
    const priceNumber = parseFloat(price);
    const capacityNumber = parseInt(capacity, 10);

    if (!name.trim()) {
      setError("Enter a table name.");
      return;
    }

    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Enter a valid price (use 0 for free).");
      return;
    }

    if (Number.isNaN(capacityNumber) || capacityNumber < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        label: name.trim(),
        tablePrice: priceNumber,
        status: "Available",
        capacity: capacityNumber,
      });

      onClose();
    } catch (e) {
      setError("Add failed: " + problemFor(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={mounted}
      animationType="fade"
      transparent
      onShow={playPop}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[styles.card, { opacity, transform: [{ scale }] }]}
        >
          <Text style={styles.title}>Add table</Text>

          <Text style={styles.description}>
            Fill in the details for this table.
          </Text>

          <FormInput
            label="Table Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. VIP"
            cardStyle={styles.inputCard}
          />

          <FormInput
            label="Price"
            value={price}
            onChangeText={(value) => setPrice(value.replace(/[^0-9.]/g, ""))}
            placeholder="0 for free"
            keyboardType="decimal-pad"
            cardStyle={styles.inputCard}
          />

          <FormInput
            label="Capacity"
            value={capacity}
            onChangeText={(value) => setCapacity(value.replace(/[^0-9]/g, ""))}
            placeholder="Minimum of 1"
            keyboardType="number-pad"
            cardStyle={styles.inputCard}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && styles.disabled]}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save table"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            disabled={saving}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    gap: 14,
    padding: 20,
    borderRadius: 20,
    backgroundColor: theme.surface,
  },
  title: {
    color: theme.accent,
    fontSize: 24,
    fontWeight: "800",
  },
  description: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  inputCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    color: theme.danger,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: BrandColors.purple,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
}));
