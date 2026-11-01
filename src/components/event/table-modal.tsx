import { useEffect, useState } from "react";
import { Button, Modal, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { problemFor } from "@/data/problem";
import type { NewTable } from "@/data/table";

type Props = {
  visible: boolean;
  onClose: () => void;
  // Parent decides what to do with the ticket. Throw to show an error in the modal.
  onSave: (ticket: NewTable) => Promise<void> | void;
};

export function TableModal({ visible, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");
  const [capacity, setCapacity] = useState("");

  const [useSalesWindow, setUseSalesWindow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Start with a clean form every time the modal opens
  useEffect(() => {
    if (visible) {
      setName("");
      setPrice("");
      setStatus("");
      setCapacity("");
      setUseSalesWindow(false);
      setError("");
    }
  }, [visible]);

  async function handleSave() {
    const priceNumber = parseFloat(price);
    const capacityNumber = parseFloat(capacity);
    if (!name.trim()) {
      setError("Enter a table name.");
      return;
    }
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Enter a valid price (use 0 for free).");
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
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Add table</ThemedText>
          <ThemedText>Fill in the details for this table.</ThemedText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Table name (e.g. VIP)"
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

          <TextInput
            value={capacity}
            onChangeText={(v) => setCapacity(v.replace(/[^0-9.]/g, ""))}
            placeholder="Minimum of 1"
            placeholderTextColor="gray"
            keyboardType="decimal-pad"
            style={styles.inputBox}
          />

          {error ? <ThemedText>{error}</ThemedText> : null}

          <Button
            title={saving ? "Saving..." : "Save table"}
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
