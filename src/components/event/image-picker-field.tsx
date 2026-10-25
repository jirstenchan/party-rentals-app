import * as ImagePicker from "expo-image-picker";
import { Button, Image, StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import type { PickedImage } from "@/data/image";

type Props = {
  value: PickedImage | null;
  text: string;
  onChange: (image: PickedImage | null) => void;
  /** Width / height ratio as [width, height], e.g. [4, 3] or [1, 1]. Defaults to [16, 9]. */
  aspect?: [number, number];
};

export function ImagePickerField({
  value,
  onChange,
  text,
  aspect = [16, 9],
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

  return (
    <ThemedView style={styles.container}>
      {value ? (
        <Image
          source={{ uri: value.uri }}
          style={[styles.preview, { aspectRatio: aspect[0] / aspect[1] }]}
        />
      ) : null}
      <Button title={value ? "Change image" : `${text}`} onPress={pick} />
      {value ? (
        <Button title="Remove image" onPress={() => onChange(null)} />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 8, alignSelf: "stretch" },
  preview: { width: "100%", borderRadius: 8 },
});
