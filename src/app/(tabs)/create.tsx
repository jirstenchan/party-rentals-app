import { createThemeStyles } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateEventForm } from "@/components/event/create-event-form";
import { EventRow } from "@/components/event/event-row";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { deleteEvent, listMyEvents, type Event } from "@/data/event";
import { problemFor } from "@/data/problem";
import { useSetTabBarHidden } from "@/lib/tab-bar-visibility";


export default function CreateEventScreen() {
  const { theme, styles } = useStyles();
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const setTabBarHidden = useSetTabBarHidden();
  const scrollAnchor = useRef(0);

  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState("");

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  function handleScroll({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentInset, contentSize, layoutMeasurement } =
      nativeEvent;
    const maxOffset = Math.max(
      0,
      contentSize.height -
        layoutMeasurement.height +
        contentInset.top +
        contentInset.bottom,
    );
    // Ignore overscroll bounce at either end of the form.
    const offset = Math.min(
      maxOffset,
      Math.max(0, contentOffset.y + contentInset.top),
    );
    const delta = offset - scrollAnchor.current;

    if (offset === 0) {
      scrollAnchor.current = 0;
      setTabBarHidden(false);
    } else if (Math.abs(delta) >= 12) {
      scrollAnchor.current = offset;
      setTabBarHidden(delta > 0);
    }
  }

  async function handleRefresh() {
    try {
      setEvents(await listMyEvents());
    } catch (e) {
      setStatus("List failed: " + problemFor(e));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEvent(id);
      setStatus("Deleted");
      await handleRefresh();
    } catch (e) {
      setStatus("Delete failed: " + problemFor(e));
    }
  }

  return (
    <ScrollView
      style={styles.scrollView}
      keyboardShouldPersistTaps="handled"
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace("/home")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
          >
            <Ionicons name="chevron-back" size={28} color={theme.accent} />
          </Pressable>

          <Text style={styles.headerTitle}>CREATE EVENT</Text>
        </View>

        <CreateEventForm onCreated={handleRefresh} />

        {Platform.OS === "web" && <WebBadge />}
      </View>
    </ScrollView>
  );
}

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    color: theme.accent,
    fontSize: 22,
    fontWeight: "800",
  },
  eventsSection: {
    gap: 14,
  },
  refreshButton: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  refreshText: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  status: {
    color: theme.text,
    fontSize: 14,
    textAlign: "center",
  },
}));
