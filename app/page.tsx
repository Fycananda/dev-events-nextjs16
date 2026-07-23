import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import events from "@/lib/constant";

export default function Home() {
  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Mustn't Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, and Conferences, All in One Place
      </p>
      <ExploreBtn className="whitespace-nowrap mx-auto mt-7" />

      <div className="mt-15 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events list-none p-0 m-0">
          {events.map((event) => (
            <li key={event.title}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
