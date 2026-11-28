import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { DateTimePartField } from "@/components/event/date-time-field";
import { TicketModal } from "@/components/event/ticket-modal";
import {
  AccountButton,
  AccountCard,
  AccountField,
  AccountMessage,
  AccountSettingsPage,
} from "@/components/settings/account-controls";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { updateEvent } from "@/data/event";
import { addTicket, extendTicketDeadline, type NewTicket } from "@/data/ticket";
import { isUpcomingEvent, useEventStartClock } from "@/hooks/use-event-start-clock";
import { useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { fetchEvent, type EventDetailDto, type EventTicketDto } from "@/lib/events-api";

type Feedback = { field: string; message: string; error?: boolean };

export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession();
  const theme = useTheme();
  const [event, setEvent] = useState<EventDetailDto | null>(null);
  const [loadError, setLoadError] = useState("");
  const now = useEventStartClock(event ? [event] : []);
  const currentEvent = event?.id === id ? event : null;

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchEvent(id).then(
      (result) => {
        if (active) {
          setLoadError("");
          setEvent(result);
        }
      },
      (error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load this event.");
        }
      },
    );
    return () => {
      active = false;
    };
  }, [id]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else if (id) {
      router.replace({ pathname: "/event/[id]", params: { id } });
    } else {
      router.replace("/my-events");
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AccountSettingsPage title="Edit Event" onBack={goBack}>
        {!id || loadError ? (
          <AccountMessage error>{loadError || "Event not found."}</AccountMessage>
        ) : !currentEvent || session === undefined ? (
          <ActivityIndicator color={theme.accent} />
        ) : session?.user.id !== currentEvent.hostId ? (
          <AccountMessage error>Only the event host can edit this event.</AccountMessage>
        ) : !isUpcomingEvent(currentEvent, now) ? (
          <AccountMessage error>Only upcoming events can be edited.</AccountMessage>
        ) : (
          <EventEditor key={currentEvent.id} initialEvent={currentEvent} />
        )}
      </AccountSettingsPage>
    </>
  );
}

function EventEditor({ initialEvent }: { initialEvent: EventDetailDto }) {
  const [event, setEvent] = useState(initialEvent);
  const [location, setLocation] = useState(initialEvent.location ?? "");
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [deadline, setDeadline] = useState<{ id: string; date: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const saving = useRef(false);

  async function save(field: string, change: () => Promise<string>) {
    if (saving.current) return;
    saving.current = true;
    setBusy(field);
    setFeedback(null);
    try {
      const message = await change();
      setFeedback({ field, message });
    } catch (error) {
      setFeedback({
        field,
        message: error instanceof Error ? error.message : "Could not save your changes.",
        error: true,
      });
    } finally {
      saving.current = false;
      setBusy(null);
    }
  }

  function saveLocation() {
    const nextLocation = location.trim();
    if (!nextLocation || nextLocation.length > 300) {
      setFeedback({
        field: "location",
        error: true,
        message: nextLocation ? "Location must be 300 characters or fewer." : "Enter the event location.",
      });
      return;
    }
    void save("location", async () => {
      const updated = await updateEvent(event.id, { location: nextLocation });
      setLocation(updated.location);
      setEvent((current) => ({ ...current, location: updated.location }));
      return "Location updated.";
    });
  }

  async function saveTicket(ticket: NewTicket) {
    const created = await addTicket({ ...ticket, eventId: event.id });
    setEvent((current) => ({
      ...current,
      tickets: [...current.tickets, created].sort((a, b) => a.ticketPrice - b.ticketPrice),
    }));
    setFeedback({ field: "tickets", message: "Ticket option added." });
  }

  function saveDeadline(ticket: EventTicketDto) {
    const date = deadline?.date;
    const today = new Date().toISOString().slice(0, 10);
    if (!date || !ticket.salesEnd || date <= ticket.salesEnd || date < today) {
      setFeedback({
        field: ticket.ticketId,
        error: true,
        message: "Choose a date on or after today and after the current sales deadline.",
      });
      return;
    }

    void save(ticket.ticketId, async () => {
      const updated = await extendTicketDeadline(ticket.ticketId, date);
      setEvent((current) => ({
        ...current,
        tickets: current.tickets.map((item) => item.ticketId === updated.ticketId ? updated : item),
      }));
      setDeadline(null);
      return "Sales deadline extended.";
    });
  }

  return (
    <>
      <ThemedText type="smallBold">{event.name}</ThemedText>

      <AccountCard>
        <AccountField
          label="Event location"
          value={location}
          onChangeText={setLocation}
          editable={busy === null}
          error={feedback?.field === "location" && feedback.error ? feedback.message : undefined}
        />
        <AccountButton
          label="Save location"
          onPress={saveLocation}
          busy={busy === "location"}
          disabled={busy !== null || location.trim() === event.location}
        />
        {feedback?.field === "location" && !feedback.error && (
          <AccountMessage>{feedback.message}</AccountMessage>
        )}
      </AccountCard>

      <View style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Ticket options</ThemedText>
        <AccountButton
          label="Add ticket option"
          onPress={() => setTicketModalVisible(true)}
          disabled={busy !== null}
          secondary
        />
        {feedback?.field === "tickets" && <AccountMessage>{feedback.message}</AccountMessage>}
      </View>

      {event.tickets.map((ticket) => (
        <AccountCard key={ticket.ticketId}>
          <ThemedText type="smallBold">{ticket.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {ticket.salesEnd ? `Sales deadline: ${ticket.salesEnd}` : "No sales deadline"}
          </ThemedText>
          {deadline?.id === ticket.ticketId ? (
            <View style={{ gap: Spacing.two }}>
              <DateTimePartField
                label="New sales deadline"
                mode="date"
                value={deadline.date}
                initialDate={ticket.salesEnd ?? undefined}
                onChange={(date) => setDeadline({ id: ticket.ticketId, date })}
              />
              {feedback?.field === ticket.ticketId && feedback.error && (
                <AccountMessage error>{feedback.message}</AccountMessage>
              )}
              <AccountButton
                label="Save deadline"
                onPress={() => saveDeadline(ticket)}
                busy={busy === ticket.ticketId}
                disabled={busy !== null}
              />
              <AccountButton
                label="Cancel"
                onPress={() => setDeadline(null)}
                disabled={busy !== null}
                secondary
              />
            </View>
          ) : ticket.salesEnd && (
            <AccountButton
              label="Extend deadline"
              onPress={() => {
                setFeedback(null);
                setDeadline({ id: ticket.ticketId, date: "" });
              }}
              disabled={busy !== null}
              secondary
            />
          )}
          {feedback?.field === ticket.ticketId && !feedback.error && (
            <AccountMessage>{feedback.message}</AccountMessage>
          )}
        </AccountCard>
      ))}

      <TicketModal
        visible={ticketModalVisible}
        onClose={() => setTicketModalVisible(false)}
        onSave={saveTicket}
      />
    </>
  );
}
