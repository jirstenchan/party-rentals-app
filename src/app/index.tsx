import { Redirect } from "expo-router";
import { useSession } from "@/hooks/use-session";
import { useOnboarding } from "@/lib/onboarding";

export default function Index() {
  const session = useSession();
  const { seen } = useOnboarding();

  if (!seen) return <Redirect href="/onboarding-1" />;
  if (session) return <Redirect href="/home" />;
  return <Redirect href="/login" />;
}
