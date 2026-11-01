import { Button, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { NewTable } from "@/data/table";

type Props = {
  tables: NewTable[];
  onRemove: (index: number) => void;
};

export function TableDraftList({ tables, onRemove }: Props) {
  if (tables.length === 0) return null;

  return (
    <ThemedView style={styles.list}>
      {tables.map((t, i) => (
        <ThemedView key={i} style={styles.row}>
          <ThemedText type="smallBold">Table</ThemedText>
          <ThemedText type="smallBold">{t.label}</ThemedText>
          <ThemedText>
            {t.tablePrice === 0 ? "Free" : t.tablePrice.toFixed(2)}
          </ThemedText>
          <ThemedText>{t.capacity.toFixed(2)}</ThemedText>
          <Button title="Remove" onPress={() => onRemove(i)} />
        </ThemedView>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two, alignSelf: "stretch" },
  row: { gap: Spacing.one, paddingVertical: Spacing.two },
});
