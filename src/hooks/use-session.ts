import { supabase } from "@/lib/supabase";
import { confirmedSession } from "@/lib/email-verification";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(confirmedSession(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event, next) =>
      setSession(confirmedSession(next)),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}
