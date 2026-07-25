import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import type { IEvent } from "@/types/event";

const INSERTED_ID = new ObjectId("64b64e0f2c1a4f0012345678");

const insertOneMock = vi.fn();
const findOneMock = vi.fn();
const createIndexMock = vi.fn();
const collectionMock = vi.fn(() => ({
  insertOne: insertOneMock,
  findOne: findOneMock,
  createIndex: createIndexMock,
}));

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(async () => ({ collection: collectionMock })),
}));

import {
  createEvent,
  getEventById,
  getEventBySlug,
  ensureEventIndexes,
} from "@/repository/events";

type EventInput = Omit<IEvent, "_id" | "slug" | "createdAt" | "updatedAt">;

function validInput(overrides: Partial<EventInput> = {}): EventInput {
  return {
    title: "Tech Conference 2026",
    description: "A conference about technology",
    overview: "Overview of the event",
    image: "https://example.com/banner.png",
    venue: "Main Hall",
    location: "San Francisco, CA",
    date: "2026-09-01",
    time: "10:00 AM",
    // NOTE: the runtime validation in repository/events.ts checks mode
    // against lowercase strings ("online" | "offline" | "hybrid"), even
    // though TMode (types/event.ts) is defined with capitalized literals.
    // Lowercase is used here so the "happy path" tests can exercise the
    // rest of the function; the mismatch itself is covered by a dedicated
    // regression test below.
    mode: "online" as unknown as IEvent["mode"],
    audience: "Developers",
    agenda: "Workshops and talks",
    organizer: "Acme Inc",
    tags: ["tech"],
    ...overrides,
  };
}

function lastInsertedDoc() {
  return insertOneMock.mock.calls[insertOneMock.mock.calls.length - 1][0];
}

