import { ConfirmCreateModal } from "@/components/event/create-event-confirmation-modal";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { DateTimeField } from "@/components/event/date-time-field";
import { FormInput } from "@/components/event/form-input";
import { TicketDraftList } from "@/components/event/ticket-draft-list";
import { TicketModal } from "@/components/event/ticket-modal";
import { createEvent, deleteEvent } from "@/data/event";
import { problemFor } from "@/data/problem";
import { addTicket, type NewTicket } from "@/data/ticket";

const PURPLE = "#6B2CF5";
const HOUR = 60 * 60 * 1000;

type Props = {
  onCreated: () => void | Promise<void>;
};

export function CreateEventForm({ onCreated }: Props) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + HOUR));
  const [tickets, setTickets] = useState<NewTicket[]>([]);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [status, setStatus] = useState("");

  function resetForm() {
    const now = new Date();

    setName("");
    setDescription("");
    setLocation("");
    setCapacity("");
    setStartTime(now);
    setEndTime(new Date(now.getTime() + HOUR));
    setTickets([]);
  }

  async function handleCreate() {
    const capacityNumber = Number(capacity);

    if (
      !name.trim() ||
      !description.trim() ||
      !location.trim() ||
      !capacity.trim()
    ) {
      setStatus("Please fill in all fields.");
      return;
    }

    if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
      setStatus("Capacity must be a positive whole number.");
      return;
    }

    if (endTime <= startTime) {
      setStatus("End time must be after start time.");
      return;
    }

    if (tickets.length === 0) {
      setStatus("Add at least one ticket.");
      return;
    }

    try {
      setStatus("Creating...");

      const created = await createEvent({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        capacity: capacityNumber,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "published",
      });

      const results = await Promise.allSettled(
        tickets.map((ticket) =>
          addTicket({
            eventId: created.id,
            ...ticket,
          }),
        ),
      );

      if (results.some((result) => result.status === "rejected")) {
        // Preserve your classmate's rollback behavior.
        await deleteEvent(created.id).catch(() => {});

        setStatus(
          "Couldn't save the tickets, so the event wasn't created. Try again.",
        );
        return;
      }

      setStatus(`Created: ${created.name}`);
      resetForm();
      await onCreated();
    } catch (e) {
      setStatus("Create failed: " + problemFor(e));
    }
  }

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

  const isError =
    !!status && status !== "Creating..." && !status.startsWith("Created:");

  return (
    <View style={styles.form}>
      {/* Photo and title */}
      <View style={styles.titleRow}>
        {/* TODO: photo upload is not implemented. */}
        <View style={styles.coverPhoto}>
          <Ionicons name="image-outline" size={32} color="#8A8A93" />
        </View>

        <FormInput
          label="Event Title"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rooftop Vibes"
          containerStyle={styles.titleColumn}
          cardStyle={styles.titleCard}
        />
      </View>

      <FormInput
        label="Event Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Tell people what to expect..."
        multiline
        cardStyle={styles.descriptionCard}
      />

      {/* Date card: both dates remain independent. */}
      <View style={styles.dateCard}>
        <Ionicons name="calendar-outline" size={34} color="#000" />

        <View style={styles.flex}>
          <Text style={styles.cardLabel}>Date</Text>

          <View style={styles.dateChoices}>
            <DateTimeField
              label="Starts"
              value={startTime}
              onChange={setStartTime}
              renderTrigger={(open) => (
                <Pressable onPress={open}>
                  <Text style={styles.cardSub}>
                    Start: {formatDate(startTime)}
                  </Text>
                </Pressable>
              )}
            />

            <DateTimeField
              label="Ends"
              value={endTime}
              onChange={setEndTime}
              renderTrigger={(open) => (
                <Pressable onPress={open}>
                  <Text style={styles.cardSub}>End: {formatDate(endTime)}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>

        <Ionicons name="chevron-down" size={18} color="#000" />
      </View>

      {/* Start and end time cards */}
      <View style={styles.timeRow}>
        <DateTimeField
          label="Starts"
          value={startTime}
          onChange={setStartTime}
          containerStyle={styles.timeColumn}
          renderTrigger={(open) => (
            <Pressable onPress={open} style={styles.timeCard}>
              <Ionicons name="stopwatch-outline" size={30} color="#000" />

              <View style={styles.flex}>
                <Text style={styles.timeLabel} numberOfLines={1}>
                  Start Time
                </Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {formatTime(startTime)}
                </Text>
              </View>

              <Ionicons name="chevron-down" size={18} color="#000" />
            </Pressable>
          )}
        />

        <DateTimeField
          label="Ends"
          value={endTime}
          onChange={setEndTime}
          containerStyle={styles.timeColumn}
          renderTrigger={(open) => (
            <Pressable onPress={open} style={styles.timeCard}>
              <Ionicons name="stopwatch-outline" size={30} color="#000" />

              <View style={styles.flex}>
                <Text style={styles.timeLabel} numberOfLines={1}>
                  End Time
                </Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {formatTime(endTime)}
                </Text>
              </View>

              <Ionicons name="chevron-down" size={18} color="#000" />
            </Pressable>
          )}
        />
      </View>

      <FormInput
        label="Venue / Location"
        value={location}
        onChangeText={setLocation}
        placeholder="Where is it happening?"
        icon={<Ionicons name="location-outline" size={36} color="#000" />}
        cardStyle={styles.venueCard}
      />

      <FormInput
        label="Capacity"
        value={capacity}
        onChangeText={(value) => setCapacity(value.replace(/[^0-9]/g, ""))}
        placeholder="e.g. 100"
        keyboardType="numeric"
        cardStyle={styles.capacityCard}
      />

      {/* Venue map placeholder */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Venue Map</Text>
        <Text style={styles.sectionAction}>+ Add Map</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Ionicons name="image-outline" size={72} color="#85858F" />
        <Text style={styles.mapPlaceholderText}>Upload Venue Map</Text>
      </View>

      {/* Real ticket drafts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tickets</Text>

        <Pressable onPress={() => setTicketModalVisible(true)}>
          <Text style={styles.sectionAction}>+ Add Tickets</Text>
        </Pressable>
      </View>

      <TicketDraftList
        tickets={tickets}
        onRemove={(index) =>
          setTickets((previous) =>
            previous.filter((_, ticketIndex) => ticketIndex !== index),
          )
        }
      />

      {/* TODO: tables remain a visual placeholder. */}
      <View style={[styles.sectionHeader, styles.tablesHeader]}>
        <Text style={styles.sectionTitle}>Tables</Text>
        <Text style={styles.sectionAction}>+ Add Tables</Text>
      </View>

      <View style={styles.tableCard}>
        <Image
          source={require("../../../assets/images/table-icon.png")}
          style={styles.tableIcon}
          resizeMode="contain"
        />

        <View style={styles.flex}>
          <Text style={styles.listTitle}>Table 1</Text>
          <Text style={styles.listSub}>8 seats · ₱ 1,500 each</Text>
        </View>

        <View style={styles.editButton}>
          <Text style={styles.editText}>Edit</Text>
        </View>
      </View>

      {status ? (
        <Text style={[styles.status, isError && styles.statusError]}>
          {status}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setConfirmVisible(true)}
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.createButtonPressed,
        ]}
      >
        <Text style={styles.createButtonText}>Create Event</Text>
      </Pressable>

      <TicketModal
        visible={ticketModalVisible}
        onClose={() => setTicketModalVisible(false)}
        onSave={(ticket) => setTickets((previous) => [...previous, ticket])}
      />

      <ConfirmCreateModal
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          void handleCreate();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  flex: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  titleColumn: {
    flex: 1,
  },
  coverPhoto: {
    width: 96,
    height: 96,
    borderRadius: 14,
    backgroundColor: "#E6E3F5",
    alignItems: "center",
    justifyContent: "center",
  },
  titleCard: {
    minHeight: 96,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
  },
  descriptionCard: {
    minHeight: 96,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  dateCard: {
    borderWidth: 1.5,
    borderColor: "#D4D4D4",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 64,
  },
  dateChoices: {
    gap: 5,
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  cardSub: {
    fontSize: 12,
    color: "#B3B3B3",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  timeColumn: {
    flex: 1,
  },
  timeCard: {
    borderWidth: 1.5,
    borderColor: "#D4D4D4",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  venueCard: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 84,
  },
  capacityCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  tablesHeader: {
    marginTop: 18,
  },
  tableIcon: {
    width: 44,
    height: 44,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  sectionAction: {
    fontSize: 17,
    fontWeight: "500",
    color: PURPLE,
  },
  mapPlaceholder: {
    height: 300,
    borderRadius: 20,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 22,
    fontWeight: "500",
    color: "#85858F",
  },
  tableCard: {
    borderWidth: 1.5,
    borderColor: "#D4D4D4",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 84,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  listSub: {
    fontSize: 13.5,
    color: "#7A7A7A",
    marginTop: 4,
  },
  editButton: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  editText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  status: {
    color: "#000",
    fontSize: 14,
    textAlign: "center",
  },
  statusError: {
    color: "#D93025",
  },
  createButton: {
    backgroundColor: "#6C2CF5",
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

// Tyrone's
// import { useState } from "react";
// import { Button, StyleSheet } from "react-native";

// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { DateTimeField } from "@/components/event/date-time-field";
// import { FormInput } from "@/components/event/form-input";
// import { TicketDraftList } from "@/components/event/ticket-draft-list";
// import { TicketModal } from "@/components/event/ticket-modal";
// import { Spacing } from "@/constants/theme";
// import { createEvent, deleteEvent } from "@/data/event";
// import { problemFor } from "@/data/problem";
// import { addTicket, NewTicket } from "@/data/ticket";

// const HOUR = 60 * 60 * 1000;

// type Props = {
//   onCreated: () => void | Promise<void>;
// };

// export function CreateEventForm({ onCreated }: Props) {
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [location, setLocation] = useState("");
//   const [capacity, setCapacity] = useState("");
//   const [startTime, setStartTime] = useState(new Date());
//   const [endTime, setEndTime] = useState(new Date(Date.now() + HOUR));
//   const [tickets, setTickets] = useState<NewTicket[]>([]);
//   const [ticketModalVisible, setTicketModalVisible] = useState(false);
//   const [status, setStatus] = useState("");

//   function resetForm() {
//     const now = new Date();
//     setName("");
//     setDescription("");
//     setLocation("");
//     setCapacity("");
//     setStartTime(now);
//     setEndTime(new Date(now.getTime() + HOUR));
//     setTickets([]);
//   }

//   async function handleCreate() {
//     const capacityNumber = Number(capacity);

//     if (
//       !name.trim() ||
//       !description.trim() ||
//       !location.trim() ||
//       !capacity.trim()
//     ) {
//       setStatus("Please fill in all fields.");
//       return;
//     }
//     if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
//       setStatus("Capacity must be a positive whole number.");
//       return;
//     }
//     if (endTime <= startTime) {
//       setStatus("End time must be after start time.");
//       return;
//     }
//     if (tickets.length === 0) {
//       setStatus("Add at least one ticket.");
//       return;
//     }

//     try {
//       setStatus("Creating...");

//       const created = await createEvent({
//         name: name.trim(),
//         description: description.trim(),
//         location: location.trim(),
//         capacity: capacityNumber,
//         startTime: startTime.toISOString(),
//         endTime: endTime.toISOString(),
//         status: "published",
//       });

//       const results = await Promise.allSettled(
//         tickets.map((t) => addTicket({ eventId: created.id, ...t })),
//       );

//       if (results.some((r) => r.status === "rejected")) {
//         // Every event needs a ticket, so undo the event and keep the form filled in
//         await deleteEvent(created.id).catch(() => {});
//         setStatus(
//           "Couldn't save the tickets, so the event wasn't created. Try again.",
//         );
//         return;
//       }

//       setStatus(`Created: ${created.name}`);
//       resetForm();
//       await onCreated();
//     } catch (e) {
//       setStatus("Create failed: " + problemFor(e));
//     }
//   }

//   return (
//     <ThemedView style={styles.form}>
//       <FormInput value={name} onChangeText={setName} placeholder="Event Name" />
//       <FormInput
//         value={description}
//         onChangeText={setDescription}
//         placeholder="Description"
//         multiline
//       />
//       <FormInput
//         value={location}
//         onChangeText={setLocation}
//         placeholder="Event Location"
//       />
//       <FormInput
//         value={capacity}
//         onChangeText={(v) => setCapacity(v.replace(/[^0-9]/g, ""))}
//         placeholder="Capacity"
//         keyboardType="numeric"
//       />

//       <DateTimeField label="Starts" value={startTime} onChange={setStartTime} />
//       <DateTimeField label="Ends" value={endTime} onChange={setEndTime} />

//       <TicketDraftList
//         tickets={tickets}
//         onRemove={(i) =>
//           setTickets((prev) => prev.filter((_, idx) => idx !== i))
//         }
//       />

//       <Button
//         title="+ Add ticket"
//         onPress={() => setTicketModalVisible(true)}
//       />
//       <Button title="Create test event" onPress={handleCreate} />

//       {status ? <ThemedText>{status}</ThemedText> : null}

//       <TicketModal
//         visible={ticketModalVisible}
//         onClose={() => setTicketModalVisible(false)}
//         onSave={(ticket) => setTickets((prev) => [...prev, ticket])}
//       />
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   form: {
//     gap: Spacing.three,
//     alignItems: "center",
//     paddingHorizontal: Spacing.four,
//     paddingVertical: Spacing.six,
//   },
// });
