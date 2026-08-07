// lib/utils/serialize.ts
import { IEvent } from "@/types/event";

export type SerializedEvent = Omit<
  IEvent,
  "_id" | "createdAt" | "updatedAt"
> & {
  _id?: string;
  createdAt: string;
  updatedAt: string;
};

export function serializeEvent(event: IEvent): SerializedEvent {
  return {
    ...event,
    _id: event._id?.toString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
