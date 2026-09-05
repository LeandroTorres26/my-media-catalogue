import mongoose, { Schema } from "mongoose";

export interface MediaDocument {
  _id?: string; // Optional, because MongoDB will add it automatically
  user: mongoose.Types.ObjectId;
  title: string;
  category: "movie" | "tv show" | "anime" | "documentary";
  status: "watching" | "on hold" | "completed" | "dropped" | "planning";
  image?: string;
  rating?: number;
  genres?: string[];
  plot?: string;
  release_date?: number;
  current_episode?: {
    episode: number;
    season: number;
  };
}

const MediaSchema = new mongoose.Schema<MediaDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    release_date: { type: Number },
    current_episode: {
      episode: { type: Number },
      season: { type: Number },
    },
  },
  { timestamps: true },
);

MediaSchema.index({ user: 1, createdAt: -1 });

const Media =
  mongoose.models.Media || mongoose.model<MediaDocument>("Media", MediaSchema);
export default Media;
