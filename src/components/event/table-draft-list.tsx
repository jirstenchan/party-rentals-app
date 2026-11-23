import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { NewTable } from "@/data/table";

const PURPLE = "#6B2CF5";

type Props = {
  tables: NewTable[];
  onRemove: (index: number) => void;
};

export function TableDraftList({ tables, onRemove }: Props) {
  if (tables.length === 0) return null;

  return (
    <View style={styles.list}>
      {tables.map((table, index) => (
        <View key={index} style={styles.card}>
          <Image
            source={require("@/assets/images/tabIcons/table-icon.png")}
            style={styles.tableIcon}
            resizeMode="contain"
          />

          <View style={styles.details}>
            <Text style={styles.name}>{table.label}</Text>

            <Text style={styles.price}>
              {table.tablePrice === 0 ? "Free" : table.tablePrice.toFixed(2)}
            </Text>

            <Text style={styles.capacity}>
              {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
            </Text>
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
  tableIcon: {
    width: 44,
    height: 44,
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
  capacity: {
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
