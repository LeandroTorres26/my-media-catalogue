"use client";
import { useCallback, useState, useEffect, useMemo } from "react";
import MediaCard from "@/components/mediaCard/MediaCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MediaDocument } from "@/models/Media";
import MediaForm from "@/components/mediaForm/MediaForm";
import { set } from "mongoose";

export default function Catalogue() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderBy, setOrderBy] = useState("a-z");
  const [userMedias, setUserMedias] = useState<MediaDocument[]>([]);
  const [mediasLoading, setMediasLoading] = useState(true);
  const [mediasError, setMediasError] = useState<string | null>(null);
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

  const loadMedias = useCallback(
    async (searchTerm: string, categoryFilter: string, orderBy: string) => {
      setMediasLoading(true);
      setMediasError(null);

      if (!session?.user?.email) {
        setUserMedias([]);
        setMediasLoading(false);
        return;
      }

      try {
        setMediasError(null);
        const param = new URLSearchParams();
        if (searchTerm) {
          param.append("search", searchTerm);
        }
        if (categoryFilter) {
          param.append("category", categoryFilter);
        }
        if (orderBy) {
          param.append("orderby", orderBy);
        }
        const query = param.toString();
        let url = query ? `/api/user/medias?${query}` : "/api/user/medias";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch user medias");
        const medias = await res.json();
        setUserMedias(medias);
        setMediasLoading(false);
      } catch (error) {
        console.error("Error fetching user medias:", error);
        setMediasError("Failed to load media. Please try again.");
        setMediasLoading(false);
      }
    },
    [session],
  );

  useEffect(() => {
    loadMedias(searchTerm, categoryFilter, orderBy);
  }, [loadMedias, searchTerm, categoryFilter, orderBy]);

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

  const handleExpand = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="grid size-full min-h-screen grid-rows-[auto_1fr] justify-items-center gap-y-8 pt-[5.9375rem]">
      <CatalogueControls
        onAddMedia={() => handleOpenMediaForm(false, null)}
        setSearchTerm={setSearchTerm}
        setCategoryFilter={setCategoryFilter}
        categoryFilter={categoryFilter}
        setOrderBy={setOrderBy}
        orderBy={orderBy}
      />

      {mediasLoading && (
        <span className="loading loading-spinner loading-xl"></span>
      )}
      {mediasError && <p className="text-red-500">{mediasError}</p>}

      {openMediaForm && (
        <MediaForm
          onClose={handleCloseMediaForm}
          editMode={editMode}
          mediaToEdit={mediaToEdit}
          onRefresh={() => {
            loadMedias(searchTerm, categoryFilter, orderBy);
          }}
        />
      )}
      {!mediasLoading && (
        <MediaList
          userMedias={userMedias}
          expandedIndex={expandedIndex}
          onExpand={handleExpand}
          onEditMedia={handleOpenMediaForm}
          onDeleteMedia={() => {
            loadMedias(searchTerm, categoryFilter, orderBy);
          }}
        />
      )}
    </div>
  );
}

// CatalogueControls Component
const CatalogueControls = ({
  onAddMedia,
  setSearchTerm,
  setCategoryFilter,
  categoryFilter,
  setOrderBy,
  orderBy,
}: {
  onAddMedia: () => void;
  setSearchTerm: (term: string) => void;
  setCategoryFilter: (category: string) => void;
  categoryFilter: string;
  setOrderBy: (order: string) => void;
  orderBy: string;
}) => (
  <div className="bg-base-100 container mx-auto grid w-full grid-cols-[auto_1fr] items-center justify-center gap-10 rounded-2xl px-8 py-3 sm:grid-cols-[repeat(7,auto)] lg:justify-end">
    <SearchInput setSearchTerm={setSearchTerm} />
    <CategorySelect
      setCategoryFilter={setCategoryFilter}
      categoryFilter={categoryFilter}
    />
    <OrderBySelect setOrderBy={setOrderBy} orderBy={orderBy} />
    <button
      onClick={onAddMedia}
      className="btn btn-primary btn-lg col-span-2 mx-auto lg:col-span-1"
    >
      Add Media
    </button>
  </div>
);

const SearchInput = ({
  setSearchTerm,
}: {
  setSearchTerm: (term: string) => void;
}) => (
  <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
    <label htmlFor="search">Search Title:</label>
    <input
      type="text"
      name="search"
      placeholder="e.g The Godfather"
      className="input"
      onChange={(e) => {
        setSearchTerm(e.target.value);
      }}
    />
  </div>
);

const CategorySelect = ({
  setCategoryFilter,
  categoryFilter,
}: {
  setCategoryFilter: (category: string) => void;
  categoryFilter: string;
}) => (
  <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
    <label htmlFor="category">Category:</label>
    <select
      name="category"
      className="select"
      defaultValue={categoryFilter}
      onChange={(e) => {
        setCategoryFilter(e.target.value);
      }}
    >
      <option value="">All</option>
      <option value="movie">Movies</option>
      <option value="tv show">TV Shows</option>
      <option value="anime">Anime</option>
      <option value="documentary">Documentaries</option>
    </select>
  </div>
);

const OrderBySelect = ({
  setOrderBy,
  orderBy,
}: {
  setOrderBy: (order: string) => void;
  orderBy: string;
}) => (
  <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
    <label htmlFor="category">Order by:</label>
    <select
      name="category"
      className="select"
      defaultValue={orderBy}
      onChange={(e) => {
        setOrderBy(e.target.value);
      }}
    >
      <option value="a-z">A-Z</option>
      <option value="z-a">Z-A</option>
      <option value="date_added_newest">Date Added (Newest)</option>
      <option value="date_added_oldest">Date Added (Oldest)</option>
      <option value="last_modified">Last Modified</option>
      <option value="release_year_newest">Newest Release Year</option>
      <option value="release_year_oldest">Oldest Release Year</option>
      <option value="rating_highest">Highest Rating</option>
      <option value="rating_lowest">Lowest Rating</option>
    </select>
  </div>
);

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
