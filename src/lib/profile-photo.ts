import { decode } from "base64-arraybuffer";
import { requireOptionalNativeModule } from "expo";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import type { AccountImage } from "@/lib/account-api";
import { chooseAccountImage } from "@/lib/account-image";

const MAX_PHOTO_MB = 2;
const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;
const MAX_PHOTO_EDGE = 640;

export async function chooseProfilePhoto(): Promise<AccountImage | null> {
  if (
    Platform.OS !== "web" &&
    !requireOptionalNativeModule("ExpoImageManipulator")
  ) {
    return chooseAccountImage(MAX_PHOTO_MB);
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled) return null;

  const photo = result.assets[0];
  if (!photo?.uri) throw new Error("Could not read this photo. Try another one.");

  const { ImageManipulator, SaveFormat } = await import("expo-image-manipulator");
  const context = ImageManipulator.manipulate(photo.uri);
  if (Math.max(photo.width, photo.height) > MAX_PHOTO_EDGE) {
    context.resize(
      photo.width >= photo.height
        ? { width: MAX_PHOTO_EDGE }
        : { height: MAX_PHOTO_EDGE },
    );
  }

  const keepTransparency =
    photo.mimeType === "image/png" || photo.mimeType === "image/webp";
  const rendered = await context.renderAsync();
  const { uri, base64 } = await rendered.saveAsync({
    format: keepTransparency ? SaveFormat.PNG : SaveFormat.JPEG,
    compress: 0.8,
    base64: true,
  });

  if (!base64) throw new Error("Could not prepare this photo. Try another one.");
  if (decode(base64).byteLength > MAX_PHOTO_BYTES)
    throw new Error("This photo is still over 2 MB. Try a smaller photo.");

  return { uri, base64, mimeType: keepTransparency ? "image/png" : "image/jpeg" };
}
