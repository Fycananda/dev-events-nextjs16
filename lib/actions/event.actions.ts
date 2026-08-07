"use server";

import { getEventBySlug } from "@/repository/events";
import { getDb } from "../mongodb";
import { IEvent } from "@/types/event";

export const getSimilarEventsBySlug = async (slug: string) => {
  const event = await getEventBySlug(slug);

  if (!event) {
    throw new Error(`Event with slug: ${slug} not found`);
  }

  const db = await getDb();
  const similarEvents = await db
    .collection<IEvent>("events")
    .find({ _id: { $ne: event._id }, tags: { $in: event.tags } })
    .limit(4)
    .toArray();

  return similarEvents;
};
