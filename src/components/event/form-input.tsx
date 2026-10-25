import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

type Props = TextInputProps & {
  label?: string;
  icon?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
};

export function FormInput({
  label,
  icon,
  containerStyle,
  cardStyle,
  style,
  ...inputProps
}: Props) {
  return (
    <View style={containerStyle}>
      <View style={[styles.card, !!icon && styles.iconCard, cardStyle]}>
        {icon}

        <View style={icon ? styles.flex : undefined}>
          {label ? <Text style={styles.label}>{label}</Text> : null}

          <TextInput
            placeholderTextColor="#B3B3B3"
            {...inputProps}
            style={[styles.input, style]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderWidth: 1.5,
    borderColor: "#D4D4D4",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  iconCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  input: {
    fontSize: 15,
    color: "#000",
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
});

// import { StyleSheet, TextInput, TextInputProps } from "react-native";

// export function FormInput(props: TextInputProps) {
//   return (
//     <TextInput
//       placeholderTextColor="gray"
//       {...props}
//       style={[styles.input, props.style]}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 12,
//     borderColor: "white",
//     color: "white",
//   },
// });
