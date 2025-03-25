"use client";
import { useCallback, useState, useEffect, useMemo } from "react";
import MediaCard from "@/components/mediaCard/MediaCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MediaDocument } from "@/models/Media";
import MediaForm from "@/components/mediaForm/MediaForm";

export default function Catalogue() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [userMedias, setUserMedias] = useState<MediaDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMediaForm, setOpenMediaForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [mediaToEdit, setMediaToEdit] = useState<MediaDocument | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const isAuthenticated = useMemo(() => status === "authenticated", [status]);

  useEffect(() => {
    if (status !== "authenticated" && status !== "loading") {
      router.push("/login");
    }
  }, [status, router]);

  const loadMedias = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!session?.user?.email) {
      setUserMedias([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch("/api/user/medias");
      if (!res.ok) throw new Error("Failed to fetch user medias");
      const medias = await res.json();
      setUserMedias(medias);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user medias:", error);
      setError("Failed to load media. Please try again.");
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadMedias();
  }, [loadMedias]);

  // Media form handlers
  const handleOpenMediaForm = (edit: boolean, index: number | null) => {
    setEditMode(edit);
    if (edit && index !== null) {
      setMediaToEdit(userMedias[index]);
    }
    setOpenMediaForm(true);
  };

  const handleCloseMediaForm = () => {
    setOpenMediaForm(false);
    setMediaToEdit(null);
  };

  // Expand/collapse handler
  const handleExpand = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="grid size-full min-h-screen grid-rows-[auto_1fr] justify-items-center gap-y-8 pt-[5.9375rem]">
      <CatalogueControls onAddMedia={() => handleOpenMediaForm(false, null)} />

      {loading && <span className="loading loading-spinner loading-xl"></span>}
      {error && <p className="text-red-500">{error}</p>}

      {openMediaForm && (
        <MediaForm
          onClose={handleCloseMediaForm}
          editMode={editMode}
          mediaToEdit={mediaToEdit}
          onRefresh={loadMedias}
        />
      )}
      {!loading && (
        <MediaList
          userMedias={userMedias}
          expandedIndex={expandedIndex}
          onExpand={handleExpand}
          onEditMedia={handleOpenMediaForm}
          onDeleteMedia={loadMedias}
        />
      )}
    </div>
  );
}

// CatalogueControls Component
const CatalogueControls = ({ onAddMedia }: { onAddMedia: () => void }) => (
  <div className="bg-base-100 container mx-auto grid w-full grid-cols-[auto_1fr] items-center justify-center gap-10 rounded-2xl px-8 py-3 sm:grid-cols-[repeat(7,auto)] lg:justify-end">
    <SearchInput />
    <CategorySelect />
    <OrderBySelect />
    <button
      onClick={onAddMedia}
      className="btn btn-primary btn-lg col-span-2 mx-auto lg:col-span-1"
    >
      Add Media
    </button>
  </div>
);

// Search Input Component
const SearchInput = () => (
  <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
    <label htmlFor="search">Search by:</label>
    <input
      type="text"
      name="search"
      placeholder="e.g The Godfather"
      className="input"
      disabled
    />
  </div>
);

// Category Select Component
const CategorySelect = () => (
  <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
    <label htmlFor="category">Category:</label>
    <select name="category" className="select" disabled>
      <option value="movies">Movies</option>
      <option value="tv shows">TV Shows</option>
      <option value="anime">Anime</option>
      <option value="documentaries">Documentaries</option>
    </select>
  </div>
);

// Order By Select Component
const OrderBySelect = () => (
  <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
    <label htmlFor="category">Order by:</label>
    <select name="category" className="select" disabled>
      <option value="a-z">A-Z</option>
      <option value="z-a">Z-A</option>
      <option value="release_date">Release Date</option>
      <option value="rating">Rating</option>
    </select>
  </div>
);

// Media List Component
const MediaList = ({
  userMedias,
  expandedIndex,
  onExpand,
  onEditMedia,
  onDeleteMedia,
}: {
  userMedias: MediaDocument[];
  expandedIndex: number | null;
  onExpand: (index: number) => void;
  onEditMedia: (edit: boolean, index: number | null) => void;
  onDeleteMedia: () => void;
}) => (
  <ul className="container flex w-full flex-wrap items-start gap-x-10 gap-y-8 p-4">
    {userMedias.map((media, index) => (
      <MediaCard
        key={media._id || index}
        index={index}
        media={media}
        isExpanded={expandedIndex === index}
        onExpand={() => onExpand(index)}
        openMediaForm={(edit, idx) => onEditMedia(edit, idx)}
        onDelete={onDeleteMedia}
      />
    ))}
  </ul>
);
