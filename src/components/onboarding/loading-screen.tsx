import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  StyleSheet,
  View,
} from "react-native";

export default function LoadingScreen() {
  const router = useRouter();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        router.replace("/onboarding-1");
      }
    });

    // Stop the animation when the component unmounts.
    return () => animation.stop();
  }, [progress, router]);

  // Convert animation value into percentage width.
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <ImageBackground
      source={require("../../../assets/images/onboarding/loading-background.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.container}>
        {/* PartyLink Logo */}
        <Image
          source={require("../../../assets/images/onboarding/partylink-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Loading Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { width: progressWidth }]}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -50 }],
  },

  logo: {
    width: 320,
    height: 260,
  },

  progressContainer: {
    width: 286,
    height: 16,
    backgroundColor: "#F2F2F2",
    borderRadius: 100,
    overflow: "hidden",
    marginTop: 20,
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#6C2CF5",
    borderRadius: 100,
  },
});
