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

export type EventTicketDto = {
  ticketId: string;
  eventId: string;
  name: string;
  ticketPrice: number;
  salesStart: string | null;
  salesEnd: string | null;
};

export type EventDetailDto = EventDto & {
  description?: string | null;
  endTime?: string | null;
  tickets: EventTicketDto[];
};

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getApiError(res: Response, fallback: string): Promise<Error> {
  const body: unknown = await res.json().catch(() => null);
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return new Error(body.error);
  }
  return new Error(fallback);
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

export async function submitPayment(
  reservationItemId: string,
  referenceNum: string,
  screenshotUrl: string,
) {
  const token = await getToken();
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
