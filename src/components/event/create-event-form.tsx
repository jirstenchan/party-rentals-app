import { createThemeStyles } from "@/hooks/use-theme";
import { ConfirmCreateModal } from "@/components/event/create-event-confirmation-modal";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import {
  DateTimePartField,
  parseLocalDateTime,
} from "@/components/event/date-time-field";
import { FormInput } from "@/components/event/form-input";
import { ImagePickerField } from "@/components/event/image-picker-field";
import { TableDraftList } from "@/components/event/table-draft-list";
import { TicketDraftList } from "@/components/event/ticket-draft-list";

import { TableModal } from "@/components/event/table-modal";
import { TicketModal } from "@/components/event/ticket-modal";
import { BrandColors, Radius } from "@/constants/theme";
import { createEvent, deleteEvent } from "@/data/event";
import {
  deleteEventGraphic,
  deleteEventImage,
  deleteHostQr,
  PickedImage,
  uploadEventGraphic,
  uploadEventImage,
  uploadHostQr,
} from "@/data/image";
import { problemFor } from "@/data/problem";
import { addTable, NewTable } from "@/data/table";
import { addTicket, NewTicket } from "@/data/ticket";


type Props = {
  onCreated: () => void | Promise<void>;
};

type EventSchedule = {
  startTime: Date;
  endTime: Date;
};

