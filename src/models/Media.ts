import mongoose, { Types } from "mongoose";

export interface MediaDocument {
  title: string;
  category: string;
  rating?: number;
  genres?: string[];
  plot?: string;
  image?: string;
  release_date?: Date;
  status: "watching" | "on hold" | "completed" | "dropped" | "planning";
  current_episode?: {
    episode: number;
    season: number;
  };
  userId: Types.ObjectId;
}

const MediaSchema = new mongoose.Schema<MediaDocument>(
  {
    title: { type: String, required: true },
    genres: { type: [String] },
    plot: { type: String }, // plot opcional, pois não é obrigatório
    image: { type: String }, // String opcional
    release_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["watching", "on hold", "completed", "dropped", "planning"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    current_episode: {
      episode: { type: Number },
      season: { type: Number },
    },
  },
  { timestamps: true },
);

// Exporta o modelo Media, reutilizando um modelo existente se já houver um definido
export default mongoose.models.Media<MediaDocument> ||
  mongoose.model<MediaDocument>("Media", MediaSchema);
