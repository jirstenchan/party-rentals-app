import { supabase } from "@/lib/supabase";

export type EventStatus = "draft" | "published" | "cancelled";

export type Event = {
  id: string;
  name: string;
  description: string;
  location: string;
  capacity: number; // fixed typo: was "capactiy"
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: EventStatus;
};

// What you send when creating an event
export type NewEvent = {
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  startTime: string; // use date.toISOString()
  endTime: string;
  status?: EventStatus;
};

export type EventUpdate = Partial<NewEvent>;

function timeout(ms: number): Promise<never> {
  return new Promise((_, fail) =>
    //Step 5 reads this word to pick the message.
    setTimeout(() => fail(new Error("timeout")), ms),
  );
}

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: "Bearer " + data.session?.access_token };
}

const BASE = process.env.EXPO_PUBLIC_API_URL;
if (!BASE) throw new Error("Set EXPO_PUBLIC_API_URL in .env");

// ---------------------------------------------------------------------
// Shared request helper: adds the token, applies the timeout, and turns
// error responses into thrown Errors carrying the server's message.
// ---------------------------------------------------------------------
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
  };

  const res = await Promise.race([
    fetch(BASE + path, { ...init, headers }),
    timeout(10000),
  ]);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------
// Event API
// ---------------------------------------------------------------------
export const listEvents = () => request<Event[]>("/api/events");

export const listMyEvents = () => request<Event[]>("/api/events?scope=mine");

export const getEvent = (id: string) => request<Event>(`/api/events/${id}`);

export const createEvent = (input: NewEvent) =>
  request<Event>("/api/events", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateEvent = (id: string, input: EventUpdate) =>
  request<Event>(`/api/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const deleteEvent = (id: string) =>
  request<void>(`/api/events/${id}`, { method: "DELETE" });
