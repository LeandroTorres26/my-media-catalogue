"use client";
import Image from "next/image";
import { useState } from "react";

interface MediaCardProps {
  isExpanded: boolean;
  onExpand: () => void;
  media: {
    title: string;
    category: "movie" | "tv show" | "anime" | "documentary";
    status: "watching" | "on hold" | "completed" | "dropped" | "planning";
    image?: string;
    rating?: number;
    genres?: string[];
    plot?: string;
    release_date?: Date;
    current_episode?: {
      episode: number;
      season: number;
    };
  };
}

export default function MediaCard({
  isExpanded,
  onExpand,
  media,
}: MediaCardProps) {
  const [cardMenu, setCardMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleCardMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCardMenu(!cardMenu);
  };

  const handleEditMode = () => {
    setEditMode(!editMode);
  };

  return (
    <li
      className={`grid grid-rows-[auto_1fr] overflow-hidden rounded-3xl bg-neutral-900 transition-all duration-500 ease-in-out sm:grid-cols-[auto_1fr] sm:grid-rows-none ${isExpanded ? "sm:max-w-[600px]" : "sm:max-w-[250px]"}`}
    >
      <div
        className="grid aspect-[2/3] cursor-pointer grid-rows-[1fr_auto] place-content-center sm:w-[250px]"
        onClick={onExpand}
      >
        <Image
          src="/poster_placeholder.png"
          width={250}
          height={340}
          alt=""
          className="size-full object-cover"
        />
        <h3
          className={`line-clamp-2 overflow-hidden text-center transition-all duration-300 ease-in-out ${isExpanded ? "max-h-0 p-0" : "max-h-10 p-1"}`}
        >
          {media.title}
        </h3>
      </div>
      <div className="grid max-h-[375px] grid-cols-[1fr_auto] grid-rows-[auto_auto_1fr] items-start gap-2 rounded-t-2xl border-t border-gray-800 px-4 py-2 sm:min-w-[350px] sm:border-none">
        <h3 className="flex flex-col">
          {media.title +
            (media.release_date
              ? ` (${media.release_date.toString().split("-")[0]})`
              : "")}
          <h4 className="capitalize">
            {media.status}
            {media.status === "watching" &&
            media.current_episode?.episode &&
            media.current_episode?.season
              ? ` - S${media.current_episode.season} E${media.current_episode.episode}`
              : ""}
          </h4>
          {media.rating && <h4>Rating {media.rating}/10</h4>}
        </h3>
        <div className="relative">
          <button onClick={handleCardMenu}>. . .</button>
          {cardMenu && (
            <ul className="absolute right-0 top-7 flex w-20 cursor-pointer flex-col gap-1 overflow-hidden rounded-md bg-neutral-700">
              <li
                className="block w-full p-2 text-center hover:bg-neutral-800"
                onClick={handleEditMode}
              >
                Edit
              </li>
              <li className="block w-full p-2 text-center text-red-500 hover:bg-neutral-800">
                Delete
              </li>
            </ul>
          )}
        </div>
        <ul className="col-span-2 mt-2 flex flex-wrap gap-2">
          {media.genres?.map((genre, index) => (
            <li key={index} className="rounded-full border px-2 py-1">
              {genre}
            </li>
          ))}
        </ul>
        <p className="custom-scrollbar col-span-2 h-full overflow-y-auto pr-2 text-justify text-sm">
          {media.plot}
        </p>
      </div>
    </li>
  );
}
