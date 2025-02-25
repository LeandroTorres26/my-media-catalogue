import mongoose, { Types } from "mongoose";

export interface UserDocument {
  email: string;
  password: string;
  name: string;
  medias?: Types.ObjectId[];
}

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email is invalid",
      ],
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    medias: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
  },
  { timestamps: true },
);

export default mongoose.models.User<UserDocument> ||
  mongoose.model<UserDocument>("User", UserSchema);
