import { useRouter } from "expo-router";
import OnboardingScreen1 from "../components/onboarding/onboarding-screen1";

export default function Onboarding1Route() {
  const router = useRouter();

  const handleSkip = () => router.replace("/onboarding-3");
  const handleNext = () => router.push("/onboarding-2");

  return <OnboardingScreen1 />;
}
