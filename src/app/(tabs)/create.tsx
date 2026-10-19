import { useState } from "react";
import {
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { createEvent, deleteEvent, Event, listMyEvents } from "@/data/event";
import { problemFor } from "@/data/problem";
import { DateTimeField } from "@/components/event/date-time-field";

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);

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

  async function handleRefresh() {
    try {
      const list = await listMyEvents();
      setEvents(list);
    } catch (e) {
      setStatus("List failed: " + problemFor(e));
    }
  }

  // *============ Form Creation Variables ===========
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [status, setStatus] = useState("");

  async function handleCreate() {
    try {
      // Validate required fields
      if (
        !name.trim() ||
        !description.trim() ||
        !location.trim() ||
        !capacity.trim()
      ) {
        setStatus("Please fill in all fields.");
        return;
      }

      // Validate capacity
      const capacityNumber = Number(capacity);

      if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
        setStatus("Capacity must be a positive whole number.");
        return;
      }

      // Convert date-time strings to Date objects
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setStatus("Please enter valid start and end times.");
        return;
      }

      if (end <= start) {
        setStatus("End time must be after start time.");
        return;
      }

      setStatus("Creating...");

      const created = await createEvent({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        capacity: capacityNumber,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: "published",
      });

      setStatus(`Created: ${created.name}`);

      // Clear the form
      setName("");
      setDescription("");
      setLocation("");
      setCapacity("");
      const nextStart = new Date();
      setStartTime(nextStart);
      setEndTime(new Date(nextStart.getTime() + 60 * 60 * 1000));

      await handleRefresh();
    } catch (e) {
      setStatus("Create failed: " + problemFor(e));
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
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          {/* Event Name */}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Event Name"
            placeholderTextColor="gray"
            style={styles.inputBox}
          />

          {/* Description */}
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            placeholderTextColor="gray"
            multiline
            style={styles.inputBox}
          />

          {/* Location */}
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Event Location"
            placeholderTextColor="gray"
            style={styles.inputBox}
          />

          {/* Capacity */}
          <TextInput
            value={capacity}
            onChangeText={(value) => setCapacity(value.replace(/[^0-9]/g, ""))}
            placeholder="Capacity"
            placeholderTextColor="gray"
            keyboardType="numeric"
            style={styles.inputBox}
          />

          {/* Start Date and Time */}
          <DateTimeField
            label="Starts"
            value={startTime}
            onChange={setStartTime}
          />
          <DateTimeField label="Ends" value={endTime} onChange={setEndTime} />
          <Button title="Create test event" onPress={handleCreate} />
          <Button title="Refresh list" onPress={handleRefresh} />

          {status ? <ThemedText>{status}</ThemedText> : null}
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          {events.map((ev) => (
            <ThemedView key={ev.id} style={styles.eventRow}>
              <ThemedText type="smallBold">{ev.name}</ThemedText>
              <ThemedText>
                {ev.status} · {new Date(ev.startTime).toLocaleString()}
              </ThemedText>
              <Button title="Delete" onPress={() => handleDelete(ev.id)} />
            </ThemedView>
          ))}
        </ThemedView>
        {Platform.OS === "web" && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  sectionsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  eventRow: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    borderColor: "white",
    color: "white",
  },
});
