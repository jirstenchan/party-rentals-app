import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";

const BUCKET = "event-images";
const HOSTQRPAYMENT = "hostQR";
const EVENTIMAGEBUCKET = "event-graphics";
const PAYMENT_RECEIPTS = "PaymentReciepts";

export type PickedImage = {
  uri: string;
  base64: string;
  mimeType: string;
  fileName?: string | null;
};

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

export async function uploadHostQr(image: PickedImage) {
  const ext = image.mimeType.split("/")[1] ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(HOSTQRPAYMENT)
    .upload(path, decode(image.base64), { contentType: image.mimeType });
  if (error) throw error;

  const { data } = supabase.storage.from(HOSTQRPAYMENT).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteHostQr(path: string) {
  await supabase.storage.from(HOSTQRPAYMENT).remove([path]);
}

export async function uploadEventGraphic(image: PickedImage) {
  const ext = image.mimeType.split("/")[1] ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(EVENTIMAGEBUCKET)
    .upload(path, decode(image.base64), { contentType: image.mimeType });
  if (error) throw error;

  const { data } = supabase.storage.from(EVENTIMAGEBUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteEventGraphic(path: string) {
  await supabase.storage.from(EVENTIMAGEBUCKET).remove([path]);
}

export async function uploadProofImage(image: PickedImage) {
  const ext = image.mimeType.split("/")[1] ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(PAYMENT_RECEIPTS)
    .upload(path, decode(image.base64), { contentType: image.mimeType });
  if (error) throw error;

  const { data } = supabase.storage
    .from(PAYMENT_RECEIPTS)
    .getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteProofImage(path: string) {
  const { error } = await supabase.storage
    .from(PAYMENT_RECEIPTS)
    .remove([path]);
  if (error) throw error;
}
