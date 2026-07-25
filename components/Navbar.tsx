"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";

const Navbar = () => {
  return (
    <header>
      <nav>
        <Link
          href={"/"}
          className="logo"
          onClick={() => posthog.capture("home_navigation_clicked", { source: "logo" })}
        >
          <Image src={"/icons/logo.png"} alt="logo" width={24} height={24} />

          <p>DevEvent</p>
        </Link>

        <ul>
          <Link
            href={"/"}
            onClick={() => posthog.capture("home_navigation_clicked", { source: "navigation" })}
          >
            Home
          </Link>
          <Link
            href={"/"}
            onClick={() => posthog.capture("events_navigation_clicked")}
          >
            Events
          </Link>
          <Link
            href={"/"}
            onClick={() => posthog.capture("create_events_navigation_clicked")}
          >
            Create Events
          </Link>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
