// Hardcoded data for the frontend build. - Will delete this later (after creating a backend for the venue map)
// TODO: replace with real fetchers (listEvents, getEvent, listTickets, listTables).

export type Ticket = {
  id: string;
  name: string;
  price: number;
};

export type EventTable = {
  id: string;
  name: string;
  seats: number; // total seats
  seatsTaken: number; // 6/8 => 6 taken. Table is disabled when full.
  pricePerSeat: number;
};

export type PartyEvent = {
  id: string;
  title: string;
  /** Feed card line, e.g. "Monday, October 5 • 7:00 PM" */
  dateLabel: string;
  /** Details screen, e.g. "Mon, October 5, 2026" */
  detailDate: string;
  /** Details screen, e.g. "7:00 PM - 12:00 AM" */
  detailTime: string;
  location: string;
  price: number;
  coverUri: string;
  galleryUris: string[];
  hostName: string;
  hostAvatarUri: string;
  description: string;
  /** Floor plan image (same one uploaded in Create Event). */
  venueMapUri: string;
  venueName: string;
  tickets: Ticket[];
  tables: EventTable[];
};

const img = (seed: string, w = 600, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export function formatPeso(amount: number) {
  return `₱ ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

const DEFAULT_DESCRIPTION =
  "Good music, great drinks, and even better company. Let’s come together, enjoy the moment, and make it a night to remember!";

const DEFAULT_TICKETS: Ticket[] = [
  { id: "early-bird", name: "Early Bird Ticket", price: 1500 },
  { id: "gen-ad", name: "Gen Ad Ticket", price: 1500 },
  { id: "vip", name: "VIP Ticket", price: 1500 },
];

const ROOFTOP_TABLES: EventTable[] = Array.from({ length: 8 }, (_, i) => ({
  id: `table-${i + 1}`,
  name: `Table ${i + 1}`,
  seats: 8,
  seatsTaken: i === 0 ? 6 : 8,
  pricePerSeat: 1500,
}));

export const MOCK_EVENTS: PartyEvent[] = [
  {
    id: "rooftop-vibes",
    title: "Rooftop Vibes",
    dateLabel: "Monday, October 5 • 7:00 PM",
    detailDate: "Mon, October 5, 2026",
    detailTime: "7:00 PM - 12:00 AM",
    location: "Cebu City",
    price: 1500,
    coverUri: img("rooftop-cover"),
    galleryUris: [
      img("rooftop-1", 900, 600),
      img("rooftop-2", 900, 600),
      img("rooftop-3", 900, 600),
    ],
    hostName: "Luna Garcia",
    hostAvatarUri: "https://i.pravatar.cc/200?img=47",
    description: DEFAULT_DESCRIPTION,
    venueName: "Rooftop Bar",
    venueMapUri: img("rooftop-map", 800, 1200),
    tickets: DEFAULT_TICKETS,
    tables: ROOFTOP_TABLES,
  },
  {
    id: "pool-party",
    title: "Pool Party",
    dateLabel: "Tuesday, October 6 • 8:00 PM",
    detailDate: "Tue, October 6, 2026",
    detailTime: "8:00 PM - 1:00 AM",
    location: "Cebu City",
    price: 2500,
    coverUri: img("pool-cover"),
    galleryUris: [img("pool-1", 900, 600), img("pool-2", 900, 600)],
    hostName: "Marco Reyes",
    hostAvatarUri: "https://i.pravatar.cc/200?img=12",
    description: DEFAULT_DESCRIPTION,
    venueName: "Poolside",
    venueMapUri: img("pool-map", 800, 1200),
    tickets: DEFAULT_TICKETS.map((t) => ({ ...t, price: 2500 })),
    tables: [],
  },
  {
    id: "house-party",
    title: "House Party",
    dateLabel: "Thursday, October 8 • 7:00 PM",
    detailDate: "Thu, October 8, 2026",
    detailTime: "7:00 PM - 12:00 AM",
    location: "Cebu City",
    price: 1400,
    coverUri: img("house-cover"),
    galleryUris: [img("house-1", 900, 600), img("house-2", 900, 600)],
    hostName: "Aira Santos",
    hostAvatarUri: "https://i.pravatar.cc/200?img=32",
    description: DEFAULT_DESCRIPTION,
    venueName: "The House",
    venueMapUri: img("house-map", 800, 1200),
    tickets: DEFAULT_TICKETS.map((t) => ({ ...t, price: 1400 })),
    tables: [],
  },
  {
    id: "live-music-night",
    title: "Live Music Night",
    dateLabel: "Sunday, October 11 • 7:00 PM",
    detailDate: "Sun, October 11, 2026",
    detailTime: "7:00 PM - 11:00 PM",
    location: "Cebu City",
    price: 1800,
    coverUri: img("live-cover"),
    galleryUris: [img("live-1", 900, 600), img("live-2", 900, 600)],
    hostName: "Jun Villanueva",
    hostAvatarUri: "https://i.pravatar.cc/200?img=15",
    description: DEFAULT_DESCRIPTION,
    venueName: "Main Stage",
    venueMapUri: img("live-map", 800, 1200),
    tickets: DEFAULT_TICKETS.map((t) => ({ ...t, price: 1800 })),
    tables: [],
  },
];

export function getEventById(id?: string) {
  return MOCK_EVENTS.find((e) => e.id === id);
}
