"use client";
import { useRef, useState } from "react";

export default function MediaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const addMedia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    const getValueOrNull = (value: string | null) => {
      return value?.trim() === "" ? null : value;
    };

    const mediaData = {
      title: getValueOrNull(formData.get("title") as string),
      category: getValueOrNull(formData.get("category") as string) as
        | "movie"
        | "tv show"
        | "anime"
        | "documentary",
      status: getValueOrNull(formData.get("status") as string) as
        | "watching"
        | "on hold"
        | "completed"
        | "dropped"
        | "planning",
      image: getValueOrNull(formData.get("image") as string),
      rating:
        formData.get("rating") === "" ? null : Number(formData.get("rating")),
      genres: (formData.get("genres") as string)
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== ""),
      plot: getValueOrNull(formData.get("plot") as string),
      release_date: formData.get("release_date")
        ? new Date(formData.get("release_date") as string)
        : null,
      current_episode: {
        episode: formData.get("episode")
          ? Number(formData.get("episode"))
          : null,
        season: formData.get("season") ? Number(formData.get("season")) : null,
      },
    };

    if (!mediaData.title || !mediaData.category) {
      setError("Título e categoria são obrigatórios.");
      return;
    }

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaData),
      });
      if (res.ok) {
        console.log("Media added successfully");
        setSuccess(true);
        setError(null);
        formRef.current.reset();
      }
    } catch (error) {
      console.error(error);
      setError("Erro ao adicionar mídia.");
      setSuccess(false);
    }
  };

  return (
    <form
      ref={formRef}
      className="fixed grid grid-cols-2 justify-center gap-4 gap-x-16 rounded-2xl bg-neutral-900 px-8 py-4"
      onSubmit={addMedia}
    >
      <div className="col-span-2 flex flex-col items-center">
        <h2 className="text-center text-2xl">New Media</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {success && (
          <p className="mb-4 text-green-500">Media added successfully!</p>
        )}
      </div>
      <fieldset className="grid content-start items-start gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            name="title"
            placeholder=""
            className="rounded-md p-2 text-sm text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="category">Category</label>
          <select
            name="category"
            className="rounded-md bg-white p-2 text-sm capitalize text-black"
          >
            <option value="movie">Movie</option>
            <option value="tv show">TV Show</option>
            <option value="anime">Anime</option>
            <option value="documentary">Documentary</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="status">Status</label>
          <select
            name="status"
            className="rounded-md bg-white p-2 text-sm capitalize text-black"
          >
            <option value="watching">Watching</option>
            <option value="on hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
            <option value="planning">Planning</option>
          </select>
        </div>
      </fieldset>
      <fieldset className="grid grid-cols-2 content-start gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="rating">Rating</label>
          <select
            name="rating"
            className="rounded-md bg-white p-2 text-sm capitalize text-black"
            defaultValue=""
          >
            <option value=""></option> {/* Opção vazia */}
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="image">Image</label>
          <input
            type="text"
            name="image"
            placeholder=""
            className="rounded-md p-2 text-sm text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="genres">Genres</label>
          <input
            type="text"
            name="genres"
            placeholder=""
            className="rounded-md p-2 text-sm text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="plot">Synopsis</label>
          <textarea
            name="plot"
            placeholder=""
            className="rounded-md p-2 text-sm text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="release_date">Release Date</label>
          <input
            type="date"
            name="release_date"
            placeholder=""
            className="rounded-md p-2 text-sm text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="season">Season</label>
          <input
            type="number"
            name="season"
            placeholder=""
            className="rounded-md p-2 text-sm text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="episode">Episode</label>
          <input
            type="number"
            name="episode"
            placeholder=""
            className="rounded-md p-2 text-sm text-black"
          />
        </div>
      </fieldset>
      <button className="col-span-2 mx-auto w-fit rounded-md border border-white px-4 py-2 hover:border-main-500 hover:bg-main-500 hover:text-black">
        Add
      </button>
    </form>
  );
}
