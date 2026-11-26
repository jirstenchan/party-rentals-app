const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const ts = require("typescript");

function loadReservationApi(fetch) {
  const code = ts.transpileModule(
    readFileSync(require.resolve("../src/lib/reservation-api.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const api = {};
  new Function("exports", "require", "fetch", code)(
    api,
    (name) => {
      assert.equal(name, "@/lib/supabase");
      return { supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } };
    },
    fetch,
  );
  return api;
}

test("My Tickets keeps ongoing events visible and moves tickets to history at the end time", async () => {
  const now = Date.parse("2026-11-26T12:00:00Z");
  const minute = 60_000;
  const row = (id, start, end, attributes = {}) => ({
    reservationItemId: id,
    reservationStatus: "Confirmed",
    itemType: "ticket",
    eventStartTime: new Date(now + start * minute).toISOString(),
    eventEndTime: new Date(now + end * minute).toISOString(),
    ...attributes,
  });
  const rows = [
    row("later", 60, 120),
    row("earlier-finish", -100, -20),
    row("next", 10, 50, { reservationStatus: "Pending" }),
    row("denied", 10, 50, { reservationStatus: "Denied" }),
    row("table", 10, 50, { itemType: "table" }),
    row("just-finished", -200, 0),
    row("ongoing", -90, 15),
  ];
  const api = loadReservationApi(async () => ({ ok: true, json: async () => ({ data: rows }) }));

  const tickets = await api.fetchMyTickets();
  const ids = (items) => items.map((item) => item.reservationItemId);
  const initial = api.groupReservationsByEventTime(tickets, now);
  assert.deepEqual(ids(initial.upcoming), ["ongoing", "next", "later"]);
  assert.deepEqual(ids(initial.history), ["just-finished", "earlier-finish"]);
  assert.equal(initial.nextEventEnd, now + 15 * minute);

  const atEnd = api.groupReservationsByEventTime(tickets, initial.nextEventEnd);
  assert.deepEqual(ids(atEnd.upcoming), ["next", "later"]);
  assert.deepEqual(ids(atEnd.history), ["ongoing", "just-finished", "earlier-finish"]);
});

test("table history uses existing event end times when the tables endpoint omits them", async () => {
  const eventEndTime = "2026-11-26T12:00:00Z";
  const confirmed = {
    reservationItemId: "table-booking",
    reservationStatus: "Confirmed",
    eventId: "event-id",
    eventStartTime: "2026-11-26T10:00:00Z",
    guestNames: ["Guest one"],
  };
  const controller = new AbortController();
  const requests = [];
  const api = loadReservationApi(async (url, { signal }) => {
    assert.equal(signal, controller.signal);
    const { pathname, search } = new URL(url);
    requests.push(pathname + search);
    return {
      ok: true,
      json: async () => ({
        data: pathname === "/api/reservations/tables"
          ? [confirmed]
          : [{ eventId: "event-id", eventEndTime }],
      }),
    };
  });

  const [booking] = await api.fetchMyTableReservations(controller.signal);
  assert.deepEqual(booking, { ...confirmed, eventEndTime });
  const { upcoming, history } = api.groupReservationsByEventTime([booking], Date.parse(eventEndTime));
  assert.deepEqual(upcoming, []);
  assert.deepEqual(history, [booking]);

  assert.deepEqual(await api.fetchMyTableReservations(controller.signal, "table-booking"), [confirmed]);
  assert.deepEqual(requests, [
    "/api/reservations/tables",
    "/api/reservations?scope=mine",
    "/api/reservations/tables?reservationItemId=table-booking",
  ]);
});
