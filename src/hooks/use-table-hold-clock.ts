import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useTableHoldClock(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }, [enabled]),
  );

  return now;
}

export function tableHoldSeconds(
  expiresAt: string | null | undefined,
  now: number,
) {
  return expiresAt
    ? Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000))
    : null;
}

export function formatTableHoldTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
