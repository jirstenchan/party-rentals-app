import { BrandColors } from "@/constants/theme";
import { createThemeStyles } from "@/hooks/use-theme";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { NewTable } from "@/data/table";


type Props = {
  tables: NewTable[];
  onRemove: (index: number) => void;
};

export function TableDraftList({ tables, onRemove }: Props) {
  const { styles } = useStyles();
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
    color: theme.text,
  },
  price: {
    fontSize: 13.5,
    color: theme.textSecondary,
    marginTop: 4,
  },
  capacity: {
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
