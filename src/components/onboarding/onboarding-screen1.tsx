import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#6C2CF5";
const INACTIVE = "#D1D1D6";
const SKIP_GRAY = "#716D78";

type PaginationProps = {
  total: number;
  activeIndex: number;
};

// Active dot is a violet pill, the rest are small gray circles.
function Pagination({ total, activeIndex }: PaginationProps) {
  return (
    <View style={styles.pagination}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen1() {
  const router = useRouter();

  const handleSkip = () => {
    router.replace("/onboarding-3");
  };

  const handleNext = () => {
    router.push("/onboarding-2");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Static design + "Discover Events" text + description */}
      <View style={styles.imageWrapper}>
        <Image
          source={require("../../../assets/images/onboarding/onboarding-1.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Pagination total={3} activeIndex={0} />

      <View style={styles.footer}>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <Pressable onPress={handleNext} hitSlop={12} style={styles.nextButton}>
          <Text style={styles.nextText}>Next</Text>
          <Ionicons name="chevron-forward" size={22} color={PRIMARY} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  imageWrapper: {
    flex: 1,
  },

  image: {
    width: "100%",
    height: "100%",
    transform: [{ translateY: -30 }],
  },

  pagination: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: INACTIVE,
  },

  dotActive: {
    width: 40,
    backgroundColor: PRIMARY,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingBottom: 24,
    height: 88,
    transform: [{ translateY: 5 }],
  },

  skipText: {
    fontSize: 18,
    fontWeight: "600",
    color: SKIP_GRAY,
  },

  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  nextText: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
  },
});
