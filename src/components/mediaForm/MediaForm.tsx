"use client";
import { MediaDocument } from "@/models/Media";
import { useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import MediaDetailsSection from "./DetailsSection";

interface MediaFormProps {
  onClose: () => void;
  onRefresh: () => void;
  editMode?: boolean;
  mediaToEdit?: MediaDocument | null;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export default function MediaForm({
  onClose,
  onRefresh,
  editMode,
  mediaToEdit,
}: MediaFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [openMediaDetails, setOpenMediaDetails] = useState(false);
  const [category, setCategory] = useState<string>(
    mediaToEdit?.category || "movie",
  );
  const [genres, setGenres] = useState<string[]>(mediaToEdit?.genres || []);
  const [plot, setPlot] = useState<string | undefined>(mediaToEdit?.plot);
  const [releaseYear, setReleaseYear] = useState<number | undefined>(
    mediaToEdit?.release_date,
  );
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>("");

  const submitMedia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    const getValueOrNull = (value: string | null) => {
      return value?.trim() === "" ? null : value;
    };
    const mediaData = {
      title: getValueOrNull(formData.get("title") as string),
      category: category as "movie" | "tv show" | "anime" | "documentary",
      status: getValueOrNull(formData.get("status") as string) as
        | "watching"
        | "on hold"
        | "completed"
        | "dropped"
        | "planning",
      image: getValueOrNull(formData.get("image") as string),
      rating:
        formData.get("rating") == null ? null : Number(formData.get("rating")),
      genres: genres,
      plot: getValueOrNull(formData.get("plot") as string),
      release_date:
        formData.get("release_date") === ""
          ? null
          : Number(formData.get("release_date")),
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
        onRefresh();
        if (method === "PATCH") {
          onClose();
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
    setPromptLoading(true);
    if (!API_KEY) {
      setPromptLoading(false);
      setPromptError("API key not set");
      return;
    }

    const titleInput = formRef.current?.elements.namedItem(
      "title",
    ) as HTMLInputElement;
    const titleInputValue = titleInput.value;

    if (!titleInputValue) {
      setPromptLoading(false);
      setPromptError("Please provide the title of your media");
      return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const generateContent = async (prompt: string) => {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        setPromptLoading(false);
        setPromptError("Error generating content");
        console.error("Error generating content:", error);
        throw error;
      }
    };

    const parseGenres = (response: string) => {
      const startIndex = response.indexOf("[");
      const endIndex = response.lastIndexOf("]");
      if (startIndex == -1 && endIndex == -1) {
        return [];
      }
      const genresJson = response.slice(startIndex, endIndex + 1);
      return JSON.parse(genresJson);
    };

    try {
      switch (targetInput) {
        case "genres": {
          const prompt = `List the genres for the ${category} titled "${titleInputValue}" as a JSON array of strings (only if you find real genres, otherwise return nothing) all lowercase,. ${category === "anime" ? "You can include anime genres." : ""} ${plot ?? ` the synopsis is: ${plot}`} ${releaseYear ?? `the release year is: ${releaseYear}`}.`;
          const response = await generateContent(prompt);
          const genresJson = parseGenres(response);
          if (genresJson.length > 0) {
            setGenres([...new Set([...genres, ...genresJson])]);
          } else {
            setPromptError("Coult not find the genres for this title");
          }
          setPromptLoading(false);
          break;
        }
        case "plot": {
          const prompt = `Write the Synopsis of the ${category} titled "${titleInputValue}".Summarize it in just a paragraph and nothing more. If you cannot find a synopsis just say so.`;
          const response = await generateContent(prompt);
          setPromptLoading(false);
          setPlot(response);
          break;
        }
        case "release_date": {
          const prompt = `Give me the release year of the ${category} titled "${titleInputValue}" as a number in the YYYY format. ${plot ?? `the synopsis is: ${plot}`}`;
          const response = await generateContent(prompt);
          const year = parseInt(response, 10);
          setPromptLoading(false);
          if (year) {
            setReleaseYear(year);
          } else {
            setPromptError("Could not find the release year for this title");
          }
          break;
        }
        default:
          setPromptLoading(false);
          setPromptError("Invalid target input");
          break;
      }
    } catch (error) {
      setPromptLoading(false);
      setPromptError("Error when generating the prompt");
      console.error("Error when generating the prompt:", error);
    }
  };

  return (
    <dialog
      className="backdrop fixed inset-0 z-50 grid size-full items-center bg-transparent"
      onClick={onClose}
    >
      <div
        className="bg-base-100 text-base-content m-0 mx-auto flex max-h-[90lvh] w-full max-w-[500px] flex-col gap-x-16 gap-y-4 overflow-y-auto rounded-2xl py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="mr-4 self-end">
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
            <div className="flex flex-col gap-2">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                name="title"
                defaultValue={mediaToEdit?.title}
                className="input w-full"
                required
              />
            </div>
            <FormSelect
              label="Category"
              name="category"
              options={["movie", "tv show", "anime", "documentary"]}
              defaultValue={mediaToEdit?.category || "movie"}
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
            releaseYear={releaseYear}
            rating={mediaToEdit?.rating}
            category={category}
            season={mediaToEdit?.current_episode?.season}
            episode={mediaToEdit?.current_episode?.episode}
          />
          <button className="btn btn-outline btn-primary col-span-2 mx-auto min-w-[6rem]">
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
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={name}>{label}</label>
    <select
      name={name}
      className="select w-full capitalize"
      defaultValue={defaultValue}
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
