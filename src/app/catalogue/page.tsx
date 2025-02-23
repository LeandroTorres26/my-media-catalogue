"use client";
import { useState } from "react";
import MediaCard from "../components/mediaCard/MediaCard";

export default function Catalogue() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleExpand = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="grid place-content-center place-items-center">
      <ul className="container flex flex-wrap gap-x-6 gap-y-8 px-4">
        <MediaCard
          isExpanded={expandedIndex === 0}
          onExpand={() => handleExpand(0)}
        />
        <MediaCard
          isExpanded={expandedIndex === 1}
          onExpand={() => handleExpand(1)}
        />
        <MediaCard
          isExpanded={expandedIndex === 2}
          onExpand={() => handleExpand(2)}
        />
        <MediaCard
          isExpanded={expandedIndex === 3}
          onExpand={() => handleExpand(3)}
        />
        <MediaCard
          isExpanded={expandedIndex === 4}
          onExpand={() => handleExpand(4)}
        />
      </ul>
    </div>
  );
}
