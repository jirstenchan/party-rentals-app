import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NewTicket } from "@/data/ticket";

const PURPLE = "#6B2CF5";

type Props = {
  tickets: NewTicket[];
  onRemove: (index: number) => void;
};

export function TicketDraftList({ tickets, onRemove }: Props) {
  if (tickets.length === 0) return null;

  return (
    <View style={styles.list}>
      {tickets.map((ticket, index) => (
        <View key={index} style={styles.card}>
          <Ionicons name="ticket-outline" size={44} color={PURPLE} />

          <View style={styles.details}>
            <Text style={styles.name}>{ticket.name}</Text>

            <Text style={styles.price}>
              {ticket.ticketPrice === 0
                ? "Free"
                : ticket.ticketPrice.toFixed(2)}
            </Text>

            {ticket.salesStart && ticket.salesEnd ? (
              <Text style={styles.salesWindow}>
                {ticket.salesStart} to {ticket.salesEnd}
              </Text>
            ) : null}
          </View>

          <Pressable style={styles.button} onPress={() => onRemove(index)}>
            <Text style={styles.buttonText}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
    alignSelf: "stretch",
  },
  card: {
    borderWidth: 1.5,
    borderColor: "#D4D4D4",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 84,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  price: {
    fontSize: 13.5,
    color: "#7A7A7A",
    marginTop: 4,
  },
  salesWindow: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 4,
  },
  button: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

// Tyrone's
// import { Button, StyleSheet } from "react-native";

// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { Spacing } from "@/constants/theme";
// import type { NewTicket } from "@/data/ticket";

// type Props = {
//   tickets: NewTicket[];
//   onRemove: (index: number) => void;
// };

// export function TicketDraftList({ tickets, onRemove }: Props) {
//   if (tickets.length === 0) return null;

//   return (
//     <ThemedView style={styles.list}>
//       {tickets.map((t, i) => (
//         <ThemedView key={i} style={styles.row}>
//           <ThemedText type="smallBold">{t.name}</ThemedText>
//           <ThemedText>
//             {t.ticketPrice === 0 ? "Free" : t.ticketPrice.toFixed(2)}
//             {t.salesStart && t.salesEnd
//               ? ` · ${t.salesStart} to ${t.salesEnd}`
//               : ""}
//           </ThemedText>
//           <Button title="Remove" onPress={() => onRemove(i)} />
//         </ThemedView>
//       ))}
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   list: { gap: Spacing.two, alignSelf: "stretch" },
//   row: { gap: Spacing.one, paddingVertical: Spacing.two },
// });
