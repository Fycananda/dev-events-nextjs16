import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const INSERTED_ID = new ObjectId("64b64e0f2c1a4f0012345679");

const insertOneMock = vi.fn();
const findMock = vi.fn();
const sortMock = vi.fn();
const toArrayMock = vi.fn();
const createIndexMock = vi.fn();
const collectionMock = vi.fn(() => ({
  insertOne: insertOneMock,
  find: findMock,
  createIndex: createIndexMock,
}));

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(async () => ({ collection: collectionMock })),
}));

const getEventByIdMock = vi.fn();
vi.mock("@/repository/events", () => ({
  getEventById: getEventByIdMock,
}));

import { createBooking, ensureBookingIndexes, getBookingsByEvent } from "@/repository/bookings";

describe("repository/bookings", () => {
  const eventId = new ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
    insertOneMock.mockResolvedValue({ insertedId: INSERTED_ID });
    createIndexMock.mockResolvedValue("index-name");
    getEventByIdMock.mockResolvedValue({ _id: eventId, title: "Some Event" });
    findMock.mockReturnValue({ sort: sortMock });
    sortMock.mockReturnValue({ toArray: toArrayMock });
    toArrayMock.mockResolvedValue([]);
  });

  describe("createBooking", () => {
    it("trims and lowercases the email before persisting", async () => {
      const result = await createBooking({
        eventId,
        email: "  Test@Example.COM  ",
      });

      expect(collectionMock).toHaveBeenCalledWith("bookings");
      expect(insertOneMock).toHaveBeenCalledTimes(1);

      const doc = insertOneMock.mock.calls[0][0];
      expect(doc.email).toBe("test@example.com");
      expect(doc.eventId).toBe(eventId);
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);

      expect(result._id).toEqual(INSERTED_ID);
      expect(result.email).toBe("test@example.com");
    });

    it("verifies the referenced event exists before inserting", async () => {
      await createBooking({ eventId, email: "user@example.com" });

      expect(getEventByIdMock).toHaveBeenCalledWith(eventId);
      expect(insertOneMock).toHaveBeenCalledTimes(1);

      const getEventOrder = getEventByIdMock.mock.invocationCallOrder[0];
      const insertOrder = insertOneMock.mock.invocationCallOrder[0];
      expect(getEventOrder).toBeLessThan(insertOrder);
    });

    it("throws when the referenced event does not exist", async () => {
      getEventByIdMock.mockResolvedValueOnce(null);

      await expect(
        createBooking({ eventId, email: "user@example.com" }),
      ).rejects.toThrow(`Event with ID ${eventId} does not exist`);

      expect(insertOneMock).not.toHaveBeenCalled();
    });

    it.each([
      "plainaddress",
      "@missinguser.com",
      "user@.com",
      "user@@example.com",
      "user name@example.com",
      "",
    ])("rejects the invalid email %j", async (email) => {
      await expect(createBooking({ eventId, email })).rejects.toThrow(
        "Please provide a valid email address",
      );
      expect(getEventByIdMock).not.toHaveBeenCalled();
      expect(insertOneMock).not.toHaveBeenCalled();
    });

    it.each([
      "user@example.com",
      "USER.name+tag@sub.example.co.uk",
      "a@b.co",
    ])("accepts the valid email %j", async (email) => {
      await expect(
        createBooking({ eventId, email }),
      ).resolves.toMatchObject({ email: email.trim().toLowerCase() });
    });

    it("translates a duplicate key error (code 11000) into a friendly message", async () => {
      const duplicateError = Object.assign(
        new Error("E11000 duplicate key error"),
        { code: 11000 },
      );
      insertOneMock.mockRejectedValueOnce(duplicateError);

      await expect(
        createBooking({ eventId, email: "user@example.com" }),
      ).rejects.toThrow("This email has already booked this event");
    });

    it("rethrows unexpected database errors as-is", async () => {
      const unexpectedError = new Error("connection lost");
      insertOneMock.mockRejectedValueOnce(unexpectedError);

      await expect(
        createBooking({ eventId, email: "user@example.com" }),
      ).rejects.toThrow("connection lost");
    });
  });

  describe("getBookingsByEvent", () => {
    it("queries bookings for the given event sorted by newest first", async () => {
      const bookings = [{ email: "a@example.com" }];
      toArrayMock.mockResolvedValueOnce(bookings);

      const result = await getBookingsByEvent(eventId);

      expect(collectionMock).toHaveBeenCalledWith("bookings");
      expect(findMock).toHaveBeenCalledWith({ eventId });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toBe(bookings);
    });

    it("returns an empty array when there are no bookings", async () => {
      toArrayMock.mockResolvedValueOnce([]);
      const result = await getBookingsByEvent(eventId);
      expect(result).toEqual([]);
    });
  });

  describe("ensureBookingIndexes", () => {
    it("creates all expected indexes, including the unique compound index", async () => {
      await ensureBookingIndexes();

      expect(collectionMock).toHaveBeenCalledWith("bookings");
      expect(createIndexMock).toHaveBeenNthCalledWith(1, { eventId: 1 });
      expect(createIndexMock).toHaveBeenNthCalledWith(2, {
        eventId: 1,
        createdAt: -1,
      });
      expect(createIndexMock).toHaveBeenNthCalledWith(3, { email: 1 });
      expect(createIndexMock).toHaveBeenNthCalledWith(
        4,
        { eventId: 1, email: 1 },
        { unique: true, name: "uniq_event_email" },
      );
    });
  });
});