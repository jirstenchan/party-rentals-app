import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { fetchAccountProfile, type AccountProfile } from "@/lib/account-api";

export function useProfile() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchAccountProfile()
        .then((next) => {
          if (active) setProfile(next);
        })
        .catch(() => {
          if (active) setProfile(null);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return profile;
}
