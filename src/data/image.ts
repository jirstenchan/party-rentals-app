import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";

const BUCKET = "event-images";

export type PickedImage = { uri: string; base64: string; mimeType: string };

export async function uploadEventImage(image: PickedImage) {
  const ext = image.mimeType.split("/")[1] ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(image.base64), { contentType: image.mimeType });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteEventImage(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}
