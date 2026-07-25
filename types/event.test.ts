import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { IEvent } from "@/types/event";

function buildEvent(overrides: Partial<IEvent> = {}): IEvent {
  const now = new Date();
  return {
    title: "Annual Tech Summit",
    slug: "annual-tech-summit",
    description: "A summit about technology",
    overview: "Short overview of the summit",
    image: "https://example.com/image.png",
    venue: "Convention Center",
    location: "New York, NY",
    date: "2026-08-15",
    time: "14:00",
    mode: "Offline",
    audience: "Developers",
    agenda: "Keynotes and workshops",
    organizer: "Acme Corp",
    tags: ["tech", "conference"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("IEvent", () => {
  it("accepts a fully populated event for each supported mode", () => {
    (["Online", "Offline", "Hybrid"] as const).forEach((mode) => {
      const event = buildEvent({ mode });
      expect(event.mode).toBe(mode);
    });
  });

  it("allows _id to be omitted for documents not yet persisted", () => {
    const event = buildEvent();
    expect(event._id).toBeUndefined();
  });

  it("accepts _id once the document has been persisted", () => {
    const _id = new ObjectId();
    const event = buildEvent({ _id });
    expect(event._id).toBe(_id);
  });

  it("stores tags as an array of strings", () => {
    const event = buildEvent({ tags: ["a", "b", "c"] });
    expect(event.tags).toHaveLength(3);
    expect(event.tags.every((tag) => typeof tag === "string")).toBe(true);
  });
});