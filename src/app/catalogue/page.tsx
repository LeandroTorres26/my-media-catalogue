"use client";
import { useState, useEffect } from "react";
import MediaCard from "@/components/mediaCard/MediaCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MediaDocument } from "@/models/Media";

import MediaForm from "@/components/mediaForm/MediaForm";

export default function Catalogue() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [userMedias, setUserMedias] = useState<MediaDocument[]>([]);

  useEffect(() => {
    if (status != "authenticated" && status != "loading") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      const fetchUserMedias = async () => {
        try {
          const res = await fetch("/api/user-medias");
          const medias = await res.json();
          console.log("medias", medias);
          setUserMedias(medias);
        } catch (error) {
          console.error("Error when fetching user medias:", error);
        }
      };
      fetchUserMedias();
    }
  }, [session]);

  const [openMediaForm, setOpenMediaForm] = useState(false);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const handleExpand = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="mt-4 grid h-screen w-full grid-rows-[auto_1fr] justify-items-center gap-y-8">
      {status === "authenticated" && (
        <>
          <div className="container mx-auto grid w-full grid-cols-[1fr_repeat(4,auto)] items-center justify-end gap-10 rounded-2xl bg-neutral-900 px-8 py-3 text-black">
            <h2 className="justify-self-start text-white">
              {session?.user?.name}
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="search" className="text-white">
                Search by:
              </label>
              <input
                type="text"
                name="search"
                placeholder="e.g The Godfather"
                className="rounded-md p-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="category" className="text-white">
                Category:
              </label>
              <select name="category" className="rounded-md p-2 text-sm">
                <option value="movies">Movies</option>
                <option value="tv shows">TV Shows</option>
                <option value="anime">Anime</option>
                <option value="documentaries">Documentaries</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="category" className="text-white">
                Order by:
              </label>
              <select name="category" className="rounded-md p-2 text-sm">
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
                <option value="release_date">Release Date</option>
                <option value="rating">Rating</option>
              </select>
            </div>
            <button
              onClick={() => {
                setOpenMediaForm(!openMediaForm);
              }}
              className="rounded-2xl bg-main-500 px-8 py-4 font-bold"
            >
              Add Media
            </button>
          </div>
          {openMediaForm && <MediaForm />}
          <ul className="container flex flex-wrap items-start gap-x-10 gap-y-8 px-4">
            {Array.isArray(userMedias) &&
              userMedias.length > 0 &&
              userMedias.map((media, index) => (
                <MediaCard
                  key={index}
                  media={media}
                  isExpanded={expandedIndex === index}
                  onExpand={() => handleExpand(index)}
                />
              ))}
          </ul>
        </>
      )}
    </div>
  );
}
