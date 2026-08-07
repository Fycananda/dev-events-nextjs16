import { getDb } from "@/lib/mongodb";
import { IEvent } from "@/types/event";
import { ObjectId, Db } from "mongodb";

// --- Helper functions (persis sama, murni logic, gak nyentuh Mongoose sama sekali) ---
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) throw new Error("Invalid date format");
  return date.toISOString().split("T")[0];
}

function normalizeTime(timeString: string): string {
  const timeRegex = /^(\d{1,2}):(\d{2})(\s*(AM|PM))?$/i;
  const match = timeString.trim().match(timeRegex);
  if (!match) throw new Error("Invalid time format. Use HH:MM or HH:MM AM/PM");

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[4]?.toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  if (
    hours < 0 ||
    hours > 23 ||
    parseInt(minutes) < 0 ||
    parseInt(minutes) > 59
  ) {
    throw new Error("Invalid time values");
  }
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// --- Validasi manual (gantinya "required" + "maxlength" + "enum" di Schema) ---
function validateEvent(data: Partial<IEvent>) {
  if (!data.title?.trim()) throw new Error("Title is required");
  if (data.title.length > 100)
    throw new Error("Title cannot exceed 100 characters");
  if (!data.description?.trim()) throw new Error("Description is required");
  if (data.description.length > 1000)
    throw new Error("Description cannot exceed 1000 characters");
  if (!data.overview?.trim()) throw new Error("Overview is required");
  if (data.overview.length > 500)
    throw new Error("Overview cannot exceed 500 characters");
  if (!data.image?.trim()) throw new Error("Image URL is required");
  if (!data.venue?.trim()) throw new Error("Venue is required");
  if (!data.location?.trim()) throw new Error("Location is required");
  if (!data.date) throw new Error("Date is required");
  if (!data.time) throw new Error("Time is required");
  if (!["online", "offline", "hybrid"].includes(data.mode!)) {
    throw new Error("Mode must be either online, offline, or hybrid");
  }
  if (!data.audience?.trim()) throw new Error("Audience is required");
  if (typeof data.agenda !== "string" || !data.agenda.trim())
    throw new Error("Agenda is required and must be a string");
  if (!data.organizer?.trim()) throw new Error("Organizer is required");
  if (!data.tags?.length) throw new Error("At least one tag is required");
}

// --- "Pre-save hook" jadi cuma bagian dari fungsi create biasa ---
export async function createEvent(
  input: Omit<IEvent, "_id" | "slug" | "createdAt" | "updatedAt">,
) {
  validateEvent(input);

  const now = new Date();
  const doc: IEvent = {
    ...input,
    slug: generateSlug(input.title),
    date: normalizeDate(input.date),
    time: normalizeTime(input.time),
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  const result = await db.collection<IEvent>("events").insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getEventBySlug(slug: string) {
  const db = await getDb();
  return db.collection<IEvent>("events").findOne({ slug });
}

export async function getEventById(id: ObjectId) {
  const db = await getDb();
  return db.collection<IEvent>("events").findOne({ _id: id });
}

// --- "EventSchema.index(...)" jadi fungsi setup yang dipanggil sekali di awal ---
export async function ensureEventIndexes(db: Db) {
  const col = db.collection<IEvent>("events");
  await col.createIndex({ slug: 1 }, { unique: true });
  await col.createIndex({ date: 1, mode: 1 });
}
