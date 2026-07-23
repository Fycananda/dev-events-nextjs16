"use client";
import Image from "next/image";
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
      onClick={() => console.log("Click")}
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
