"use client";
import { MediaDocument } from "@/models/Media";
import { useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
        formData.get("rating") === "" ? null : Number(formData.get("rating")),
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

  const generatePrompt = async (inputName: string) => {
    if (!API_KEY) {
      console.log("API key not set");
      return;
    }
    const titleInput = formRef.current?.elements.namedItem(
      "title",
    ) as HTMLInputElement;
    const titleInputValue = titleInput.value;
    if (titleInputValue == "") {
      return;
    }
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      if (inputName == "plot") {
        const prompt = `Write the Synopsis of the ${category} "${titleInputValue}". do not add topics and just one paragraph.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        setPlot(text);
      }
      if (inputName == "genres") {
        const prompt = `List the genres for the ${category} "${titleInputValue}" as a JSON array of strings all lowercase. ${category == "anime" ? "you can include anime genres" : ""}`;
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const startIndex = response.indexOf("[");
        const endIndex = response.lastIndexOf("]");
        const genresJson = response.slice(startIndex, endIndex + 1);
        setGenres([...new Set([...genres, ...JSON.parse(genresJson)])]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <dialog className="modal block w-full bg-transparent" onClick={onClose}>
      <div
        className="m-0 mx-auto flex max-h-[90lvh] w-full max-w-[500px] flex-col gap-x-16 gap-y-4 overflow-y-auto rounded-2xl bg-neutral-900 py-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="mr-4 self-end">
          <CloseIcon />
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
            <FormInput
              label="Title"
              name="title"
              defaultValue={mediaToEdit?.title}
              required
            />
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
            genres={genres}
            onGenreKeyDown={handleGenreKeyDown}
            onRemoveGenre={handleRemoveGenre}
            plot={plot}
            releaseDate={mediaToEdit?.release_date}
            rating={mediaToEdit?.rating}
            category={category}
            season={mediaToEdit?.current_episode?.season}
            episode={mediaToEdit?.current_episode?.episode}
          />
          <button className="col-span-2 mx-auto w-fit rounded-md border border-white px-4 py-2 hover:border-main-500 hover:bg-main-500 hover:text-black">
            {editMode ? "Save" : "Add"}
          </button>
        </form>
      </div>
    </dialog>
  );
}

const CloseIcon = () => (
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
);

const FormInput = ({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
}) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={name}>{label}</label>
    <input
      type="text"
      name={name}
      defaultValue={defaultValue}
      className="rounded-md p-2 text-sm text-black"
      required={required}
    />
  </div>
);

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
      className="rounded-md bg-white p-2 text-sm capitalize text-black"
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

const MediaDetailsSection = ({
  open,
  onToggle,
  generatePrompt,
  genres,
  onGenreKeyDown,
  onRemoveGenre,
  plot,
  releaseDate,
  rating,
  category,
  season,
  episode,
}: {
  open: boolean;
  onToggle: () => void;
  generatePrompt: (inputName: string) => void;
  genres: string[];
  onGenreKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveGenre: (index: number) => void;
  plot?: string;
  releaseDate?: number;
  rating?: number;
  category: string;
  season?: number;
  episode?: number;
}) => (
  <fieldset className="my-4 grid content-start items-start rounded-md bg-neutral-800">
    <legend
      className="flex w-full cursor-pointer items-center justify-between rounded-md bg-neutral-700 px-4 py-2 text-center text-lg"
      onClick={onToggle}
    >
      Media Details
      <svg
        xmlns="http://www.w3.org/2000/svg"
        id="Bold"
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="currentColor"
      >
        <path d="M1.51,6.079a1.492,1.492,0,0,1,1.06.44l7.673,7.672a2.5,2.5,0,0,0,3.536,0L21.44,6.529A1.5,1.5,0,1,1,23.561,8.65L15.9,16.312a5.505,5.505,0,0,1-7.778,0L.449,8.64A1.5,1.5,0,0,1,1.51,6.079Z" />
      </svg>
    </legend>
    <div
      className={`grid grid-cols-2 gap-6 overflow-hidden px-4 transition-all duration-1000 ease-in-out ${open ? "max-h-[999px] py-6" : "max-h-0"}`}
    >
      <div className="col-span-2 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <label htmlFor="genres">Genres</label>
          <button
            onClick={(e) => {
              e.preventDefault();
              generatePrompt("genres");
            }}
            className="flex gap-1 rounded-md bg-main-500 px-2 py-1 font-semibold text-black"
          >
            <svg
              width="25"
              height="25"
              viewBox="0 0 102 78"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_41_13)">
                <path d="M87.0435 61.5528C83.016 61.7999 79.2178 63.5113 76.3646 66.3646C73.5113 69.2178 71.7999 73.016 71.5528 77.0435H71.4907C71.2439 73.0158 69.5327 69.2175 66.6793 66.3641C63.826 63.5108 60.0277 61.7995 56 61.5528V61.4907C60.0277 61.2439 63.826 59.5327 66.6793 56.6793C69.5327 53.826 71.2439 50.0277 71.4907 46H71.5528C71.7999 50.0275 73.5113 53.8256 76.3646 56.6789C79.2178 59.5321 83.016 61.2435 87.0435 61.4907V61.5528Z" />
              </g>
              <g clip-path="url(#clip1_41_13)">
                <path d="M70.9565 40.4188C61.7508 40.9838 53.0693 44.8956 46.5476 51.4173C40.0259 57.939 36.1142 66.6204 35.5492 75.8261H35.4073C34.8433 66.6201 30.9318 57.9381 24.4099 51.4162C17.8881 44.8943 9.20609 40.9828 0 40.4188L0 40.2769C9.20609 39.7129 17.8881 35.8015 24.4099 29.2796C30.9318 22.7577 34.8433 14.0757 35.4073 4.86963L35.5492 4.86963C36.1142 14.0754 40.0259 22.7568 46.5476 29.2785C53.0693 35.8002 61.7508 39.712 70.9565 40.2769V40.4188Z" />
              </g>
              <g clip-path="url(#clip2_41_13)">
                <path d="M101.783 24.4401C95.4536 24.8285 89.4852 27.5178 85.0015 32.0015C80.5178 36.4852 77.8285 42.4536 77.4401 48.7826H77.3425C76.9548 42.4534 74.2656 36.4846 69.7818 32.0008C65.298 27.517 59.3292 24.8278 53 24.4401V24.3425C59.3292 23.9548 65.298 21.2656 69.7818 16.7818C74.2656 12.298 76.9548 6.32918 77.3425 0L77.4401 0C77.8285 6.32896 80.5178 12.2974 85.0015 16.7811C89.4852 21.2648 95.4536 23.9541 101.783 24.3425V24.4401Z" />
              </g>
            </svg>
            Generate
          </button>
        </div>
        <input
          type="text"
          name="genres"
          placeholder=""
          className="w-full rounded-md p-2 text-sm text-black"
          onKeyDown={onGenreKeyDown}
        />
        {genres.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {genres.map((genre, index) => (
              <li
                key={index}
                onClick={() => onRemoveGenre(index)}
                className="cursor-pointer rounded-full border px-2 py-1 capitalize hover:border-red-500 hover:text-red-500"
              >
                {genre}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="col-span-2 row-span-2 grid grid-rows-subgrid gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="plot">Synopsis</label>
          <button
            onClick={(e) => {
              e.preventDefault();
              generatePrompt("plot");
            }}
            className="flex gap-1 rounded-md bg-main-500 px-2 py-1 font-semibold text-black"
          >
            <svg
              width="25"
              height="25"
              viewBox="0 0 102 78"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_41_13)">
                <path d="M87.0435 61.5528C83.016 61.7999 79.2178 63.5113 76.3646 66.3646C73.5113 69.2178 71.7999 73.016 71.5528 77.0435H71.4907C71.2439 73.0158 69.5327 69.2175 66.6793 66.3641C63.826 63.5108 60.0277 61.7995 56 61.5528V61.4907C60.0277 61.2439 63.826 59.5327 66.6793 56.6793C69.5327 53.826 71.2439 50.0277 71.4907 46H71.5528C71.7999 50.0275 73.5113 53.8256 76.3646 56.6789C79.2178 59.5321 83.016 61.2435 87.0435 61.4907V61.5528Z" />
              </g>
              <g clip-path="url(#clip1_41_13)">
                <path d="M70.9565 40.4188C61.7508 40.9838 53.0693 44.8956 46.5476 51.4173C40.0259 57.939 36.1142 66.6204 35.5492 75.8261H35.4073C34.8433 66.6201 30.9318 57.9381 24.4099 51.4162C17.8881 44.8943 9.20609 40.9828 0 40.4188L0 40.2769C9.20609 39.7129 17.8881 35.8015 24.4099 29.2796C30.9318 22.7577 34.8433 14.0757 35.4073 4.86963L35.5492 4.86963C36.1142 14.0754 40.0259 22.7568 46.5476 29.2785C53.0693 35.8002 61.7508 39.712 70.9565 40.2769V40.4188Z" />
              </g>
              <g clip-path="url(#clip2_41_13)">
                <path d="M101.783 24.4401C95.4536 24.8285 89.4852 27.5178 85.0015 32.0015C80.5178 36.4852 77.8285 42.4536 77.4401 48.7826H77.3425C76.9548 42.4534 74.2656 36.4846 69.7818 32.0008C65.298 27.517 59.3292 24.8278 53 24.4401V24.3425C59.3292 23.9548 65.298 21.2656 69.7818 16.7818C74.2656 12.298 76.9548 6.32918 77.3425 0L77.4401 0C77.8285 6.32896 80.5178 12.2974 85.0015 16.7811C89.4852 21.2648 95.4536 23.9541 101.783 24.3425V24.4401Z" />
              </g>
            </svg>
            Generate
          </button>
        </div>
        <textarea
          name="plot"
          className="min-h-40 rounded-md p-2 text-sm text-black"
          defaultValue={plot}
        />
      </div>
      <div className="col-span-2 row-span-2 grid grid-rows-subgrid gap-2">
        <label htmlFor="release_date">Release Year</label>
        <input
          type="number"
          name="release_date"
          min={1900}
          max={new Date().getFullYear()}
          defaultValue={releaseDate}
          className="w-full rounded-md p-2 text-sm text-black"
        />
      </div>
      <div className="col-span-2 row-span-2 grid grid-rows-subgrid gap-2">
        <label htmlFor="rating">Rating</label>
        <select
          name="rating"
          className="w-full rounded-md bg-white p-2 text-sm capitalize text-black"
          defaultValue={rating}
        >
          <option value=""></option>
          {Array.from({ length: 11 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      {category !== "movie" && (
        <>
          <div className="row-span-2 grid grid-rows-subgrid gap-2">
            <label htmlFor="season">Season</label>
            <input
              type="number"
              name="season"
              defaultValue={season}
              className="w-full rounded-md p-2 text-sm text-black"
            />
          </div>
          <div className="row-span-2 grid grid-rows-subgrid gap-2">
            <label htmlFor="episode">Episode</label>
            <input
              type="number"
              name="episode"
              defaultValue={episode}
              className="w-full rounded-md p-2 text-sm text-black"
            />
          </div>
        </>
      )}
    </div>
  </fieldset>
);
