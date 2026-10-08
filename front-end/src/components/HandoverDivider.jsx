import React from "react";
import doodle from "../assets/handover-doodle.svg";

export default function HandoverDivider() {
  return (
    <div className="flex flex-col items-center gap-3 bg-white px-4 py-16">
      <div className="h-px w-16 bg-gray-200" />
      <img
        src={doodle}
        alt="Illustration of two people handing a found item to each other"
        className="h-20 w-auto"
      />
      <p className="text-sm font-medium text-gray-400">Bringing people together, one handover at a time.</p>
    </div>
  );
}
