"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { MediaDocument } from "@/models/Media";

interface MediaCardProps {
  media: MediaDocument;
  index: number;
  isExpanded: boolean;
  openMediaForm: (edit: boolean, index: number) => void;
  onExpand: () => void;
  onDelete: (id: string) => void;
}

export default function MediaCard({
  isExpanded,
  onExpand,
  media,
  index,
  openMediaForm,
  onDelete,
}: MediaCardProps) {
  const [cardMenu, setCardMenu] = useState(false);

  const handleCardMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setCardMenu(!cardMenu);
  };

  useEffect(() => {
    if (!isExpanded) {
      setCardMenu(false);
    }
  }, [isExpanded]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/media/${media._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete media");
      }

      onDelete(media._id);
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  return (
    <li
      className={`grid grid-rows-[auto_1fr] overflow-hidden rounded-3xl bg-neutral-900 text-white transition-all duration-500 ease-in-out sm:grid-cols-[auto_1fr] sm:grid-rows-none ${isExpanded ? "sm:max-w-[600px]" : "sm:max-w-[250px]"}`}
    >
      <MediaImage media={media} isExpanded={isExpanded} onExpand={onExpand} />
      <div className="grid max-h-[375px] grid-cols-[1fr_auto] grid-rows-[auto_auto_1fr] items-start gap-2 rounded-t-2xl border-t border-gray-800 px-4 py-2 sm:min-w-[350px] sm:border-none">
        <MediaInfo media={media} />
        <CardMenu
          cardMenu={cardMenu}
          onToggleMenu={handleCardMenu}
          onEdit={() => {
            setCardMenu(false);
            openMediaForm(true, index);
          }}
          onDelete={() => {
            handleDelete();
            setCardMenu(false);
          }}
        />
        <MediaGenres genres={media.genres} />
        <MediaPlot plot={media.plot} />
      </div>
    </li>
  );
}

const MediaImage = ({
  media,
  isExpanded,
  onExpand,
}: {
  media: MediaDocument;
  isExpanded: boolean;
  onExpand: () => void;
}) => (
  <div
    className="grid aspect-[2/3] cursor-pointer grid-rows-[1fr_auto] place-content-center sm:w-[250px]"
    onClick={onExpand}
  >
    <Image
      src={media.image || "/images/poster_placeholder.png"}
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
);

const MediaInfo = ({ media }: { media: MediaDocument }) => (
  <div className="flex flex-col">
    <h3>
      {media.title + (media.release_date ? ` (${media.release_date})` : "")}
    </h3>
    <h4 className="text-sm">
      <span className="capitalize">{media.status}</span>
      {media.current_episode?.season && ` - S${media.current_episode.season}`}
      {media.current_episode?.episode && ` E${media.current_episode.episode}`}
    </h4>
    {media.rating && <h4 className="text-sm">Rating: {media.rating}/10</h4>}
  </div>
);

const CardMenu = ({
  cardMenu,
  onToggleMenu,
  onEdit,
  onDelete,
}: {
  cardMenu: boolean;
  onToggleMenu: (event: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="relative">
    <button
      onClick={onToggleMenu}
      className="transition-transform duration-300 hover:scale-x-110"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        id="Outline"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="currentColor"
      >
        <circle cx="2" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="22" cy="12" r="2" />
      </svg>
    </button>
    {cardMenu && (
      <ul className="absolute right-0 top-7 flex w-20 cursor-pointer flex-col gap-1 overflow-hidden rounded-md bg-neutral-800">
        <li
          onClick={onEdit}
          className="block w-full p-2 text-center hover:bg-neutral-700"
        >
          Edit
        </li>
        <li
          onClick={onDelete}
          className="block w-full p-2 text-center text-red-500 hover:bg-neutral-700"
        >
          Delete
        </li>
      </ul>
    )}
  </div>
);

const MediaGenres = ({ genres = [] }: { genres?: string[] }) => (
  <ul className="col-span-2 mt-2 flex flex-wrap gap-2">
    {genres?.map((genre, index) => (
      <li key={index} className="rounded-full border px-2 py-1">
        {genre}
      </li>
    ))}
  </ul>
);

const MediaPlot = ({ plot }: { plot: string | undefined }) => (
  <p className="custom-scrollbar col-span-2 h-full overflow-y-auto break-words pr-2 text-justify text-sm">
    {plot}
  </p>
);
