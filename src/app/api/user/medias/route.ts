import connect from "@/lib/mongoose";
import mongoose from "mongoose";
import User from "@/models/User";
import Media, { MediaDocument } from "@/models/Media";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { NextApiRequest } from "next";

export async function GET(request: NextApiRequest) {
  try {
    await connect();
    mongoose.model<MediaDocument>("Media", Media.schema);
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const urlParams = new URLSearchParams(request.url?.split("?")[1] || "");
    const searchTerm = urlParams.get("search");
    const category = urlParams.get("category");
    let matchQuery = {};
    if (searchTerm || category) {
      matchQuery = {
        ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
        ...(category && { category: category }),
      };
    }
    const user = await User.findOne({ email: token.email }).populate({
      path: "medias",
      match: matchQuery,
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.medias);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server internal error" },
      { status: 500 },
    );
  }
}
