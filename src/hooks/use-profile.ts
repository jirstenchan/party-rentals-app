import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  email: string;
  role: string;
  host_name: string | null;
  avatar_url: string | null;
  name: string | null;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("email, role, host_name, avatar_url, name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setProfile(data);
    };

    getProfile();
  }, []);

  return profile;
}
