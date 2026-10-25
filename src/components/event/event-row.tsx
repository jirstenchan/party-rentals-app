import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TicketModal } from "@/components/event/ticket-modal";
import type { Event } from "@/data/event";
import { addTicket, type NewTicket } from "@/data/ticket";

type Props = {
  event: Event;
  onDelete: (id: string) => void;
  onStatus: (message: string) => void;
};

export function EventRow({ event, onDelete, onStatus }: Props) {
  const [ticketModalVisible, setTicketModalVisible] = useState(false);

  async function handleSaveTicket(ticket: NewTicket) {
    await addTicket({
      eventId: event.id,
      ...ticket,
    });

    onStatus("Ticket added");
  }

  return (
    <View style={styles.row}>
      <Text style={styles.name}>{event.name}</Text>

      <Text style={styles.summary}>
        {event.status} · {new Date(event.startTime).toLocaleString()}
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={styles.addButton}
          onPress={() => setTicketModalVisible(true)}
        >
          <Text style={styles.addText}>+ Add ticket</Text>
        </Pressable>

        <Pressable
          onPress={() => onDelete(event.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>

      <TicketModal
        visible={ticketModalVisible}
        onClose={() => setTicketModalVisible(false)}
        onSave={handleSaveTicket}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1.5,
    borderColor: "#D4D4D4",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  summary: {
    fontSize: 13,
    color: "#7A7A7A",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  addButton: {
    backgroundColor: "#6B2CF5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteText: {
    color: "#D93025",
    fontSize: 14,
    fontWeight: "700",
  },
});

// Tyrone's
// import { useState } from "react";
// import { Button, StyleSheet } from "react-native";

// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { TicketModal } from "@/components/event/ticket-modal";
// import { Spacing } from "@/constants/theme";
// import type { Event } from "@/data/event";
// import { addTicket, NewTicket } from "@/data/ticket";

// type Props = {
//   event: Event;
//   onDelete: (id: string) => void;
//   onStatus: (message: string) => void;
// };

// export function EventRow({ event, onDelete, onStatus }: Props) {
//   const [ticketModalVisible, setTicketModalVisible] = useState(false);

//   async function handleSaveTicket(ticket: NewTicket) {
//     await addTicket({ eventId: event.id, ...ticket }); // throws -> modal shows the error
//     onStatus("Ticket added");
//   }

//   return (
//     <ThemedView style={styles.row}>
//       <ThemedText type="smallBold">{event.name}</ThemedText>
//       <ThemedText>
//         {event.status} · {new Date(event.startTime).toLocaleString()}
//       </ThemedText>
//       <Button
//         title="+ Add ticket"
//         onPress={() => setTicketModalVisible(true)}
//       />
//       <Button title="Delete" onPress={() => onDelete(event.id)} />

//       <TicketModal
//         visible={ticketModalVisible}
//         onClose={() => setTicketModalVisible(false)}
//         onSave={handleSaveTicket}
//       />
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   row: { gap: Spacing.one, paddingVertical: Spacing.two },
// });
