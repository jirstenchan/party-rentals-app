import { Button, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { NewTicket } from "@/data/ticket";

type Props = {
  tickets: NewTicket[];
  onRemove: (index: number) => void;
};

export function TicketDraftList({ tickets, onRemove }: Props) {
  if (tickets.length === 0) return null;

  return (
    <ThemedView style={styles.list}>
      {tickets.map((t, i) => (
        <ThemedView key={i} style={styles.row}>
          <ThemedText type="smallBold">{t.name}</ThemedText>
          <ThemedText>
            {t.ticketPrice === 0 ? "Free" : t.ticketPrice.toFixed(2)}
            {t.salesStart && t.salesEnd
              ? ` · ${t.salesStart} to ${t.salesEnd}`
              : ""}
          </ThemedText>
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
