import { supabase } from "@/lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// Adjust to whatever your toEventDto returns.
export type EventDto = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  capacity?: number | null;
  startTime: string;
  endTime: string;
  status: "draft" | "published" | "cancelled";
  hostId: string;
};

// TODO: return the same token your getProfile() reads on the server.
async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function fetchEvents(scope?: "mine"): Promise<EventDto[]> {
  const token = await getToken();
  const res = await fetch(
    `${API_URL}/api/events${scope ? `?scope=${scope}` : ""}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (res.status === 401) throw new Error("You need to sign in to see events.");
  if (!res.ok) throw new Error("Couldn't load events. Pull down to try again.");
  return res.json();
}
