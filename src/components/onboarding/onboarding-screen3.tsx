import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#6C2CF5";
const INACTIVE = "#D1D1D6";

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

export default function OnboardingScreen3() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Static design + "Reserve & Enjoy" text + description */}
      <View style={styles.imageWrapper}>
        <Image
          source={require("../../../assets/images/onboarding/onboarding-3.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Pagination total={3} activeIndex={2} />

      <View style={styles.footer}>
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Get started</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  button: {
    backgroundColor: PRIMARY,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
