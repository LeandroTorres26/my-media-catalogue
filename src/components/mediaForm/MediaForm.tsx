"use client";
import { useReducer, useState } from "react";
import { useCatalogueStore } from "@/stores/catalogueStore";
import { formReducer, formStateFromMedia, type FormAction, type FormState } from "./formReducer";

import TmdbSearch, { TmdbResult } from "./TmdbSearch";
import IdentitySection from "./IdentitySection";
import ProgressSection from "./ProgressSection";
import DetailsSection from "./DetailsSection";

const PROMPT_ERRORS: Record<number, string> = {
  429: "Too many requests. Try again in a minute.",
  503: "The AI service is busy. Try again in a few seconds.",
  502: "Could not reach the AI service.",
};

export default function MediaForm() {
  const mediaToEdit = useCatalogueStore((state) => state.mediaToEdit);
  const closeForm = useCatalogueStore((state) => state.closeForm);
  const loadMedias = useCatalogueStore((state) => state.loadMedias);

  const editMode = mediaToEdit !== null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [openMediaDetails, setOpenMediaDetails] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>("");

  const [form, dispatch] = useReducer(formReducer, mediaToEdit, formStateFromMedia);

  const applyTmdbResult = (result: TmdbResult) => {
    dispatch({ type: "applyTmdbResult", result });
    setOpenMediaDetails(true);
  };

  const submitMedia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if(!form.title.trim()) {
      setError("Title and Category are required.");
      return;
    }

    const mediaData = {
      title: form.title.trim(),
      category: form.category,
      status: form.status,
      image: form.image,
      rating: form.rating ?? null,
      genres: form.genres,
      plot: form.plot.trim() || null,
      release_date: form.releaseYear ?? null,
      current_episode: {
        season: form.season ?? null,
        episode: form.episode ?? null,
      },
    };

    setSubmitting(true);

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
        loadMedias();

        if (method === "PATCH") {
          closeForm();
        } else {
          dispatch({ type: "reset" });
          setTimeout(() => setSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error(error);
      setError("Failed to add media.");
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePrompt = async (targetInput: string) => {
    setPromptError("");

    if (!form.title.trim()) {
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
          title: form.title,
          category: form.category,
          plot: form.plot || undefined,
          releaseYear: form.releaseYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPromptError(PROMPT_ERRORS[res.status] ?? data.error ?? "Error generating content",);
        return;
      }

      switch (targetInput) {
        case "genres":
          dispatch({ type: "mergeGenres", genres: data.genres });
          break;
        case "plot":
          dispatch({ type: "setField", field: "plot", value: data.plot });
          break;
        case "release_date":
          dispatch({ type: "setField", field: "releaseYear", value: data.release_date });
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
          onSubmit={submitMedia}
          className="custom-scrollbar flex flex-col gap-x-16 gap-y-6 overflow-y-auto px-8"
        >
          <TmdbSearch onSelect={applyTmdbResult} />

          <IdentitySection form={form} dispatch={dispatch} />

          <ProgressSection form={form} dispatch={dispatch} />

          <DetailsSection
            form={form}
            dispatch={dispatch}
            open={openMediaDetails}
            onToggle={() => setOpenMediaDetails(!openMediaDetails)}
            generatePrompt={generatePrompt}
            promptLoading={promptLoading}
            promptError={promptError}
          />

          <button className="btn btn-outline btn-primary col-span-2 mx-auto min-w-24" disabled={submitting}>
            {submitting
              ? <span className="loading loading-spinner loading-sm"></span>
              : editMode
                ? "Save"
                : "Add"
            }
          </button>
        </form>
      </div>
    </dialog>
  );
}