import { supabase } from "@/lib/supabase";

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
  paymentQrUrl?: string | null;
  mapUrl: string | null;
  eventImageUrl: string | null;
};

export type HostDto = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type EventTicketDto = {
  ticketId: string;
  eventId: string;
  name: string;
  ticketPrice: number;
  salesStart: string | null;
  salesEnd: string | null;
};

export type EventTableDto = {
  tableId: string;
  eventId: string;
  label: string;
  tablePrice: number;
  status: string;
  capacity: number;
};

export type EventDetailDto = EventDto & {
  description?: string | null;
  endTime?: string | null;
  tickets: EventTicketDto[];
  host: HostDto;
  tables: EventTableDto[];
};

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Logs the status and body of failed requests to Metro, and reads
// `error` or `message` from the response. Remove the console lines when done debugging.
async function getApiError(res: Response, fallback: string): Promise<Error> {
  const text = await res.text().catch(() => "");
  console.warn(`API ${res.status} ${res.url}`, text); // check your Metro terminal

  let body: any = null;
  try {
    body = JSON.parse(text);
  } catch {}

  const message =
    (typeof body?.error === "string" && body.error) ||
    (typeof body?.message === "string" && body.message) ||
    null;

  return new Error(message ?? fallback);
}

export async function fetchEvents(scope?: "mine"): Promise<EventDto[]> {
  const token = await getToken();
  const res = await fetch(
    `${API_URL}/api/events${scope ? `?scope=${scope}` : ""}`,
    { headers: authHeaders(token) },
  );

  if (res.status === 401) throw new Error("You need to sign in to see events.");
  if (!res.ok) throw new Error("Couldn't load events. Pull down to try again.");
  return res.json();
}

export async function fetchEvent(id: string): Promise<EventDetailDto> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    headers: authHeaders(token),
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
    headers: authHeaders(token),
  });

  if (res.status === 401)
    throw new Error("You need to sign in to buy a ticket.");
  if (res.status === 404)
    throw new Error("This ticket doesn't exist or was removed.");
  if (!res.ok) throw new Error("Couldn't load this ticket. Please try again.");
  return res.json();
}

export type TicketReservationDto = {
  reservationId: string;
  reservationItemId: string;
  ticketId: string;
  paymentRequired: boolean;
};

export type TableReservationDto = {
  reservationId: string;
  reservationItemId: string;
  ticketId: string;
  paymentRequired: boolean;
};

export async function createTicketReservation(
  ticketId: string,
): Promise<TicketReservationDto> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ ticketId }),
  });

  if (!res.ok) {
    throw await getApiError(
      res,
      "Couldn't reserve this ticket. Please try again.",
    );
  }
  const result: { data: TicketReservationDto } = await res.json();
  return result.data;
}

export async function createTableReservation(
  tableId: string,
): Promise<TableReservationDto> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ tableId }),
  });

  if (!res.ok) {
    throw await getApiError(
      res,
      "Couldn't reserve this table. Please try again.",
    );
  }
  const result: { data: TableReservationDto } = await res.json();
  return result.data;
}

export async function submitPayment(
  reservationItemId: string,
  referenceNum: string,
  screenshotUrl: string,
) {
  const token = await getToken();
  // Debug: log what is sent. Remove once payments work.
  console.log("submitPayment ->", `${API_URL}/api/payments`, {
    reservationItemId,
    referenceNum,
    screenshotUrl,
    hasToken: !!token,
  });
  const res = await fetch(`${API_URL}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ reservationItemId, referenceNum, screenshotUrl }),
  });

  if (res.status === 401) throw new Error("You need to sign in to pay.");
  if (!res.ok) {
    throw await getApiError(
      res,
      "Couldn't send your payment. Please try again.",
    );
  }
  return res.json();
}
