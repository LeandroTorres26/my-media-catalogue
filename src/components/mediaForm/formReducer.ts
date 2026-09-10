import type { MediaDocument } from "@/models/Media";
import type { TmdbResult } from "./TmdbSearch";

export type MediaCategory = MediaDocument["category"];
export type MediaStatus = MediaDocument["status"];

export type FormState = {
    title: string;
    image: string | null;
    category: MediaCategory;
    status: MediaStatus;
    genres: string[];
    plot: string;
    releaseYear: number | undefined;
    season: number | undefined;
    episode: number | undefined;
    rating: number | undefined;
}

const SERIALIZED: MediaCategory[] = ["tv show", "anime"];
const IN_PROGRESS: MediaStatus[] = ["watching", "on hold", "dropped"];

export const hasProgress = (state: FormState) => SERIALIZED.includes(state.category) && IN_PROGRESS.includes(state.status);
export const hasRating = (state: FormState) => state.status !== "planning";

export const initialFormState: FormState = {
  title: "",
  image: null,
  category: "movie",
  status: "watching",
  genres: [],
  plot: "",
  releaseYear: undefined,
  season: undefined,
  episode: undefined,
  rating: undefined,
};

export const formStateFromMedia = (media?: MediaDocument | null): FormState =>
  media
    ? {
        title: media.title,
        image: media.image ?? null,
        category: media.category,
        status: media.status,
        genres: media.genres ?? [],
        plot: media.plot ?? "",
        releaseYear: media.release_date,
        season: media.current_episode?.season,
        episode: media.current_episode?.episode,
        rating: media.rating,
      }
    : initialFormState;

type SetFieldAction = {
  [K in keyof FormState]: { type: "setField"; field: K; value: FormState[K] };
}[keyof FormState];

export type FormAction =
  | SetFieldAction
  | { type: "setCategory"; category: MediaCategory }
  | { type: "setStatus"; status: MediaStatus }
  | { type: "addGenre"; genre: string }
  | { type: "removeGenre"; index: number }
  | { type: "mergeGenres"; genres: string[] }
  | { type: "applyTmdbResult"; result: TmdbResult }
  | { type: "reset" };

const clearProgressIfHidden = (state: FormState): FormState =>
  hasProgress(state)
    ? state
    : { ...state, season: undefined, episode: undefined };

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setCategory":
      return clearProgressIfHidden({ ...state, category: action.category });
    case "setStatus":
      return clearProgressIfHidden({ ...state, status: action.status });
    case "addGenre": {
      const genre = action.genre.trim().toLocaleLowerCase();
      if (!genre) return state;
      return { ...state, genres: [...new Set([...state.genres, genre])] };
    }
    case "removeGenre":
      return {
        ...state,
        genres: state.genres.filter((_, i) => i !== action.index),
      }
    case "mergeGenres":
      return {
        ...state,
        genres: [...new Set([...state.genres, ...action.genres])],
      };
    case "applyTmdbResult": {
      const { result } = action;

      const category =
        state.category === "movie" && result.category === "tv show"
          ? "tv show"
          : state.category;

      return clearProgressIfHidden({
        ...state,
        category,
        title: result.title,
        image: result.image,
        plot: result.plot ?? state.plot,
        releaseYear: result.release_date ?? state.releaseYear,
        genres: [...new Set([...state.genres, ...result.genres])],
      });
    }

    case "reset":
      return initialFormState;
  }
}