export function CreateEventForm({ onCreated }: Props) {
  const { theme, styles } = useStyles();
  const [scheduleToConfirm, setScheduleToConfirm] =
    useState<EventSchedule | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startClock, setStartClock] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endClock, setEndClock] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [tickets, setTickets] = useState<NewTicket[]>([]);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [map, setMap] = useState<PickedImage | null>(null);
  const [qrPayment, setQrPayment] = useState<PickedImage | null>(null);
  const [tables, setTables] = useState<NewTable[]>([]);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [eventGraphicImage, setEventGraphicImage] =
    useState<PickedImage | null>(null);

  function resetForm() {
    setName("");
    setDescription("");
    setLocation("");
    setCapacity("");
    setStartDate("");
    setStartClock("");
    setEndDate("");
    setEndClock("");
    setScheduleError("");
    setTickets([]);
    setTables([]);
    setMap(null);
    setQrPayment(null);
    setEventGraphicImage(null);
  }

  function reviewSchedule() {
    if (!startDate || !startClock || !endDate || !endClock) {
      setScheduleError("Choose a date and time for both the start and end.");
      return;
    }

    const startTime = parseLocalDateTime(startDate, startClock);
    const endTime = parseLocalDateTime(endDate, endClock);

    if (!startTime || !endTime) {
      setScheduleError(
        !startTime
          ? "Choose a valid start date and time."
          : "Choose a valid end date and time.",
      );
      return;
    }

    if (endTime <= startTime) {
      setScheduleError("The event must end after it starts.");
      return;
    }

    setScheduleError("");
    setScheduleToConfirm({ startTime, endTime });
  }

  async function handleCreate({ startTime, endTime }: EventSchedule) {
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

    if (tickets.length === 0) {
      setStatus("Add at least one ticket.");
      return;
    }

    let uploadedMapPath: string | null = null;
    let uploadedQrPath: string | null = null;
    let uploadedGraphicImagePath: string | null = null;

    async function cleanupUploadedImages() {
      const results = await Promise.allSettled([
        ...(uploadedMapPath ? [deleteEventImage(uploadedMapPath)] : []),
        ...(uploadedQrPath ? [deleteHostQr(uploadedQrPath)] : []),
        ...(uploadedGraphicImagePath
          ? [deleteEventGraphic(uploadedGraphicImagePath)]
          : []),
      ]);
      return results.every((result) => result.status === "fulfilled");
    }

    try {
      setStatus("Creating...");

      let mapUrl: string | null = null;
      let paymentQrUrl: string | null = null;
      let eventImageUrl: string | null = null;
      if (map) {
        const uploaded = await uploadEventImage(map);
        uploadedMapPath = uploaded.path;
        mapUrl = uploaded.publicUrl;
      }
      if (qrPayment) {
        const uploaded = await uploadHostQr(qrPayment);
        uploadedQrPath = uploaded.path;
        paymentQrUrl = uploaded.publicUrl;
      }
      if (eventGraphicImage) {
        const uploaded = await uploadEventGraphic(eventGraphicImage);
        uploadedGraphicImagePath = uploaded.path;
        eventImageUrl = uploaded.publicUrl;
      }

      const created = await createEvent({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        capacity: capacityNumber,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "published",
        mapUrl,
        paymentQrUrl,
        eventImageUrl,
      });

      const ticketResults = await Promise.allSettled(
        tickets.map((ticket) =>
          addTicket({
            eventId: created.id,
            ...ticket,
          }),
        ),
      );

      if (ticketResults.some((r) => r.status === "rejected")) {
        // Every event needs a ticket, so undo the event and keep the form filled in
        await deleteEvent(created.id).catch(() => {});
        const cleanupSucceeded = await cleanupUploadedImages();
        setStatus(
          "Couldn't save the tickets, so the event wasn't created. Try again." +
            (cleanupSucceeded ? "" : " Uploaded images may need cleanup."),
        );
        return;
      }

      // Tables are optional, so they are only submitted once tickets succeed
      const tableResults = await Promise.allSettled(
        tables.map((table) => addTable({ eventId: created.id, ...table })),
      );

      if (tableResults.some((r) => r.status === "rejected")) {
        // The event exists and uses the uploaded images, so don't clean them up
        setStatus(
          "The event was created, but some tables couldn't be saved. You can add them again later.",
        );
        resetForm();
        await onCreated();
        return;
      }

      setStatus(`Created: ${created.name}`);
      resetForm();
      await onCreated();
    } catch (e) {
      const cleanupSucceeded = await cleanupUploadedImages();
      setStatus(
        "Create failed: " +
          problemFor(e) +
          (cleanupSucceeded ? "" : " Uploaded images may need cleanup."),
      );
    }
  }

  const isError =
    !!status &&
    status !== "Creating..." &&
    !status.startsWith("Created:") &&
    !status.startsWith("The event was created");

  return (
    <View style={styles.form}>
      {/* Photo and title */}
      <View style={styles.titleRow}>
        <ImagePickerField
          value={eventGraphicImage}
          onChange={setEventGraphicImage}
          text=""
          showPreview={false}
        >
          {eventGraphicImage ? (
            <Image
              source={{ uri: eventGraphicImage.uri }}
              style={styles.eventImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverPhoto}>
              <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
            </View>
          )}
        </ImagePickerField>

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

      <View style={styles.schedule}>
        {[
          {
            label: "Start",
            date: startDate,
            clock: startClock,
            setDate: setStartDate,
            setClock: setStartClock,
          },
          {
            label: "End",
            date: endDate,
            clock: endClock,
            setDate: setEndDate,
            setClock: setEndClock,
            initialDate: startDate,
          },
        ].map(({ label, date, clock, setDate, setClock, initialDate }) => (
          <View key={label} style={styles.scheduleGroup}>
            <Text style={styles.scheduleLabel}>{label}</Text>
            <View style={styles.scheduleRow}>
              <DateTimePartField
                label={`${label} date`}
                mode="date"
                value={date}
                initialDate={initialDate}
                onChange={(value) => {
                  setDate(value);
                  setScheduleError("");
                }}
              />
              <DateTimePartField
                label={`${label} time`}
                mode="time"
                value={clock}
                onChange={(value) => {
                  setClock(value);
                  setScheduleError("");
                }}
              />
            </View>
          </View>
        ))}
        {scheduleError ? (
          <Text accessibilityRole="alert" style={styles.statusError}>
            {scheduleError}
          </Text>
        ) : null}
      </View>

      <FormInput
        label="Venue / Location"
        value={location}
        onChangeText={setLocation}
        placeholder="Where is it happening?"
        icon={<Ionicons name="location-outline" size={30} color={theme.text} />}
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

      {/* Venue map */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Venue Map</Text>
        <ImagePickerField
          value={map}
          onChange={setMap}
          text="+ Add Venue Map"
          changeText="Edit"
          showPreview={false}
        />
      </View>

      <ImagePickerField
        value={map}
        onChange={setMap}
        text="Upload Venue Map"
        showPreview={false}
      >
        {map ? (
          <Image
            source={{ uri: map.uri }}
            style={styles.mapImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="image-outline" size={72} color={theme.textSecondary} />
            <Text style={styles.mapPlaceholderText}>Upload Venue Map</Text>
          </View>
        )}
      </ImagePickerField>

      {/* QR Payment */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>QR Payment</Text>
        <ImagePickerField
          value={qrPayment}
          onChange={setQrPayment}
          text={"+ Add QR payment"}
          aspect={[1, 1]}
          changeText="Edit"
          showPreview={false}
        />
      </View>

      <ImagePickerField
        value={qrPayment}
        onChange={setQrPayment}
        text="Upload QR Payment"
        showPreview={false}
        aspect={[1, 1]}
      >
        {qrPayment ? (
          <Image
            source={{ uri: qrPayment.uri }}
            style={styles.qrImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="image-outline" size={72} color={theme.textSecondary} />
            <Text style={styles.mapPlaceholderText}>Upload QR Payment</Text>
          </View>
        )}
      </ImagePickerField>

      {/* Ticket drafts */}
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

      {/* Table drafts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tables</Text>

        <Pressable onPress={() => setTableModalVisible(true)}>
          <Text style={styles.sectionAction}>+ Add Tables</Text>
        </Pressable>
      </View>

      <TableDraftList
        tables={tables}
        onRemove={(index) =>
          setTables((previous) =>
            previous.filter((_, tableIndex) => tableIndex !== index),
          )
        }
      />

      {status ? (
        <Text style={[styles.status, isError && styles.statusError]}>
          {status}
        </Text>
      ) : null}

      <Pressable
        onPress={reviewSchedule}
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.createButtonPressed,
        ]}
      >
        <Text style={styles.createButtonText}>Create Event</Text>
      </Pressable>

      {/* Modals live in an absolute host so they don't add gap below the button */}
      <View style={styles.modalHost} pointerEvents="box-none">
        <TicketModal
          visible={ticketModalVisible}
          onClose={() => setTicketModalVisible(false)}
          onSave={(ticket) => setTickets((previous) => [...previous, ticket])}
        />

        <TableModal
          visible={tableModalVisible}
          onClose={() => setTableModalVisible(false)}
          onSave={(table) => setTables((previous) => [...previous, table])}
        />

        <ConfirmCreateModal
          visible={scheduleToConfirm !== null}
          onCancel={() => setScheduleToConfirm(null)}
          onConfirm={() => {
            if (scheduleToConfirm) {
              setScheduleToConfirm(null);
              void handleCreate(scheduleToConfirm);
            }
          }}
        />
      </View>
    </View>
  );
}

const COVER_PHOTO_SIZE = 96;

const useStyles = createThemeStyles((theme) => StyleSheet.create({
  form: {
    gap: 14,
  },
  modalHost: {
    position: "absolute",
    width: 0,
    height: 0,
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
    width: COVER_PHOTO_SIZE,
    height: COVER_PHOTO_SIZE,
    borderRadius: 14,
    backgroundColor: theme.accentSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  titleCard: {
    minHeight: 96,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "flex-start",
  },
  descriptionCard: {
    minHeight: 96,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  schedule: {
    gap: 12,
  },
  scheduleGroup: {
    gap: 6,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.text,
  },
  scheduleRow: {
    flexDirection: "row",
    gap: 10,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.text,
  },
  sectionAction: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.accent,
  },
  mapPlaceholder: {
    height: 300,
    borderRadius: 20,
    backgroundColor: theme.backgroundElement,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: "500",
    color: theme.textSecondary,
  },
  status: {
    color: theme.text,
    fontSize: 14,
    textAlign: "center",
  },
  statusError: {
    color: theme.danger,
  },
  createButton: {
    backgroundColor: BrandColors.purple,
    height: 55,
    borderRadius: Radius.large,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  mapImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
  },
  qrImage: {
    width: "100%",
    aspectRatio: 1 / 1,
    borderRadius: 8,
  },
  eventImage: {
    width: COVER_PHOTO_SIZE,
    height: COVER_PHOTO_SIZE,
    aspectRatio: 1,
    borderRadius: 8,
  },
}));
