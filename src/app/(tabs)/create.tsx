import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateEventForm } from "@/components/event/create-event-form";
import { EventRow } from "@/components/event/event-row";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { deleteEvent, listMyEvents, type Event } from "@/data/event";
import { problemFor } from "@/data/problem";

const PURPLE = "#6B2CF5";

export default function CreateEventScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();

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
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

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
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace("/home")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
          >
            <Ionicons name="chevron-back" size={28} color={PURPLE} />
          </Pressable>

          <Text style={styles.headerTitle}>CREATE EVENT</Text>
        </View>

        <CreateEventForm onCreated={handleRefresh} />

        <View style={styles.eventsSection}>
          {status ? <Text style={styles.status}>{status}</Text> : null}

          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onDelete={handleDelete}
              onStatus={setStatus}
            />
          ))}
        </View>

        {Platform.OS === "web" && <WebBadge />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: PURPLE,
    fontSize: 26,
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
    color: PURPLE,
    fontSize: 15,
    fontWeight: "600",
  },
  status: {
    color: "#000",
    fontSize: 14,
    textAlign: "center",
  },
});

// Tyrone's
// import { useState } from "react";
// import {
//   Button,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   TextInput,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// import { WebBadge } from "@/components/web-badge";
// import { CreateEventForm } from "@/components/event/create-event-form";
// import { EventRow } from "@/components/event/event-row";
// import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
// import { useTheme } from "@/hooks/use-theme";
// import { createEvent, deleteEvent, Event, listMyEvents } from "@/data/event";
// import { problemFor } from "@/data/problem";
// import { DateTimeField } from "@/components/event/date-time-field";

// export default function CreateEventScreen() {
//   const safeAreaInsets = useSafeAreaInsets();
//   const router = useRouter();
//   const insets = {
//     ...safeAreaInsets,
//     bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
//   };
//   const [events, setEvents] = useState<Event[]>([]);
//   const [status, setStatus] = useState("");

//   const contentPlatformStyle = Platform.select({
//     android: {
//       paddingTop: insets.top,
//       paddingLeft: insets.left,
//       paddingRight: insets.right,
//     },
//     web: {
//       paddingTop: Spacing.six,
//       paddingBottom: Spacing.four,
//     },
//   });

//   async function handleRefresh() {
//     try {
//       setEvents(await listMyEvents());
//     } catch (e) {
//       setStatus("List failed: " + problemFor(e));
//     }
//   }

//   // *============ Form Creation Variables ===========
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [location, setLocation] = useState("");
//   const [capacity, setCapacity] = useState("");
//   const [startTime, setStartTime] = useState(new Date());
//   const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
//   const [status, setStatus] = useState("");

//   async function handleCreate() {
//     try {
//       // Validate required fields
//       if (
//         !name.trim() ||
//         !description.trim() ||
//         !location.trim() ||
//         !capacity.trim()
//       ) {
//         setStatus("Please fill in all fields.");
//         return;
//       }

//       // Validate capacity
//       const capacityNumber = Number(capacity);

//       if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
//         setStatus("Capacity must be a positive whole number.");
//         return;
//       }

//       // Convert date-time strings to Date objects
//       const start = new Date(startTime);
//       const end = new Date(endTime);

//       if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
//         setStatus("Please enter valid start and end times.");
//         return;
//       }

//       if (end <= start) {
//         setStatus("End time must be after start time.");
//         return;
//       }

//       setStatus("Creating...");

//       const created = await createEvent({
//         name: name.trim(),
//         description: description.trim(),
//         location: location.trim(),
//         capacity: capacityNumber,
//         startTime: start.toISOString(),
//         endTime: end.toISOString(),
//         status: "published",
//       });

//       setStatus(`Created: ${created.name}`);

//       // Clear the form
//       setName("");
//       setDescription("");
//       setLocation("");
//       setCapacity("");
//       const nextStart = new Date();
//       setStartTime(nextStart);
//       setEndTime(new Date(nextStart.getTime() + 60 * 60 * 1000));

//       await handleRefresh();
//     } catch (e) {
//       setStatus("Create failed: " + problemFor(e));
//     }
//   }

//   async function handleDelete(id: string) {
//     try {
//       await deleteEvent(id);
//       setStatus("Deleted");
//       await handleRefresh();
//     } catch (e) {
//       setStatus("Delete failed: " + problemFor(e));
//     }
//   }

