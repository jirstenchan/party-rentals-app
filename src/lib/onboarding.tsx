// lib/onboarding.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const KEY = "onboarding_seen_v1"; // bump to v2 to show it again after a redesign

type OnboardingContextValue = {
  seen: boolean | undefined; // undefined = still reading storage
  complete: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue>({
  seen: undefined,
  complete: async () => {},
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setSeen(v === "1"))
      .catch(() => setSeen(false));
  }, []);

  const complete = useCallback(async () => {
    setSeen(true); // update UI immediately
    await AsyncStorage.setItem(KEY, "1").catch(console.error);
  }, []);

  return (
    <OnboardingContext.Provider value={{ seen, complete }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
