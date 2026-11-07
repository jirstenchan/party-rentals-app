import { supabase } from "@/lib/supabase";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
export type ReservationRowDto = {
  reservationId: string;
  reservationStatus: string;
  reservationItemId: string;
  eventId: string;
};

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function fetchMyReservations(): Promise<ReservationRowDto[]> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/reservations?scope=mine`, {
    headers: authHeaders(token),
  });

  if (res.status === 401) throw new Error("You need to sign in.");
  if (!res.ok) throw new Error("Couldn't load reservations.");
  const body: { data: ReservationRowDto[] } = await res.json();
  return body.data;
}
