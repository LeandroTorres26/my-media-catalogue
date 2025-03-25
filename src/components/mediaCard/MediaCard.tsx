import Image from "next/image";
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
      className={`bg-base-300 text-base-content border-base-100 grid grid-rows-[auto_1fr] overflow-hidden rounded-2xl border transition-all duration-500 ease-in-out sm:grid-cols-[auto_1fr] sm:grid-rows-none ${isExpanded ? "max-h-[850px] sm:max-w-[37.5rem]" : "max-h-[26.8125rem] sm:max-w-[15.625rem]"}`}
    >
      <MediaImage media={media} isExpanded={isExpanded} onExpand={onExpand} />
      <div className="grid max-h-[375px] grid-cols-[1fr_auto] grid-rows-[auto_auto_1fr] items-start gap-2 p-4 sm:min-w-[350px]">
        <MediaInfo media={media} />
        <CardMenu
          onEdit={() => {
            openMediaForm(true, index);
          }}
          onDelete={() => {
            handleDelete();
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
  <figure
    className="grid aspect-2/3 cursor-pointer grid-rows-[1fr_auto] sm:w-[250px]"
    onClick={onExpand}
  >
    <Image
      src={media.image || "/images/poster_placeholder.png"}
      width={250}
      height={340}
      alt=""
      className="size-full object-cover"
    />
    <figcaption
      className={`line-clamp-2 overflow-hidden text-center transition-all duration-300 ease-in-out ${isExpanded ? "max-h-0 p-0" : "max-h-10 p-1"}`}
    >
      {media.title}
    </figcaption>
  </figure>
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
    {(media.rating || media.rating === 0) && (
      <div className="rating rating-half mt-2">
        <div
          className="mask mask-star-2 mask-half-1"
          aria-label="0.5 star"
          aria-current={media.rating === 1}
        ></div>
        <div
          className="mask mask-star-2 mask-half-2"
          aria-label="1 star"
          aria-current={media.rating === 2}
        ></div>
        <div
          className="mask mask-star-2 mask-half-1"
          aria-label="1.5 star"
          aria-current={media.rating === 3}
        ></div>
        <div
          className="mask mask-star-2 mask-half-2"
          aria-label="2 star"
          aria-current={media.rating === 4}
        ></div>
        <div
          className="mask mask-star-2 mask-half-1"
          aria-label="2.5 star"
          aria-current={media.rating === 5}
        ></div>
        <div
          className="mask mask-star-2 mask-half-2"
          aria-label="3 star"
          aria-current={media.rating === 6}
        ></div>
        <div
          className="mask mask-star-2 mask-half-1"
          aria-label="3.5 star"
          aria-current={media.rating === 7}
        ></div>
        <div
          className="mask mask-star-2 mask-half-2"
          aria-label="4 star"
          aria-current={media.rating === 8}
        ></div>
        <div
          className="mask mask-star-2 mask-half-1"
          aria-label="4.5 star"
          aria-current={media.rating === 9}
        ></div>
        <div
          className="mask mask-star-2 mask-half-2"
          aria-label="5 star"
          aria-current={media.rating === 10}
        ></div>
      </div>
    )}
  </div>
);

const CardMenu = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="dropdown dropdown-end">
    <div tabIndex={0} role="button" className="btn btn-sm m-1">
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
    </div>
    <ul
      tabIndex={0}
      className="dropdown-content menu bg-base-100 rounded-box z-1 w-30 shadow-sm"
    >
      <li
        onClick={() => {
          (document.activeElement as HTMLElement).blur();
          onEdit();
        }}
        className="hover:bg-base-200 rounded-box block w-full cursor-pointer p-2"
      >
        Edit
      </li>
      <li
        onClick={() => {
          (document.activeElement as HTMLElement).blur();
          onDelete();
        }}
        className="hover:bg-base-200 rounded-box block w-full cursor-pointer p-2 text-red-500"
      >
        Delete
      </li>
    </ul>
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
  <p className="custom-scrollbar rounded-box col-span-2 h-full max-h-[10.625rem] overflow-y-auto pr-2 text-justify text-sm break-words shadow-2xl">
    {plot}
  </p>
);
