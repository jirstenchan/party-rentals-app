import { createThemeStyles } from "@/hooks/use-theme";
import { ConfirmCreateModal } from "@/components/event/create-event-confirmation-modal";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, type ComponentRef, type ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

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
  onInvalidField: (field: ComponentRef<typeof View>) => void;
};

type EventToCreate = {
  name: string;
  description: string;
  location: string;
  capacity: number;
  startTime: Date;
  endTime: Date;
  map: PickedImage;
  qrPayment: PickedImage;
  eventGraphicImage: PickedImage;
  tickets: NewTicket[];
  tables: NewTable[];
};

export function CreateEventForm({ onCreated, onInvalidField }: Props) {
  const { theme, styles } = useStyles();
  const [eventToConfirm, setEventToConfirm] = useState<EventToCreate | null>(null);
  const creating = useRef(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startClock, setStartClock] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endClock, setEndClock] = useState("");
  const [validationTime, setValidationTime] = useState<number | null>(null);
  const [tickets, setTickets] = useState<NewTicket[]>([]);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [map, setMap] = useState<PickedImage | null>(null);
  const [qrPayment, setQrPayment] = useState<PickedImage | null>(null);
  const [tables, setTables] = useState<NewTable[]>([]);
  const [tableModalVisible, setTableModalVisible] = useState(false);
  const [eventGraphicImage, setEventGraphicImage] =
    useState<PickedImage | null>(null);

  const title = name.trim();
  const summary = description.trim();
  const venue = location.trim();
  const capacityNumber = Number(capacity);
  const startTime = parseLocalDateTime(startDate, startClock);
  const endTime = parseLocalDateTime(endDate, endClock);
  const eventErrors = (at: number | null) => ({
    coverPhoto: !eventGraphicImage ? "Add an event cover photo." : null,
    title: !title ? "Enter an event title." : null,
    description: !summary ? "Enter an event description." : null,
    startDate: !startDate
      ? "Select a start date."
      : startClock && !startTime
        ? "Choose a valid start date and time."
        : null,
    startClock: !startClock
      ? "Select a start time."
      : startTime && at !== null && startTime.getTime() <= at
        ? "Choose a start date and time in the future."
        : null,
    endDate: !endDate
      ? "Select an end date."
      : endClock && !endTime
        ? "Choose a valid end date and time."
        : null,
    endClock: !endClock
      ? "Select an end time."
      : startTime && endTime && endTime <= startTime
        ? "The event must end after it starts."
        : null,
    location: !venue ? "Enter the event location." : null,
    capacity: !capacity.trim()
      ? "Enter the event capacity."
      : !Number.isInteger(capacityNumber) || capacityNumber <= 0
        ? "Capacity must be a positive whole number."
        : null,
    map: !map ? "Upload a venue map." : null,
    qrPayment: !qrPayment ? "Upload a payment QR code." : null,
    tickets: tickets.length === 0 ? "Add at least one ticket." : null,
  });
  const validationErrors = eventErrors(validationTime);
  type FieldName = keyof typeof validationErrors;
  const fieldViews = useRef<
    Partial<Record<FieldName, ComponentRef<typeof View> | null>>
  >({});
  const scheduleFields = [
    {
      label: "Start",
      dateField: "startDate",
      clockField: "startClock",
      date: startDate,
      clock: startClock,
      setDate: setStartDate,
      setClock: setStartClock,
      initialDate: undefined,
    },
    {
      label: "End",
      dateField: "endDate",
      clockField: "endClock",
      date: endDate,
      clock: endClock,
      setDate: setEndDate,
      setClock: setEndClock,
      initialDate: startDate,
    },
  ] as const;

  function renderField(
    field: FieldName,
    control: ReactNode,
    style?: StyleProp<ViewStyle>,
  ) {
    const error = validationTime !== null ? validationErrors[field] : null;
    return (
      <View
        collapsable={false}
        ref={(view) => {
          fieldViews.current[field] = view;
        }}
        style={[styles.field, style]}
      >
        {control}
        {error ? (
          <Text accessibilityRole="alert" style={styles.validationError}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  }

  function resetForm() {
    setName("");
    setDescription("");
    setLocation("");
    setCapacity("");
    setStartDate("");
    setStartClock("");
    setEndDate("");
    setEndClock("");
    setValidationTime(null);
    setTickets([]);
    setTables([]);
    setMap(null);
    setQrPayment(null);
    setEventGraphicImage(null);
  }

  function reviewEvent() {
    if (creating.current) return;
    setStatus("");
    const now = Date.now();
    setValidationTime(now);
    const errors = eventErrors(now);
    const firstInvalid = (Object.keys(errors) as FieldName[]).find(
      (field) => errors[field] !== null,
    );
    if (firstInvalid) {
      const field = fieldViews.current[firstInvalid];
      if (field) onInvalidField(field);
      return;
    }
    if (
      !startTime ||
      !endTime ||
      !map ||
      !qrPayment ||
      !eventGraphicImage
    ) {
      return;
    }

    setEventToConfirm({
      name: title,
      description: summary,
      location: venue,
      capacity: capacityNumber,
      startTime,
      endTime,
      map,
      qrPayment,
      eventGraphicImage,
      tickets,
      tables,
    });
  }

  async function handleCreate(event: EventToCreate) {
    if (creating.current) return;
    creating.current = true;
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

      const uploadedMap = await uploadEventImage(event.map);
      uploadedMapPath = uploadedMap.path;
      const uploadedQr = await uploadHostQr(event.qrPayment);
      uploadedQrPath = uploadedQr.path;
      const uploadedGraphic = await uploadEventGraphic(event.eventGraphicImage);
      uploadedGraphicImagePath = uploadedGraphic.path;

      const created = await createEvent({
        name: event.name,
        description: event.description,
        location: event.location,
        capacity: event.capacity,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        status: "published",
        mapUrl: uploadedMap.publicUrl,
        paymentQrUrl: uploadedQr.publicUrl,
        eventImageUrl: uploadedGraphic.publicUrl,
      });

      const ticketResults = await Promise.allSettled(
        event.tickets.map((ticket) =>
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
        event.tables.map((table) => addTable({ eventId: created.id, ...table })),
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
    } finally {
      creating.current = false;
    }
  }

  const isCreating = status === "Creating...";
  const isError =
    !!status &&
    !isCreating &&
    !status.startsWith("Created:") &&
    !status.startsWith("The event was created");

  return (
    <View style={styles.form}>
      {/* Photo and title */}
      <View style={styles.titleRow}>
        {renderField(
          "coverPhoto",
          <ImagePickerField
            value={eventGraphicImage}
            onChange={setEventGraphicImage}
            text="Add event cover photo"
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
                <Text style={styles.coverPhotoLabel}>Cover photo</Text>
              </View>
            )}
          </ImagePickerField>,
          styles.coverPhotoField,
        )}

        {renderField(
          "title",
          <FormInput
            label="Event Title"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rooftop Vibes"
            cardStyle={styles.titleCard}
          />,
          styles.fieldColumn,
        )}
      </View>

      {renderField(
        "description",
        <FormInput
          label="Event Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell people what to expect..."
          multiline
          cardStyle={styles.descriptionCard}
        />,
      )}

      <View style={styles.schedule}>
        {scheduleFields.map(
          ({ label, dateField, clockField, date, clock, setDate, setClock, initialDate }) => (
            <View key={label} style={styles.scheduleGroup}>
              <Text style={styles.scheduleLabel}>{label}</Text>
              <View style={styles.scheduleRow}>
                {renderField(
                  dateField,
                  <DateTimePartField
                    label={`${label} date`}
                    mode="date"
                    value={date}
                    initialDate={initialDate}
                    onChange={setDate}
                  />,
                  styles.fieldColumn,
                )}
                {renderField(
                  clockField,
                  <DateTimePartField
                    label={`${label} time`}
                    mode="time"
                    value={clock}
                    onChange={setClock}
                  />,
                  styles.fieldColumn,
                )}
              </View>
            </View>
          ),
        )}
      </View>

      {renderField(
        "location",
        <FormInput
          label="Venue / Location"
          value={location}
          onChangeText={setLocation}
          placeholder="Where is it happening?"
          icon={<Ionicons name="location-outline" size={30} color={theme.text} />}
          cardStyle={styles.venueCard}
        />,
      )}

      {renderField(
        "capacity",
        <FormInput
          label="Capacity"
          value={capacity}
          onChangeText={(value) => setCapacity(value.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 100"
          keyboardType="numeric"
          cardStyle={styles.capacityCard}
        />,
      )}

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

      {renderField(
        "map",
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
        </ImagePickerField>,
      )}

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

      {renderField(
        "qrPayment",
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
        </ImagePickerField>,
      )}

      {/* Ticket drafts */}
      {renderField(
        "tickets",
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tickets</Text>

          <Pressable onPress={() => setTicketModalVisible(true)}>
            <Text style={styles.sectionAction}>+ Add Tickets</Text>
          </Pressable>
        </View>,
      )}

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
        <Text style={styles.sectionTitle}>Tables (optional)</Text>

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
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.status, isError && styles.statusError]}
        >
          {status}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isCreating, busy: isCreating }}
        onPress={reviewEvent}
        disabled={isCreating}
        style={({ pressed }) => [
          styles.createButton,
          (pressed || isCreating) && styles.createButtonPressed,
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
          visible={eventToConfirm !== null}
          onCancel={() => setEventToConfirm(null)}
          onConfirm={() => {
            if (eventToConfirm) {
              setEventToConfirm(null);
              void handleCreate(eventToConfirm);
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
  field: {
    gap: 4,
  },
  fieldColumn: {
    flex: 1,
    minWidth: 0,
  },
  coverPhotoField: {
    width: COVER_PHOTO_SIZE,
  },
  coverPhoto: {
    width: COVER_PHOTO_SIZE,
    height: COVER_PHOTO_SIZE,
    borderRadius: 14,
    backgroundColor: theme.accentSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPhotoLabel: {
    color: theme.textSecondary,
    fontSize: 12,
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
  validationError: {
    color: theme.danger,
    fontSize: 14,
    lineHeight: 21,
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
