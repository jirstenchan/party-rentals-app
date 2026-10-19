import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DateTimeField } from "@/components/event/date-time-field";
import { Spacing } from "@/constants/theme";
import { problemFor } from "@/data/problem";
import type { NewTicket } from "@/data/ticket";

type Props = {
  visible: boolean;
  onClose: () => void;
  // Parent decides what to do with the ticket. Throw to show an error in the modal.
  onSave: (ticket: NewTicket) => Promise<void> | void;
};

const WEEK = 7 * 24 * 60 * 60 * 1000;

// Local date as "YYYY-MM-DD" (avoids the UTC off-by-one from toISOString)
function toDateOnly(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function TicketModal({ visible, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [useSalesWindow, setUseSalesWindow] = useState(false);
  const [salesStart, setSalesStart] = useState(new Date());
  const [salesEnd, setSalesEnd] = useState(new Date(Date.now() + WEEK));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Start with a clean form every time the modal opens
  useEffect(() => {
    if (visible) {
      setName("");
      setPrice("");
      setUseSalesWindow(false);
      setSalesStart(new Date());
      setSalesEnd(new Date(Date.now() + WEEK));
      setError("");
    }
  }, [visible]);

  async function handleSave() {
    const priceNumber = parseFloat(price);
    const start = toDateOnly(salesStart);
    const end = toDateOnly(salesEnd);

    if (!name.trim()) {
      setError("Enter a ticket name.");
      return;
    }
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
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
      setError("Add failed: " + problemFor(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Add ticket</ThemedText>
          <ThemedText>Fill in the details for this ticket type.</ThemedText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ticket name (e.g. VIP)"
            placeholderTextColor="gray"
            style={styles.inputBox}
          />

          <TextInput
            value={price}
            onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
            placeholder="Price (0 for free)"
            placeholderTextColor="gray"
            keyboardType="decimal-pad"
            style={styles.inputBox}
          />

          <View style={styles.switchRow}>
            <ThemedText>Set a sales window</ThemedText>
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

          {error ? <ThemedText>{error}</ThemedText> : null}

          <Button
            title={saving ? "Saving..." : "Save ticket"}
            onPress={handleSave}
            disabled={saving}
          />
          <Button title="Cancel" onPress={onClose} disabled={saving} />
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.four,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: 12,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    borderColor: "white",
    color: "white",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
