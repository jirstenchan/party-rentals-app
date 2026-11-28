import { BrandColors } from "@/constants/theme";
import { createThemeStyles } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NewTicket } from "@/data/ticket";


type Props = {
  tickets: NewTicket[];
  onRemove: (index: number) => void;
};

export function TicketDraftList({ tickets, onRemove }: Props) {
  const { theme, styles } = useStyles();
  if (tickets.length === 0) return null;

  return (
    <View style={styles.list}>
      {tickets.map((ticket, index) => (
        <View key={index} style={styles.card}>
          <Ionicons name="ticket-outline" size={44} color={theme.accent} />

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

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  list: {
    gap: 14,
    alignSelf: "stretch",
  },
  card: {
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 14,
    backgroundColor: theme.surface,
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
    color: theme.text,
  },
  price: {
    fontSize: 13.5,
    color: theme.textSecondary,
    marginTop: 4,
  },
  salesWindow: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  button: {
    backgroundColor: BrandColors.purple,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
}));
