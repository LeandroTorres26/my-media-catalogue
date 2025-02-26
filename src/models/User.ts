import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  password: string;
  name: string;
  medias?: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new mongoose.Schema<UserDocument>(
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
    medias: [{ type: Schema.Types.ObjectId, ref: "Media" }],
  },
  { timestamps: true },
);

const User =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);
export default User;
