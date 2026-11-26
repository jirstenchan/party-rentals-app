import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import {
  AccountButton,
  AccountCard,
  AccountField,
  AccountMessage,
  AccountSettingsPage,
} from "@/components/settings/account-controls";
import {
  ReservationPeriodTabs,
  type ReservationPeriod,
} from "@/components/settings/reservation-period-tabs";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useReservationPeriods } from "@/hooks/use-reservation-periods";
import {
  formatTableHoldTime,
  tableHoldSeconds,
  useTableHoldClock,
} from "@/hooks/use-table-hold-clock";
import {
  cancelTableReservation,
  fetchMyTableReservations,
  saveTableGuestNames,
  type MyTableReservation,
} from "@/lib/reservation-api";

const eventDate = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });
const price = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});
const reservationStatus = {
  Pending: "Awaiting host approval",
  Confirmed: "Confirmed",
  Denied: "Reservation declined",
  Cancelled: "Reservation cancelled",
  Expired: "Table hold expired",
};

function GuestList({
  booking,
  onSaved,
}: {
  booking: MyTableReservation;
  onSaved?: (names: string[]) => void;
}) {
  const [draft, setDraft] = useState([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const remaining =
    booking.capacity === null
      ? Infinity
      : Math.max(0, booking.capacity - booking.guestNames.length);
  const names = draft.map((name) => name.trim()).filter(Boolean);

  async function save() {
    if (!onSaved || saving || names.length === 0 || names.length > remaining)
      return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      onSaved(
        await saveTableGuestNames(
          booking.reservationItemId,
          names,
          booking.guestNames.length,
        ),
      );
      setDraft([""]);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save guest names.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.guestList}>
      <ThemedText type="smallBold">Guest names</ThemedText>
      {booking.guestNames.map((name, index) => (
        <ThemedText key={index} type="small">
          {index + 1}. {name}
        </ThemedText>
      ))}
      {onSaved && remaining > 0 && (
        <>
          {draft.slice(0, remaining).map((name, index) => (
            <AccountField
              key={index}
              label={`Guest ${booking.guestNames.length + index + 1}`}
              value={name}
              editable={!saving}
              onChangeText={(text) => {
                setDraft((current) =>
                  current.map((value, i) => (i === index ? text : value)),
                );
                setSaved(false);
                setError("");
              }}
            />
          ))}
          {draft.length < remaining && draft.length < 255 && (
            <AccountButton
              label="Add another guest"
              onPress={() => setDraft((current) => [...current, ""])}
              disabled={saving || names.length !== draft.length}
              secondary
            />
          )}
          <AccountButton
            label="Save guest names"
            onPress={save}
            busy={saving}
            disabled={names.length === 0 || names.length > remaining}
          />
        </>
      )}
      {onSaved && remaining <= 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          All seats have a guest name.
        </ThemedText>
      )}
      {saved && <AccountMessage>Guest names saved.</AccountMessage>}
      {error && <AccountMessage error>{error}</AccountMessage>}
    </View>
  );
}

export default function MyTablesScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<ReservationPeriod>("Upcoming");
  const [bookings, setBookings] = useState<MyTableReservation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const reservations = useMemo(
    () =>
      bookings?.filter((booking) => booking.reservationStatus !== "Cancelled") ??
      null,
    [bookings],
  );
  const { upcoming, history } = useReservationPeriods(reservations);
  const isUpcoming = period === "Upcoming";
  const visibleBookings = isUpcoming ? upcoming : history;
  const now = useTableHoldClock(
    visibleBookings.some((booking) => !!booking.expiresAt),
  );

  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const rows = await fetchMyTableReservations(controller.signal);
      if (!controller.signal.aborted) setBookings(rows);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(
          err instanceof Error ? err.message : "Couldn't load table reservations.",
        );
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => request.current?.abort();
    }, [load]),
  );

  async function cancel(reservationItemId: string) {
    if (cancelling) return;
    setCancelling(reservationItemId);
    setError("");
    try {
      await cancelTableReservation(reservationItemId);
      setBookings((current) =>
        current?.map((booking) =>
          booking.reservationItemId === reservationItemId
            ? { ...booking, reservationStatus: "Cancelled", expiresAt: null }
            : booking,
        ) ?? null,
      );
    } catch (err) {
      await load();
      setError(
        err instanceof Error ? err.message : "Couldn't cancel this reservation.",
      );
    } finally {
      setCancelling(null);
    }
  }

  function updateGuestNames(reservationItemId: string, guestNames: string[]) {
    setBookings(
      (current) =>
        current?.map((booking) =>
          booking.reservationItemId === reservationItemId
            ? { ...booking, guestNames }
            : booking,
        ) ?? null,
    );
  }

  return (
    <AccountSettingsPage title="My Tables">
      <ReservationPeriodTabs period={period} onChange={setPeriod} />
      {bookings === null && loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <AccountButton
            label="Refresh reservations"
            onPress={load}
            busy={loading}
            disabled={cancelling !== null}
            secondary
          />
          {error && <AccountMessage error>{error}</AccountMessage>}
          {!error && bookings !== null && visibleBookings.length === 0 && (
            <AccountMessage>
              {isUpcoming
                ? "No upcoming table reservations."
                : "No table reservation history yet."}
            </AccountMessage>
          )}
          {visibleBookings.map((booking) => {
            const secondsLeft = tableHoldSeconds(booking.expiresAt, now);
            const state = secondsLeft === 0 ? "Expired" : booking.reservationStatus;
            const pending = state === "Pending";
            const canCancel = pending && !booking.paymentSubmitted;
            const needsPayment = canCancel && booking.unitPrice > 0;
            const status = needsPayment
              ? "Awaiting payment proof"
              : pending && booking.unitPrice > 0
                ? "Payment awaiting host approval"
                : reservationStatus[state];

            return (
              <AccountCard key={booking.reservationItemId}>
                <ThemedText type="subtitle">{booking.tableLabel}</ThemedText>
                <ThemedText type="small">
                  {booking.eventName} · {eventDate.format(new Date(booking.eventStartTime))}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {booking.unitPrice === 0 ? "Free" : price.format(booking.unitPrice)}
                </ThemedText>
                <ThemedText type="smallBold">{status}</ThemedText>
                {isUpcoming && needsPayment && secondsLeft !== null && (
                  <ThemedText type="small">
                    Time left to submit proof {formatTableHoldTime(secondsLeft)}
                  </ThemedText>
                )}
                {isUpcoming && needsPayment && (
                  <AccountButton
                    label="Submit payment proof"
                    disabled={loading || cancelling !== null}
                    onPress={() =>
                      router.push({
                        pathname: "/payment",
                        params: {
                          itemType: "table",
                          reservationItemId: booking.reservationItemId,
                        },
                      })
                    }
                  />
                )}
                {isUpcoming && canCancel && (
                  <AccountButton
                    label="Cancel reservation"
                    onPress={() => cancel(booking.reservationItemId)}
                    busy={cancelling === booking.reservationItemId}
                    disabled={loading || cancelling !== null}
                    secondary
                  />
                )}
                {booking.reservationStatus === "Confirmed" &&
                  (isUpcoming || booking.guestNames.length > 0) && (
                    <GuestList
                      booking={booking}
                      onSaved={
                        isUpcoming
                          ? (names) => updateGuestNames(booking.reservationItemId, names)
                          : undefined
                      }
                    />
                  )}
              </AccountCard>
            );
          })}
        </>
      )}
    </AccountSettingsPage>
  );
}

const styles = StyleSheet.create({
  guestList: { gap: Spacing.two, marginTop: Spacing.two },
});
