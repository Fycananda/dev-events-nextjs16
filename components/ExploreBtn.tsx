"use client";
import Image from "next/image";
import posthog from "posthog-js";
import React from "react";

// Type for 'Button' Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const ExploreBtn = ({ className }: ButtonProps) => {
  return (
    <button
      className={className}
      type="button"
      id="explore-btn"
      onClick={() => {
        posthog.capture("explore_events_clicked", {
          source: "home_hero",
        });
      }}
    >
      <a href="#events">
        Explore Events
        <Image
          src={"/icons/arrow-down.svg"}
          alt="arrow-down"
          width={20}
          height={20}
        />
      </a>
    </button>
  );
};

export default ExploreBtn;
