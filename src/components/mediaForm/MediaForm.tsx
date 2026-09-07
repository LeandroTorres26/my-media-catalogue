"use client";
import { MediaDocument } from "@/models/Media";
import { useRef, useState } from "react";
import Image from "next/image";
import MediaDetailsSection from "./DetailsSection";
import TmdbSearch, { TmdbResult } from "./TmdbSearch";
import { useCatalogueStore } from "@/stores/catalogueStore";

export default function MediaForm() {
  const mediaToEdit = useCatalogueStore((state) => state.mediaToEdit);
  const closeForm = useCatalogueStore((state) => state.closeForm);
  const loadMedias = useCatalogueStore((state) => state.loadMedias);

  const editMode = mediaToEdit !== null;

  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [openMediaDetails, setOpenMediaDetails] = useState(false);
  const [title, setTitle] = useState<string>(mediaToEdit?.title || "");
  const [image, setImage] = useState<string | null>(mediaToEdit?.image || null);
  const [category, setCategory] = useState<string>(
    mediaToEdit?.category || "movie",
  );
  const [genres, setGenres] = useState<string[]>(mediaToEdit?.genres || []);
  const [plot, setPlot] = useState<string>(mediaToEdit?.plot || "");
  const [releaseYear, setReleaseYear] = useState<number | undefined>(
    mediaToEdit?.release_date,
  );
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>("");

  const applyTmdbResult = (result: TmdbResult) => {
    setTitle(result.title);
    setImage(result.image);
    if (result.plot) setPlot(result.plot);
    if (result.release_date) setReleaseYear(result.release_date);
    if (result.genres.length > 0) {
      setGenres((current) => [...new Set([...current, ...result.genres])]);
    }
    if (category === "movie" && result.category === "tv show") {
      setCategory("tv show");
    }
    setOpenMediaDetails(true);
  };

  const submitMedia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    const getValueOrNull = (value: string | null) => {
      return value?.trim() === "" ? null : value;
    };
    const mediaData = {
      title: getValueOrNull(title),
      category: category as "movie" | "tv show" | "anime" | "documentary",
      status: getValueOrNull(formData.get("status") as string) as
        | "watching"
        | "on hold"
        | "completed"
        | "dropped"
        | "planning",
      image: image,
      rating:
        formData.get("rating") == null ? null : Number(formData.get("rating")),
      genres: genres,
      plot: getValueOrNull(plot),
      release_date: releaseYear ?? null,
      current_episode: {
        episode: formData.get("episode")
          ? Number(formData.get("episode"))
          : null,
        season: formData.get("season") ? Number(formData.get("season")) : null,
      },
    };

    if (!mediaData.title || !mediaData.category) {
      setError("Title and Category are required.");
      return;
    }

    try {
      const method = editMode && mediaToEdit?._id ? "PATCH" : "POST";
      const url =
        editMode && mediaToEdit?._id
          ? `/api/media/${mediaToEdit._id}`
          : "/api/media";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaData),
      });

      if (res.ok) {
        setSuccess(true);
        setError(null);
        formRef.current.reset();
        // reset() only clears uncontrolled inputs; controlled state has to
        // be cleared by hand.
        setTitle("");
        setImage(null);
        setPlot("");
        setReleaseYear(undefined);
        setGenres([]);
        if (method === "PATCH") {
          closeForm();
        } else {
          setTimeout(() => setSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error(error);
      setError("Failed to add media.");
      setSuccess(false);
    }
  };

  const handleGenreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        setGenres([...genres, value]);
        e.currentTarget.value = "";
      }
    }
  };

  const handleRemoveGenre = (index: number) => {
    setGenres(genres.filter((_, i) => i !== index));
  };

  const generatePrompt = async (targetInput: string) => {
    setPromptError("");

    if (!title.trim()) {
      setPromptError("Please provide the title of your media");
      return;
    }

    setPromptLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetInput,
          title,
          category,
          plot: plot || undefined,
          releaseYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPromptError(data.error ?? "Error generating content");
        return;
      }

      switch (targetInput) {
        case "genres":
          setGenres((current) => [...new Set([...current, ...data.genres])]);
          break;
        case "plot":
          setPlot(data.plot);
          break;
        case "release_date":
          setReleaseYear(data.release_date);
          break;
      }
    } catch (error) {
      console.error("Error when generating the prompt:", error);
      setPromptError("Error when generating the prompt");
    } finally {
      setPromptLoading(false);
    }
  };

  return (
    <dialog
      className="backdrop fixed inset-0 z-50 grid size-full items-center bg-transparent"
      onClick={closeForm}
    >
      <div
        className="bg-base-100 text-base-content m-0 mx-auto flex max-h-[90lvh] w-full max-w-125 flex-col gap-x-16 gap-y-4 overflow-y-auto rounded-2xl py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={closeForm} className="mr-4 self-end">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            id="Outline"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
          >
            <path d="M18,6h0a1,1,0,0,0-1.414,0L12,10.586,7.414,6A1,1,0,0,0,6,6H6A1,1,0,0,0,6,7.414L10.586,12,6,16.586A1,1,0,0,0,6,18H6a1,1,0,0,0,1.414,0L12,13.414,16.586,18A1,1,0,0,0,18,18h0a1,1,0,0,0,0-1.414L13.414,12,18,7.414A1,1,0,0,0,18,6Z" />
          </svg>
        </button>
        <div className="col-span-2 flex flex-col items-center">
          <h2 className="text-center text-2xl">
            {editMode && mediaToEdit
              ? `Editing ${mediaToEdit.title}`
              : "New Media"}
          </h2>
          {error && <p className="mb-4 text-red-500">{error}</p>}
          {success && (
            <p className="mb-4 text-green-500">
              {editMode
                ? "Media edited successfully!"
                : "Media added successfully!"}
            </p>
          )}
        </div>
        <form
          ref={formRef}
          onSubmit={submitMedia}
          className="custom-scrollbar flex flex-col gap-x-16 gap-y-4 overflow-y-auto px-8"
        >
          <fieldset className="grid content-start items-start gap-6">
            <TmdbSearch onSelect={applyTmdbResult} />
            <div className="flex flex-col gap-2">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            {image && (
              <div className="flex items-end gap-4">
                <Image
                  src={image}
                  width={80}
                  height={120}
                  alt=""
                  className="h-30 w-20 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="btn btn-outline btn-xs"
                >
                  Remove poster
                </button>
              </div>
            )}
            <FormSelect
              label="Category"
              name="category"
              options={["movie", "tv show", "anime", "documentary"]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <FormSelect
              label="Status"
              name="status"
              options={[
                "watching",
                "on hold",
                "completed",
                "dropped",
                "planning",
              ]}
              defaultValue={mediaToEdit?.status || "watching"}
            />
          </fieldset>
          <MediaDetailsSection
            open={openMediaDetails}
            onToggle={() => setOpenMediaDetails(!openMediaDetails)}
            generatePrompt={generatePrompt}
            promptLoading={promptLoading}
            promptError={promptError}
            genres={genres}
            onGenreKeyDown={handleGenreKeyDown}
            onRemoveGenre={handleRemoveGenre}
            plot={plot}
            onPlotChange={setPlot}
            releaseYear={releaseYear}
            onReleaseYearChange={setReleaseYear}
            rating={mediaToEdit?.rating}
            category={category}
            season={mediaToEdit?.current_episode?.season}
            episode={mediaToEdit?.current_episode?.episode}
          />
          <button className="btn btn-outline btn-primary col-span-2 mx-auto min-w-24">
            {editMode ? "Save" : "Add"}
          </button>
        </form>
      </div>
    </dialog>
  );
}

const FormSelect = ({
  label,
  name,
  options,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={name}>{label}</label>
    <select
      name={name}
      className="select w-full capitalize"
      {...(value !== undefined ? { value } : { defaultValue })}
      onChange={onChange}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);
