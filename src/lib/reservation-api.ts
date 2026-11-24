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
  tableLabel: string;
  capacity: number | null;
  unitPrice: number;
  paymentSubmitted: boolean;
  expiresAt: string | null;
  guestNames: string[];
};

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
  return body.data;
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
  const now = Date.now();

  return reservations
    .filter(
      (row): row is MyTicket =>
        row.itemType === "ticket" &&
        (row.reservationStatus === "Pending" ||
          row.reservationStatus === "Confirmed"),
    )
    .sort((a, b) => {
      const aEnded = Date.parse(a.eventEndTime) <= now;
      const bEnded = Date.parse(b.eventEndTime) <= now;
      if (aEnded !== bEnded) return aEnded ? 1 : -1;

      const startOrder =
        Date.parse(a.eventStartTime) - Date.parse(b.eventStartTime);
      return (
        (aEnded ? -startOrder : startOrder) ||
        a.reservationItemId.localeCompare(b.reservationItemId)
      );
    });
}
