import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLayoutEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "@/lib/onboarding";

const SLIDES = [
  {
    title: "Discover Events",
    image: require("../../../assets/images/onboarding/onboarding-1.png"),
  },
  {
    title: "Choose How You Party",
    image: require("../../../assets/images/onboarding/onboarding-2.png"),
  },
  {
    title: "Reserve & Enjoy",
    image: require("../../../assets/images/onboarding/onboarding-3.png"),
  },
];

const LAST_PAGE = SLIDES.length - 1;
const PRIMARY = "#6C2CF5";
const DOT_SLOT = 44;
const DOT_SIZE = 10;
const INDICATOR_WIDTH = 32;

export default function OnboardingCarousel() {
  const { complete } = useOnboarding();
  const scrollView = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [activePage, setActivePage] = useState(0);
  const currentPage = useRef(0);
  const { width, height } = viewport;

  function measureViewport({ nativeEvent }: LayoutChangeEvent) {
    const { width, height } = nativeEvent.layout;
    setViewport({ width, height });
  }

  useLayoutEffect(() => {
    // Keep the current slide aligned when the viewport changes size.
    const x = currentPage.current * width;
    scrollView.current?.scrollTo({ x, animated: false });
    scrollX.setValue(x);
  }, [scrollX, width]);

  useLayoutEffect(() => {
    currentPage.current = activePage;
  }, [activePage]);

  function goToPage(page: number) {
    scrollView.current?.scrollTo({ x: page * width, animated: true });
  }

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: Platform.OS !== "web",
        listener: ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
          const page = Math.min(
            LAST_PAGE,
            Math.max(0, Math.round(nativeEvent.contentOffset.x / width)),
          );
          setActivePage(page);
        },
      }),
    [scrollX, width],
  );

  const indicatorX = scrollX.interpolate({
    inputRange: [0, Math.max(1, width) * LAST_PAGE],
    outputRange: [0, DOT_SLOT * LAST_PAGE],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.viewport} onLayout={measureViewport}>
        {width > 0 && (
          <Animated.ScrollView
            ref={scrollView}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
          >
            {SLIDES.map(({ title, image }, index) => (
              <View
                key={title}
                style={{ width, height }}
                aria-hidden={index !== activePage}
                importantForAccessibility={
                  index === activePage ? "auto" : "no-hide-descendants"
                }
              >
                <Image
                  source={image}
                  style={styles.image}
                  contentFit="contain"
                  accessible
                  accessibilityLabel={title}
                />
              </View>
            ))}
          </Animated.ScrollView>
        )}
      </View>

      <View style={styles.pagination}>
        {SLIDES.map(({ title }, index) => (
          <Pressable
            key={title}
            accessibilityRole="button"
            accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}, ${title}`}
            accessibilityState={{ selected: index === activePage }}
            aria-current={index === activePage ? "step" : undefined}
            onPress={() => goToPage(index)}
            style={styles.dotControl}
          >
            <View style={styles.dot} />
          </Pressable>
        ))}
        <Animated.View
          style={[styles.indicator, { transform: [{ translateX: indicatorX }] }]}
        />
      </View>

      <View style={styles.footer}>
        {activePage === LAST_PAGE ? (
          <Pressable
            accessibilityRole="button"
            onPress={complete}
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
          >
            <Text style={styles.startText}>Get Started</Text>
          </Pressable>
        ) : (
          <View style={styles.navigation}>
            <Pressable
              accessibilityRole="button"
              onPress={() => goToPage(LAST_PAGE)}
              style={styles.control}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => goToPage(activePage + 1)}
              style={styles.control}
            >
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="chevron-forward" size={22} color={PRIMARY} />
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  viewport: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    alignSelf: "center",
    flexDirection: "row",
  },
  dotControl: {
    width: DOT_SLOT,
    height: DOT_SLOT,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#D1D1D6",
  },
  indicator: {
    position: "absolute",
    top: (DOT_SLOT - DOT_SIZE) / 2,
    left: (DOT_SLOT - INDICATOR_WIDTH) / 2,
    width: INDICATOR_WIDTH,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: PRIMARY,
    pointerEvents: "none",
  },
  footer: {
    height: 88,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  navigation: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  control: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skipText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#716D78",
  },
  nextText: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY,
  },
  startButton: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonPressed: {
    opacity: 0.85,
  },
  startText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
