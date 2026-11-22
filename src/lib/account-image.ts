import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import type { AccountImage } from "@/lib/account-api";

export async function chooseAccountImage(
  maxMegabytes: number,
): Promise<AccountImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    base64: true,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.base64)
    throw new Error("Could not read this image. Please choose another photo.");
  const mimeType = asset.mimeType ?? "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  const limit = maxMegabytes * 1024 * 1024;
  if ((asset.fileSize ?? 0) > limit || decode(asset.base64).byteLength > limit)
    throw new Error(`Choose an image up to ${maxMegabytes} MB.`);
  return {
    uri: asset.uri,
    base64: asset.base64,
    mimeType,
    fileName: asset.fileName,
  };
}
