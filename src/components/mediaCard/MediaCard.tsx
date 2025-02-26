import Link from "next/link";

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
  return (
    <li
      className={`grid cursor-pointer grid-rows-[auto_1fr] overflow-hidden rounded-3xl bg-neutral-900 transition-all duration-500 ease-in-out sm:grid-cols-[auto_1fr] sm:grid-rows-none ${isExpanded ? "sm:max-w-[600px]" : "sm:max-w-[250px]"}`}
      onClick={onExpand}
    >
      <div className="grid aspect-[1/1.5] grid-rows-[1fr_auto] sm:w-[250px]">
        <div className="grid w-full place-content-center bg-main-500">
          Image
        </div>
        <h3 className="line-clamp-2 p-1 text-center">{media.title}</h3>
      </div>
      <div className="grid items-start gap-2 rounded-t-2xl border-t border-gray-800 px-4 py-2 sm:min-w-[350px] sm:border-none">
        <span>{media.release_date?.toString().split("-")[0]}</span>
        <p className="text-justify text-sm">{media.plot}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {media.genres?.map((genre, index) => (
            <li key={index} className="rounded-full border px-2 py-1">
              {genre}
            </li>
          ))}
        </ul>
        <Link
          href={"/catalogue"}
          className="ml-auto mr-0 mt-1 block w-fit self-end"
        >
          Edit
        </Link>
      </div>
    </li>
  );
}
