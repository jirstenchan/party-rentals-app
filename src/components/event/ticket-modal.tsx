import { BrandColors } from "@/constants/theme";
import { createThemeStyles } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { DateTimeField } from "@/components/event/date-time-field";
import { FormInput } from "@/components/event/form-input";
import { problemFor } from "@/data/problem";
import type { NewTicket } from "@/data/ticket";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (ticket: NewTicket) => Promise<void> | void;
};

const WEEK = 7 * 24 * 60 * 60 * 1000;

function toDateOnly(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function TicketModal({ visible, onClose, onSave }: Props) {
  const { styles } = useStyles();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [useSalesWindow, setUseSalesWindow] = useState(false);
  const [salesStart, setSalesStart] = useState(() => new Date());
  const [salesEnd, setSalesEnd] = useState(() => new Date(Date.now() + WEEK));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [mounted, setMounted] = useState(visible);
  const [scale] = useState(() => new Animated.Value(0.8));
  const [opacity] = useState(() => new Animated.Value(0));

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
      setUseSalesWindow(false);
      setSalesStart(new Date());
      setSalesEnd(new Date(Date.now() + WEEK));
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
    if (saving) return;
    const priceNumber = Number(price);
    const start = toDateOnly(salesStart);
    const end = toDateOnly(salesEnd);

    if (!name.trim()) {
      setError("Enter a ticket name.");
      return;
    }

    if (!price.trim() || !Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Enter a valid price (use 0 for free).");
      return;
    }

    if (useSalesWindow && end < start) {
      setError("Sales end must be on or after sales start.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        name: name.trim(),
        ticketPrice: priceNumber,
        salesStart: useSalesWindow ? start : null,
        salesEnd: useSalesWindow ? end : null,
      });

      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : problemFor(e));
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
          <Text style={styles.title}>Add ticket</Text>

          <Text style={styles.description}>
            Fill in the details for this ticket type.
          </Text>

          <FormInput
            label="Ticket Name"
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

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Set a sales window</Text>

            <Switch value={useSalesWindow} onValueChange={setUseSalesWindow} />
          </View>

          {useSalesWindow && (
            <>
              <DateTimeField
                label="Sales start"
                value={salesStart}
                onChange={setSalesStart}
              />

              <DateTimeField
                label="Sales end"
                value={salesEnd}
                onChange={setSalesEnd}
              />
            </>
          )}

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && styles.disabled]}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save ticket"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "600",
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
