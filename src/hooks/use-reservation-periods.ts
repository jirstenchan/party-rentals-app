import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import {
  groupReservationsByEventTime,
  type ReservationSchedule,
} from "@/lib/reservation-api";

const MAX_TIMEOUT_MS = 2_147_483_647;

export function useReservationPeriods<T extends ReservationSchedule>(
  reservations: readonly T[] | null,
) {
  const [now, setNow] = useState(Date.now);
  const periods = useMemo(
    () => groupReservationsByEventTime(reservations ?? [], now),
    [reservations, now],
  );
  const { nextEventEnd } = periods;

  useFocusEffect(
    useCallback(() => {
      if (!Number.isFinite(nextEventEnd)) return;
      let timer: ReturnType<typeof setTimeout> | undefined;

      function updateAtEventEnd() {
        const currentTime = Date.now();
        if (currentTime >= nextEventEnd) {
          setNow(currentTime);
        } else {
          timer = setTimeout(
            updateAtEventEnd,
            Math.min(nextEventEnd - currentTime, MAX_TIMEOUT_MS),
          );
        }
      }

      updateAtEventEnd();
      return () => clearTimeout(timer);
    }, [nextEventEnd]),
  );

  return periods;
}
