import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import { SerializedEvent, serializeEvent } from "@/lib/utils/serialize";
import { IEvent } from "@/types/event";
import { cacheLife } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default async function Home() {
  "use cache";
  cacheLife("hours");
  const response = await fetch(`${BASE_URL}/api/events`);
  const { getAllEvents } = await response.json();

  return (
    <section>
      <h1 className="text-center mt-5">
        The Hub for Every Dev <br /> Event You Mustn't Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, and Conferences, All in One Place
      </p>
      <ExploreBtn className="whitespace-nowrap mx-auto mt-7" />

      <div className="mt-15 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events list-none p-0 m-0">
          {getAllEvents &&
            getAllEvents.length > 0 &&
            getAllEvents.map((event: SerializedEvent) => (
              <li key={event._id}>
                <EventCard {...event} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
