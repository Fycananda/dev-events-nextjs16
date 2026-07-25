import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { IBooking } from "@/types/booking";

describe("IBooking", () => {
  it("accepts a fully populated booking object", () => {
    const now = new Date();
    const eventId = new ObjectId();
    const _id = new ObjectId();

    const booking: IBooking = {
      _id,
      eventId,
      email: "attendee@example.com",
      createdAt: now,
      updatedAt: now,
    };

    expect(booking._id).toBe(_id);
    expect(booking.eventId).toBe(eventId);
    expect(booking.email).toBe("attendee@example.com");
    expect(booking.createdAt).toBe(now);
    expect(booking.updatedAt).toBe(now);
  });

  it("allows _id to be omitted for documents not yet persisted", () => {
    const now = new Date();
    const booking: IBooking = {
      eventId: new ObjectId(),
      email: "attendee@example.com",
      createdAt: now,
      updatedAt: now,
    };

    expect(booking._id).toBeUndefined();
  });
});