//   // ---------- display-only helpers ----------
//   const fmtTime = (d: Date) =>
//     d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
//   // Placeholders match the design: MM/DD/YY and 00:00
//   const dateSummary = dateSet
//     ? startTime.toLocaleDateString("en-US", {
//         month: "2-digit",
//         day: "2-digit",
//         year: "2-digit",
//       })
//     : "MM/DD/YY";
//   const startSummary = startSet ? fmtTime(startTime) : "00:00";
//   const endSummary = endSet ? fmtTime(endTime) : "00:00";

//   // Messages that are not progress/success are shown in red
//   const isError =
//     !!status &&
//     status !== "Creating..." &&
//     status !== "Deleted" &&
//     !status.startsWith("Created:");

//   function handleValueChange(_event: unknown, selected: Date) {
//     const current = picker;

//     // Android shows a dialog: close it once a value is chosen
//     if (Platform.OS === "android") {
//       setPicker(null);
//     }

//     if (!selected || !current) return;

//     if (current === "date") {
//       // Apply the chosen day to both start and end, keeping their times
//       const withDay = (base: Date) => {
//         const d = new Date(base);
//         d.setFullYear(
//           selected.getFullYear(),
//           selected.getMonth(),
//           selected.getDate(),
//         );
//         return d;
//       };
//       setStartTime(withDay(startTime));
//       setEndTime(withDay(endTime));
//       markDateSet();
//     } else if (current === "start") {
//       setStartTime(selected);
//       markStartSet();
//     } else {
//       setEndTime(selected);
//       markEndSet();
//     }
//   }

//   return (
//     <ScrollView
//       style={styles.scrollView}
//       keyboardShouldPersistTaps="handled"
//       contentInset={insets}
//       contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
//     >
//       <ThemedView style={styles.container}>
//         <ThemedView style={styles.titleContainer}>
//           {/* Event Name */}
//           <TextInput
//             value={name}
//             onChangeText={setName}
//             placeholder="Event Name"
//             placeholderTextColor="gray"
//             style={styles.inputBox}
//           />

//           {/* Description */}
//           <TextInput
//             value={description}
//             onChangeText={setDescription}
//             placeholder="Description"
//             placeholderTextColor="gray"
//             multiline
//             style={styles.inputBox}
//           />

//           {/* Location */}
//           <TextInput
//             value={location}
//             onChangeText={setLocation}
//             placeholder="Event Location"
//             placeholderTextColor="gray"
//             style={styles.inputBox}
//           />

//           {/* Capacity */}
//           <TextInput
//             value={capacity}
//             onChangeText={(value) => setCapacity(value.replace(/[^0-9]/g, ""))}
//             placeholder="Capacity"
//             placeholderTextColor="gray"
//             keyboardType="numeric"
//             style={styles.inputBox}
//           />

//           {/* Start Date and Time */}
//           <DateTimeField
//             label="Starts"
//             value={startTime}
//             onChange={setStartTime}
//           />
//           <DateTimeField label="Ends" value={endTime} onChange={setEndTime} />
//           <Button title="Create test event" onPress={handleCreate} />
//           <Button title="Refresh list" onPress={handleRefresh} />

//           {status ? <ThemedText>{status}</ThemedText> : null}
//         </ThemedView>

//         <ThemedView style={styles.sectionsWrapper}>
//           {events.map((ev) => (
//             <ThemedView key={ev.id} style={styles.eventRow}>
//               <ThemedText type="smallBold">{ev.name}</ThemedText>
//               <ThemedText>
//                 {ev.status} · {new Date(ev.startTime).toLocaleString()}
//               </ThemedText>
//               <Button title="Delete" onPress={() => handleDelete(ev.id)} />
//             </ThemedView>
//           ))}
//         </ThemedView>
//         {Platform.OS === "web" && <WebBadge />}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   scrollView: {
//     flex: 1,
//   },
//   contentContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   container: {
//     maxWidth: MaxContentWidth,
//     flexGrow: 1,
//   },
//   titleContainer: {
//     gap: Spacing.three,
//     alignItems: "center",
//     paddingHorizontal: Spacing.four,
//     paddingVertical: Spacing.six,
//   },
//   sectionsWrapper: {
//     gap: Spacing.three,
//     paddingHorizontal: Spacing.four,
//     paddingTop: Spacing.three,
//   },
//   eventRow: {
//     gap: Spacing.one,
//     paddingVertical: Spacing.two,
//   },
//   inputBox: {
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 12,
//     borderColor: "white",
//     color: "white",
//   },
// });
