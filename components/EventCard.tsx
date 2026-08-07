"use client";

import { SerializedEvent } from "@/lib/utils/serialize";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

type EventCardProps = SerializedEvent;
const EventCard = (event: EventCardProps) => {
  return (
    <Link
      href={`/events/${event.slug}`}
      id="event-card"
      onClick={() => {
        posthog.capture("event_card_clicked", {
          event_slug: event.slug,
          event_date: event.date,
          event_location: location,
        });
      }}
    >
      <Image
        src={event.image}
        alt={event.title}
        width={410}
        height={300}
        className="poster"
      />
      <div className="flex gap-2">
        <Image src={"/icons/pin.svg"} alt={"location"} width={14} height={14} />
        <p>{event.location}</p>
      </div>

      <p className="title">{event.title}</p>

      <div className="datetime">
        <div>
          <Image
            src={"/icons/calendar.svg"}
            alt={"date"}
            width={14}
            height={14}
          />
          <p>{event.date}</p>
        </div>
        <div>
          <Image
            src={"/icons/clock.svg"}
            alt={"clock"}
            width={14}
            height={14}
          />
          <p>{event.time}</p>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
``