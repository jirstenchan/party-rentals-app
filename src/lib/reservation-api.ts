import { supabase } from "@/lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type ReservationStatus = "Pending" | "Confirmed" | "Denied" | "Cancelled" | "Expired";

export type ReservationRowDto = {
  reservationId: string;
  reservationStatus: ReservationStatus;
  reservationItemId: string;
  itemType: "ticket" | "table";
  itemName: string | null;
  unitPrice: number;
  eventId: string;
  eventName: string;
  eventStartTime: string;
  eventEndTime: string;
};

export type MyTicket = ReservationRowDto & {
  itemType: "ticket";
  reservationStatus: "Pending" | "Confirmed";
};

export type MyTableReservation = {
  reservationItemId: string;
  reservationStatus: ReservationStatus;
  eventId: string;
  eventName: string;
  eventStartTime: string;
  eventEndTime?: string;
  tableLabel: string;
  capacity: number | null;
  unitPrice: number;
  paymentSubmitted: boolean;
  expiresAt: string | null;
  guestNames: string[];
};

export type ReservationSchedule = Pick<
  ReservationRowDto,
  "reservationItemId" | "eventStartTime"
> & { eventEndTime?: string };

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function fetchMyReservations(
  signal?: AbortSignal,
): Promise<ReservationRowDto[]> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/reservations?scope=mine`, {
    headers: authHeaders(token),
    signal,
  });

  if (res.status === 401) throw new Error("You need to sign in.");
  if (!res.ok) throw new Error("Couldn't load reservations.");
  const body: { data: ReservationRowDto[] } = await res.json();
  return body.data;
}

export async function fetchMyTableReservations(
  signal?: AbortSignal,
  reservationItemId?: string,
): Promise<MyTableReservation[]> {
  const token = await getToken();
  const filter = reservationItemId
    ? `?reservationItemId=${encodeURIComponent(reservationItemId)}`
    : "";
  const res = await fetch(`${API_URL}/api/reservations/tables${filter}`, {
    headers: authHeaders(token),
    signal,
  });
  if (res.status === 401) throw new Error("You need to sign in.");
  if (!res.ok) throw new Error("Couldn't load table reservations.");
  const body: { data: MyTableReservation[] } = await res.json();
  if (reservationItemId || body.data.every((booking) => booking.eventEndTime)) {
    return body.data;
  }

  // Older versions of the tables endpoint omit the end time.
  const reservations = await fetchMyReservations(signal);
  const eventEndTimes = new Map(
    reservations.map((row) => [row.eventId, row.eventEndTime] as const),
  );
  return body.data.map((booking) => ({
    ...booking,
    eventEndTime: booking.eventEndTime ?? eventEndTimes.get(booking.eventId),
  }));
}

export async function saveTableGuestNames(
  reservationItemId: string,
  names: string[],
  savedCount: number,
): Promise<string[]> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/reservations/tables`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ reservationItemId, names, savedCount }),
  });
  if (res.status === 401) throw new Error("You need to sign in.");
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "Couldn't save guest names.");
  return body.data;
}

export async function cancelTableReservation(reservationItemId: string): Promise<void> {
  const token = await getToken();
  const id = encodeURIComponent(reservationItemId);
  const res = await fetch(`${API_URL}/api/reservations/tables?reservationItemId=${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (res.status === 401) throw new Error("You need to sign in.");
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Couldn't cancel this reservation.");
  }
}

export async function fetchMyTickets(signal?: AbortSignal): Promise<MyTicket[]> {
  const reservations = await fetchMyReservations(signal);

  return reservations.filter(
    (row): row is MyTicket =>
      row.itemType === "ticket" &&
      (row.reservationStatus === "Pending" ||
        row.reservationStatus === "Confirmed"),
  );
}

export function groupReservationsByEventTime<T extends ReservationSchedule>(
  reservations: readonly T[],
  now: number,
) {
  const upcoming: T[] = [];
  const history: T[] = [];
  let nextEventEnd = Infinity;

  for (const reservation of reservations) {
    const end = Date.parse(reservation.eventEndTime ?? "");
    if (end <= now) {
      history.push(reservation);
    } else {
      upcoming.push(reservation);
      if (end < nextEventEnd) nextEventEnd = end;
    }
  }

  upcoming.sort(
    (a, b) =>
      Date.parse(a.eventStartTime) - Date.parse(b.eventStartTime) ||
      a.reservationItemId.localeCompare(b.reservationItemId),
  );
  history.sort(
    (a, b) =>
      Date.parse(b.eventEndTime ?? "") - Date.parse(a.eventEndTime ?? "") ||
      a.reservationItemId.localeCompare(b.reservationItemId),
  );

  return { upcoming, history, nextEventEnd };
}
