import { ObjectId, Db } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { IBooking } from "@/types/booking";
import { getEventById } from "./events";

function validateEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

export async function createBooking(input: {
  eventId: ObjectId;
  email: string;
}) {
  const email = input.email.trim().toLowerCase();

  if (!validateEmail(email)) {
    throw new Error("Please provide a valid email address");
  }

  // gantinya BookingSchema.pre('save') yang cek event exists
  const event = await getEventById(input.eventId);
  if (!event) {
    throw new Error(`Event with ID ${input.eventId} does not exist`);
  }

  const now = new Date();
  const doc: IBooking = {
    eventId: input.eventId,
    email,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  try {
    const result = await db.collection<IBooking>("bookings").insertOne(doc);
    return { ...doc, _id: result.insertedId };
  } catch (err: any) {
    // gantinya unique index violation di Mongoose
    if (err.code === 11000) {
      throw new Error("This email has already booked this event");
    }
    throw err;
  }
}

export async function getBookingsByEvent(eventId: ObjectId) {
  const db = await getDb();
  return db
    .collection<IBooking>("bookings")
    .find({ eventId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function ensureBookingIndexes(db: Db) {
  const col = db.collection<IBooking>("bookings");
  await col.createIndex({ eventId: 1 });
  await col.createIndex({ eventId: 1, createdAt: -1 });
  await col.createIndex({ email: 1 });
  await col.createIndex(
    { eventId: 1, email: 1 },
    { unique: true, name: "uniq_event_email" },
  );
}
