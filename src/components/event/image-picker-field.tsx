import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { PickedImage } from "@/data/image";

type Props = {
  value: PickedImage | null;
  /** Label when no image is selected, e.g. "+ Add Venue Map" */
  text: string;
  /** Label when an image is selected. Defaults to "Edit" */
  changeText?: string;
  onChange: (image: PickedImage | null) => void;
  /** Width / height ratio as [width, height]. Defaults to [16, 9]. */
  aspect?: [number, number];
  /** Show the inline preview inside the field. Defaults to true. */
  showPreview?: boolean;
};

export function ImagePickerField({
  value,
  onChange,
  text,
  changeText = "Edit",
  aspect = [16, 9],
  showPreview = true,
}: Props) {
  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset.base64) return;
    onChange({
      uri: asset.uri,
      base64: asset.base64,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  }

  function handlePress() {
    if (!value) {
      pick();
      return;
    }
    Alert.alert("Venue map", undefined, [
      { text: "Change image", onPress: pick },
      {
        text: "Remove image",
        style: "destructive",
        onPress: () => onChange(null),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <View style={styles.container}>
      {showPreview && value ? (
        <Image
          source={{ uri: value.uri }}
          style={[styles.preview, { aspectRatio: aspect[0] / aspect[1] }]}
        />
      ) : null}

      <Pressable
        onPress={handlePress}
        hitSlop={8}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityRole="button"
        accessibilityLabel={value ? "Edit image" : text}
      >
        <Text style={styles.action}>{value ? changeText : text}</Text>
      </Pressable>
    </View>
  );
}

const PURPLE = "#6B2CF5";

const styles = StyleSheet.create({
  container: { alignItems: "flex-end", gap: 8 },
  preview: { width: "100%", borderRadius: 8 },
  action: {
    fontSize: 17,
    fontWeight: "500",
    color: PURPLE,
  },
  pressed: { opacity: 0.6 },
});