describe("repository/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertOneMock.mockResolvedValue({ insertedId: INSERTED_ID });
    findOneMock.mockResolvedValue(null);
    createIndexMock.mockResolvedValue("index-name");
  });

  describe("createEvent", () => {
    it("normalizes the input and persists the event", async () => {
      const input = validInput({
        title: "  My Awesome Event!! ",
        date: "2026-09-01",
        time: "2:30 PM",
      });

      const result = await createEvent(input);

      expect(collectionMock).toHaveBeenCalledWith("events");
      expect(insertOneMock).toHaveBeenCalledTimes(1);

      const doc = lastInsertedDoc();
      expect(doc.slug).toBe("my-awesome-event");
      expect(doc.date).toBe("2026-09-01");
      expect(doc.time).toBe("14:30");
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);

      expect(result._id).toEqual(INSERTED_ID);
      expect(result.slug).toBe("my-awesome-event");
    });

    it.each([
      ["Hello World! Conference 2026", "hello-world-conference-2026"],
      ["  Multiple   Spaces  --and--dashes  ", "multiple-spaces-and-dashes"],
      ["Café & Co.", "caf-co"],
    ])("generates the slug '%s' -> '%s'", async (title, expectedSlug) => {
      await createEvent(validInput({ title }));
      expect(lastInsertedDoc().slug).toBe(expectedSlug);
    });

    it.each([
      ["14:30", "14:30"],
      ["2:30 PM", "14:30"],
      ["2:30PM", "14:30"],
      ["12:00 AM", "00:00"],
      ["12:00 PM", "12:00"],
      ["9:05 am", "09:05"],
    ])("normalizes time '%s' to '%s'", async (time, expected) => {
      await createEvent(validInput({ time }));
      expect(lastInsertedDoc().time).toBe(expected);
    });

    it("normalizes the date to an ISO (YYYY-MM-DD) string", async () => {
      await createEvent(validInput({ date: "August 15, 2026" }));
      expect(lastInsertedDoc().date).toBe("2026-08-15");
    });

    it("throws when the date cannot be parsed", async () => {
      await expect(
        createEvent(validInput({ date: "not-a-date" })),
      ).rejects.toThrow("Invalid date format");
      expect(insertOneMock).not.toHaveBeenCalled();
    });

    it("throws when the time format is unrecognized", async () => {
      await expect(
        createEvent(validInput({ time: "not-a-time" })),
      ).rejects.toThrow("Invalid time format. Use HH:MM or HH:MM AM/PM");
    });

    it("throws when the time values are out of range", async () => {
      await expect(
        createEvent(validInput({ time: "25:61" })),
      ).rejects.toThrow("Invalid time values");
    });

    it.each([
      ["title", "Title is required"],
      ["description", "Description is required"],
      ["overview", "Overview is required"],
      ["image", "Image URL is required"],
      ["venue", "Venue is required"],
      ["location", "Location is required"],
      ["audience", "Audience is required"],
      ["agenda", "At least one agenda item is required"],
      ["organizer", "Organizer is required"],
    ])("throws when %s is empty", async (field, expectedMessage) => {
      const input = validInput({
        [field]: "",
      } as unknown as Partial<EventInput>);
      await expect(createEvent(input)).rejects.toThrow(expectedMessage);
      expect(insertOneMock).not.toHaveBeenCalled();
    });

    it("throws when the title exceeds 100 characters", async () => {
      const input = validInput({ title: "a".repeat(101) });
      await expect(createEvent(input)).rejects.toThrow(
        "Title cannot exceed 100 characters",
      );
    });

    it("throws when the description exceeds 1000 characters", async () => {
      const input = validInput({ description: "a".repeat(1001) });
      await expect(createEvent(input)).rejects.toThrow(
        "Description cannot exceed 1000 characters",
      );
    });

    it("throws when the overview exceeds 500 characters", async () => {
      const input = validInput({ overview: "a".repeat(501) });
      await expect(createEvent(input)).rejects.toThrow(
        "Overview cannot exceed 500 characters",
      );
    });

    it("throws when date is missing", async () => {
      const input: Partial<EventInput> = validInput();
      delete input.date;
      await expect(
        createEvent(input as EventInput),
      ).rejects.toThrow("Date is required");
    });

    it("throws when time is missing", async () => {
      const input: Partial<EventInput> = validInput();
      delete input.time;
      await expect(
        createEvent(input as EventInput),
      ).rejects.toThrow("Time is required");
    });

    it("throws when tags is empty", async () => {
      const input = validInput({ tags: [] });
      await expect(createEvent(input)).rejects.toThrow(
        "At least one tag is required",
      );
    });

    it("throws when mode is not one of the allowed values", async () => {
      const input = validInput({
        mode: "banana" as unknown as IEvent["mode"],
      });
      await expect(createEvent(input)).rejects.toThrow(
        "Mode must be either online, offline, or hybrid",
      );
    });

    it("REGRESSION: rejects the canonical TMode values (case mismatch bug)", async () => {
      // TMode (types/event.ts) is typed as "Online" | "Offline" | "Hybrid",
      // but validateEvent() only accepts the lowercase variants. This means
      // any value that satisfies the IEvent type at compile time currently
      // fails validation at runtime. This test locks in that observed
      // behavior so a future fix (or regression) is caught either way.
      const input = validInput({ mode: "Online" });
      await expect(createEvent(input)).rejects.toThrow(
        "Mode must be either online, offline, or hybrid",
      );
    });
  });

  describe("getEventBySlug", () => {
    it("queries the events collection by slug", async () => {
      const fakeEvent = { slug: "my-event" };
      findOneMock.mockResolvedValueOnce(fakeEvent);

      const result = await getEventBySlug("my-event");

      expect(collectionMock).toHaveBeenCalledWith("events");
      expect(findOneMock).toHaveBeenCalledWith({ slug: "my-event" });
      expect(result).toBe(fakeEvent);
    });

    it("returns null when no event matches the slug", async () => {
      findOneMock.mockResolvedValueOnce(null);
      const result = await getEventBySlug("missing-slug");
      expect(result).toBeNull();
    });
  });

  describe("getEventById", () => {
    it("queries the events collection by _id", async () => {
      const id = new ObjectId();
      const fakeEvent = { _id: id };
      findOneMock.mockResolvedValueOnce(fakeEvent);

      const result = await getEventById(id);

      expect(collectionMock).toHaveBeenCalledWith("events");
      expect(findOneMock).toHaveBeenCalledWith({ _id: id });
      expect(result).toBe(fakeEvent);
    });

    it("returns null when no event matches the id", async () => {
      findOneMock.mockResolvedValueOnce(null);
      const result = await getEventById(new ObjectId());
      expect(result).toBeNull();
    });
  });

  describe("ensureEventIndexes", () => {
    it("creates the unique slug index and the date/mode compound index", async () => {
      await ensureEventIndexes();

      expect(collectionMock).toHaveBeenCalledWith("events");
      expect(createIndexMock).toHaveBeenNthCalledWith(
        1,
        { slug: 1 },
        { unique: true },
      );
      expect(createIndexMock).toHaveBeenNthCalledWith(2, {
        date: 1,
        mode: 1,
      });
    });
  });
});