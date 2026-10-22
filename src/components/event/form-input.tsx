import { StyleSheet, TextInput, TextInputProps } from "react-native";

export function FormInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="gray"
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    borderColor: "white",
    color: "white",
  },
});
