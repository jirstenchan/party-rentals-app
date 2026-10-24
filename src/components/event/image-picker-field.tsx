import * as ImagePicker from "expo-image-picker";
import { Button, Image, StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import type { PickedImage } from "@/data/image";

type Props = {
  value: PickedImage | null;
  onChange: (image: PickedImage | null) => void;
};

export function ImagePickerField({ value, onChange }: Props) {
  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
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

  return (
    <ThemedView style={styles.container}>
      {value ? (
        <Image source={{ uri: value.uri }} style={styles.preview} />
      ) : null}
      <Button
        title={value ? "Change image" : "+ Add cover image"}
        onPress={pick}
      />
      {value ? (
        <Button title="Remove image" onPress={() => onChange(null)} />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 8, alignSelf: "stretch" },
  preview: { width: "100%", aspectRatio: 16 / 9, borderRadius: 8 },
});
