import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import type { EventDto } from "@/lib/events-api";

type EventSchedule = Pick<EventDto, "startTime" | "status">;
const MAX_TIMEOUT_MS = 2_147_483_647;

export function isUpcomingEvent(event: EventSchedule, now: number) {
  return event.status !== "cancelled" && Date.parse(event.startTime) > now;
}

export function useEventStartClock(events: readonly EventSchedule[]) {
  const [now, setNow] = useState(Date.now);
  const nextStart = events.reduce(
    (next, event) =>
      isUpcomingEvent(event, now)
        ? Math.min(next, Date.parse(event.startTime))
        : next,
    Infinity,
  );

  useFocusEffect(
    useCallback(() => {
      if (!Number.isFinite(nextStart)) return;
      let timer: ReturnType<typeof setTimeout> | undefined;

      function updateAtStart() {
        const currentTime = Date.now();
        if (currentTime >= nextStart) {
          setNow(currentTime);
        } else {
          timer = setTimeout(updateAtStart, Math.min(nextStart - currentTime, MAX_TIMEOUT_MS));
        }
      }

      updateAtStart();
      return () => clearTimeout(timer);
    }, [nextStart]),
  );

  return now;
}
