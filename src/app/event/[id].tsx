// src/app/event/[id].tsx
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <ThemedText>Event: {id}</ThemedText>
    </ThemedView>
  );
}
