import { useState } from "react";
import { Button, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TicketModal } from "@/components/event/ticket-modal";
import { Spacing } from "@/constants/theme";
import type { Event } from "@/data/event";
import { addTicket, NewTicket } from "@/data/ticket";

type Props = {
  event: Event;
  onDelete: (id: string) => void;
  onStatus: (message: string) => void;
};

export function EventRow({ event, onDelete, onStatus }: Props) {
  const [ticketModalVisible, setTicketModalVisible] = useState(false);

  async function handleSaveTicket(ticket: NewTicket) {
    await addTicket({ eventId: event.id, ...ticket }); // throws -> modal shows the error
    onStatus("Ticket added");
  }

  return (
    <ThemedView style={styles.row}>
      <ThemedText type="smallBold">{event.name}</ThemedText>
      <ThemedText>
        {event.status} · {new Date(event.startTime).toLocaleString()}
      </ThemedText>
      <Button
        title="+ Add ticket"
        onPress={() => setTicketModalVisible(true)}
      />
      <Button title="Delete" onPress={() => onDelete(event.id)} />

      <TicketModal
        visible={ticketModalVisible}
        onClose={() => setTicketModalVisible(false)}
        onSave={handleSaveTicket}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.one, paddingVertical: Spacing.two },
});
