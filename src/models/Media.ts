import mongoose from "mongoose";

export interface MediaDocument {
  title: string;
  category: "movie" | "tv show" | "anime" | "documentary";
  status: "watching" | "on hold" | "completed" | "dropped" | "planning";
  image?: string;
  rating?: number;
  genres?: string[];
  plot?: string;
  release_date?: Date;
  current_episode?: {
    episode: number;
    season: number;
  };
}

const MediaSchema = new mongoose.Schema<MediaDocument>(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["movie", "tv show", "anime", "documentary"],
      required: true,
    },
    status: {
      type: String,
      enum: ["watching", "on hold", "completed", "dropped", "planning"],
      required: true,
    },
    rating: { type: Number },
    image: { type: String },
    genres: { type: [String] },
    plot: { type: String },
    release_date: { type: Date },
    current_episode: {
      episode: { type: Number },
      season: { type: Number },
    },
  },
  { timestamps: true },
);

const Media =
  mongoose.models.Media<MediaDocument> || mongoose.model("Media", MediaSchema);
export default Media;
