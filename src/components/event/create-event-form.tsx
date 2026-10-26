import { useState } from "react";
import { Button, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DateTimeField } from "@/components/event/date-time-field";
import { FormInput } from "@/components/event/form-input";
import { TicketDraftList } from "@/components/event/ticket-draft-list";
import { TicketModal } from "@/components/event/ticket-modal";
import { Spacing } from "@/constants/theme";
import { createEvent, deleteEvent } from "@/data/event";
import { problemFor } from "@/data/problem";
import { addTicket, NewTicket } from "@/data/ticket";
import { ImagePickerField } from "@/components/event/image-picker-field";
import {
  deleteEventImage,
  deleteHostQr,
  deleteEventGraphic,
  PickedImage,
  uploadEventImage,
  uploadHostQr,
  uploadEventGraphic,
} from "@/data/image";

const HOUR = 60 * 60 * 1000;

type Props = {
  onCreated: () => void | Promise<void>;
};

export function CreateEventForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + HOUR));
  const [tickets, setTickets] = useState<NewTicket[]>([]);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [map, setMap] = useState<PickedImage | null>(null);
  const [qrPayment, setQrPayment] = useState<PickedImage | null>(null);
  const [eventGraphicImage, setEventGraphicImage] =
    useState<PickedImage | null>(null);

  function resetForm() {
    const now = new Date();
    setName("");
    setDescription("");
    setLocation("");
    setCapacity("");
    setStartTime(now);
    setEndTime(new Date(now.getTime() + HOUR));
    setTickets([]);
    setMap(null);
    setQrPayment(null);
    setEventGraphicImage(null);
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

      const results = await Promise.allSettled(
        tickets.map((t) => addTicket({ eventId: created.id, ...t })),
      );

      if (results.some((r) => r.status === "rejected")) {
        // Every event needs a ticket, so undo the event and keep the form filled in
        await deleteEvent(created.id).catch(() => {});
        const cleanupSucceeded = await cleanupUploadedImages();
        setStatus(
          "Couldn't save the tickets, so the event wasn't created. Try again." +
            (cleanupSucceeded ? "" : " Uploaded images may need cleanup."),
        );
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

  return (
    <ThemedView style={styles.form}>
      <FormInput value={name} onChangeText={setName} placeholder="Event Name" />
      <FormInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
      />
      <FormInput
        value={location}
        onChangeText={setLocation}
        placeholder="Event Location"
      />
      <FormInput
        value={capacity}
        onChangeText={(v) => setCapacity(v.replace(/[^0-9]/g, ""))}
        placeholder="Capacity"
        keyboardType="numeric"
      />

      <DateTimeField label="Starts" value={startTime} onChange={setStartTime} />
      <DateTimeField label="Ends" value={endTime} onChange={setEndTime} />

      <TicketDraftList
        tickets={tickets}
        onRemove={(i) =>
          setTickets((prev) => prev.filter((_, idx) => idx !== i))
        }
      />

      <Button
        title="+ Add ticket"
        onPress={() => setTicketModalVisible(true)}
      />
      <Button title="Create test event" onPress={handleCreate} />

      {status ? <ThemedText>{status}</ThemedText> : null}

      <TicketModal
        visible={ticketModalVisible}
        onClose={() => setTicketModalVisible(false)}
        onSave={(ticket) => setTickets((prev) => [...prev, ticket])}
      />

      <ImagePickerField
        value={map}
        onChange={setMap}
        text={"+ Add Venue Map"}
      />

      <ImagePickerField
        value={qrPayment}
        onChange={setQrPayment}
        text={"+ Add QR payment"}
        aspect={[1, 1]}
      />

      <ImagePickerField
        value={eventGraphicImage}
        onChange={setEventGraphicImage}
        text={"+ Add Event Image"}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
});
