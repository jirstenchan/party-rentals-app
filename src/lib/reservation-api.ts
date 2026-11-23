import { supabase } from "@/lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type ReservationRowDto = {
  reservationId: string;
  reservationStatus: "Pending" | "Confirmed" | "Denied";
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
