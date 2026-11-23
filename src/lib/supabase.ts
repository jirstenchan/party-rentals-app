import { createClient } from "@supabase/supabase-js";
import "expo-sqlite/localStorage/install";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY!;
console.log("SUPABASE URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
export const supabase = createClient(url, key, {
  auth: {
    // Static web rendering runs without browser storage.
    storage: typeof localStorage === "undefined" ? undefined : localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
