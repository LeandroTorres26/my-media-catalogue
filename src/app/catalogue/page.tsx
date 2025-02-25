"use client";
import { useState } from "react";
import MediaCard from "@/components/mediaCard/MediaCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Catalogue() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push("/login");
  }

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const handleExpand = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="grid h-screen w-full place-content-center place-items-center">
      <ul className="container flex flex-wrap gap-x-6 gap-y-8 px-4">
        <MediaCard
          isExpanded={expandedIndex === 0}
          onExpand={() => handleExpand(0)}
        />
      </ul>
    </div>
  );
}
