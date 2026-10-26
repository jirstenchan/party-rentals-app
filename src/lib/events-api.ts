import { supabase } from "@/lib/supabase";
import { File } from "expo-file-system";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

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
  paymentQrUrl?: string | null; // image the host uploaded
  mapUrl: string | null;
};

export type EventTicketDto = {
  ticketId: string;
  eventId: string;
  name: string;
  ticketPrice: number;
  salesStart: string | null; // "YYYY-MM-DD"
  salesEnd: string | null; // "YYYY-MM-DD"
};

export type EventDetailDto = EventDto & {
  description?: string | null;
  endTime?: string | null;
  tickets: EventTicketDto[];
  // tables: EventTableDto[]; // later
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

export async function fetchEvent(id: string): Promise<EventDetailDto> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401)
    throw new Error("You need to sign in to see this event.");
  if (res.status === 404)
    throw new Error("This event doesn't exist or was removed.");
  if (!res.ok) throw new Error("Couldn't load this event. Please try again.");
  return res.json();
}

export type TicketDetailDto = EventTicketDto & {
  event: EventDto;
};

export async function fetchTicket(id: string): Promise<TicketDetailDto> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/ticket/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401)
    throw new Error("You need to sign in to buy a ticket.");
  if (res.status === 404)
    throw new Error("This ticket doesn't exist or was removed.");
  if (!res.ok) throw new Error("Couldn't load this ticket. Please try again.");
  return res.json();
}

export async function submitPayment(ticketId: string, proofUri: string) {
  const token = await getToken();
  const form = new FormData();
  form.append("ticketId", ticketId);
  form.append("proof", new File(proofUri));

  const res = await fetch(`${API_URL}/api/payments`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (res.status === 401) throw new Error("You need to sign in to pay.");
  if (!res.ok) throw new Error("Couldn't send your payment. Please try again.");
  return res.json();
}
