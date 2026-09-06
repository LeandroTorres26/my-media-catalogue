"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MediaDocument } from "@/models/Media";
import MediaCard from "@/components/mediaCard/MediaCard";
import MediaForm from "@/components/mediaForm/MediaForm";
import { useCatalogueStore } from "@/stores/catalogueStore";

export default function Catalogue() {
  const { status } = useSession();
  const router = useRouter();

  const searchTerm = useCatalogueStore((state) => state.searchTerm);
  const categoryFilter = useCatalogueStore((state) => state.categoryFilter);
  const orderBy = useCatalogueStore((state) => state.orderBy);
  const loading = useCatalogueStore((state) => state.loading);
  const error = useCatalogueStore((state) => state.error);
  const isFormOpen = useCatalogueStore((state) => state.isFormOpen);
  const loadMedias = useCatalogueStore((state) => state.loadMedias);

  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (status !== "authenticated" && status !== "loading") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMedias();
  }, [isAuthenticated, searchTerm, categoryFilter, orderBy, loadMedias]);

  if (!isAuthenticated) return null;

  return (
    <div className="grid size-full min-h-screen grid-rows-[auto_1fr] justify-items-center gap-y-8 pt-[5.9375rem]">
      <CatalogueControls />

      {loading && <span className="loading loading-spinner loading-xl"></span>}
      {error && <p className="text-red-500">{error}</p>}

      {isFormOpen && <MediaForm />}
      {!loading && <MediaList />}
    </div>
  );
}

// CatalogueControls Component
const CatalogueControls = () => (
  <div className="bg-base-100 container mx-auto grid w-full grid-cols-[auto_1fr] items-center justify-center gap-10 rounded-2xl px-8 py-3 sm:grid-cols-[repeat(7,auto)] lg:justify-end">
    <SearchInput />
    <CategorySelect />
    <OrderBySelect />
    <AddMediaButton />
  </div>
);

const SearchInput = () => {
  const setSearchTerm = useCatalogueStore((state) => state.setSearchTerm);

  return (
    <div className="col-span-2 grid grid-cols-subgrid items-center gap-2">
      <label htmlFor="search">Search Title:</label>
      <input
        type="text"
        name="search"
        placeholder="e.g The Godfather"
        className="input"
        onChange={(e) => {setSearchTerm(e.target.value)}}
      />
    </div>
  )
};

const CategorySelect = () => {
  const categoryFilter = useCatalogueStore((state) => state.categoryFilter);
  const setCategoryFilter = useCatalogueStore((state) => state.setCategoryFilter);

  return (
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
  )
};

const OrderBySelect = () => {
  const orderBy = useCatalogueStore((state) => state.orderBy);
  const setOrderBy = useCatalogueStore((state) => state.setOrderBy);

  return (
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
  )
};

const AddMediaButton = () => {
  const openCreateForm = useCatalogueStore((state) => state.openCreateForm);
  return (
    <button
        onClick={openCreateForm}
        className="btn btn-primary btn-lg col-span-2 mx-auto lg:col-span-1"
      >
        Add Media
    </button>
  )
}

const MediaList = () => {
  const medias = useCatalogueStore((state) => state.medias);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul className="container flex w-full flex-wrap items-start gap-x-10 gap-y-8 p-4">
      {medias.map((media) => (
        <MediaCard
          key={media._id}
          media={media}
          isExpanded={expandedId === media._id}
          onExpand={() =>
            setExpandedId((current) =>
              current === media._id ? null : (media._id ?? null),
            )
          }
        />
      ))}
    </ul>
  )
};