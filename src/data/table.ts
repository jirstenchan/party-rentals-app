import { supabase } from "@/lib/supabase";

const BASE = process.env.EXPO_PUBLIC_API_URL;
if (!BASE) throw new Error("Set EXPO_PUBLIC_API_URL in .env");

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: "Bearer " + data.session?.access_token };
}

export interface EventTable {
  ticketId: string;
  eventId: string;
  label: string;
  tablePrice: number;
  status: string;
  capacity: number;
}

export interface AddTableInput {
  eventId: string;
  label: string;
  tablePrice: number;
  status: string;
  capacity: number;
}

export interface AddGuestsInput {
  tableId: string;
  guests: string[]; // The array of names collected from your input loop
}

<<<<<<< HEAD
=======

>>>>>>> 6420a29 (update tables)
// ---------------------------------------------------------------------
// Shared request helper: adds the token, applies the timeout, and turns
// error responses into thrown Errors carrying the server's message.
// ---------------------------------------------------------------------
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(BASE + path, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(await authHeader()),
        ...(init.headers as Record<string, string> | undefined),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const details = body?.details
        ? Object.values(body.details).flat().join("\n")
        : null;
      throw new Error(
        details ?? body?.error ?? `Request failed (${res.status})`,
      );
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------
// TABLE API
// ---------------------------------------------------------------------

// A table drafted on the form before its event exists
export type NewTable = Omit<AddTableInput, "eventId">;

export const listTicket = () => request<Event[]>("/api/ticket");

export const addTable = (input: AddTableInput) =>
  request<EventTable>("/api/table", {
    method: "POST",
    body: JSON.stringify(input),
  });

<<<<<<< HEAD
=======

>>>>>>> 6420a29 (update tables)
export const createGuests = (input: AddGuestsInput) =>
  request<{ success: boolean }>("/api/table/guests", {
    method: "POST", // Or "PUT" depending on your API structure
    body: JSON.stringify(input),
<<<<<<< HEAD
  });
=======
  });
>>>>>>> 6420a29 (update tables)
