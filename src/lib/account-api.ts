import { decode } from "base64-arraybuffer";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type AccountTier = "basic" | "verified_guest" | "verified_host";
export type AccountProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  host_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  role: string;
  tier: AccountTier;
  identity_status: "none" | "pending" | "verified" | "failed";
  verified_at: string | null;
};
export type AccountImage = {
  uri: string;
  base64: string;
  mimeType: string;
  fileName?: string | null;
};
export type VerificationStatus = {
  profile: AccountProfile;
  submission: {
    id: string;
    id_type: "government" | "student";
    status: "pending" | "approved" | "rejected";
    reject_reason: string | null;
    created_at: string;
    uploaded_at: string | null;
  } | null;
};

export class AccountApiError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AccountApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Please sign in again.");
  const response = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (response.status === 401) throw new Error("Please sign in again.");
  if (!response.ok || body?.ok === false)
    throw new AccountApiError(
      body?.error ??
        body?.message ??
        "Could not complete the request. Please try again.",
      body?.fieldErrors,
    );
  if (!body) throw new Error("The server returned an invalid response.");
  return body as T;
}

function appendImage(form: FormData, field: string, image: AccountImage) {
  const extension =
    image.mimeType === "image/png"
      ? "png"
      : image.mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const name = `image.${extension}`;
  if (Platform.OS === "web") {
    form.append(
      field,
      new Blob([decode(image.base64)], { type: image.mimeType }),
      name,
    );
  } else {
    // React Native's multipart implementation reads local files by URI.
    form.append(field, {
      uri: image.uri,
      name,
      type: image.mimeType,
    } as unknown as Blob);
  }
}

export async function fetchAccountProfile(): Promise<AccountProfile> {
  return (await request<{ profile: AccountProfile }>("/api/profile")).profile;
}

export async function updateAccountProfile(details: {
  name: string;
  phone: string;
  hostName: string;
  avatar: AccountImage | null;
}) {
  const form = new FormData();
  form.append("name", details.name);
  form.append("phone", details.phone);
  form.append("hostName", details.hostName);
  if (details.avatar) appendImage(form, "avatar", details.avatar);
  return request<{ message: string }>("/api/profile", {
    method: "PATCH",
    body: form,
  });
}

export function fetchVerificationStatus() {
  return request<VerificationStatus>("/api/verification");
}

export function submitIdentity(
  idType: "government" | "student",
  image: AccountImage,
) {
  const form = new FormData();
  form.append("idType", idType);
  appendImage(form, "image", image);
  return request<{ message: string }>("/api/verification", {
    method: "POST",
    body: form,
  });
}

export function discardIdentityUpload(submissionId: string) {
  return request<{ message: string }>("/api/verification", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId }),
  });
}

export function acceptHostAgreement(agree: boolean) {
  return request<{ message: string }>("/api/profile/host", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agree }),
  });
}
