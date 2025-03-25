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
    const orderBy = urlParams.get("orderby");

    let matchQuery = {};
    if (searchTerm || category) {
      matchQuery = {
        ...(searchTerm && { title: { $regex: searchTerm, $options: "i" } }),
        ...(category && { category: category }),
      };
    }

    let sortQuery = {};
    if (orderBy) {
      switch (orderBy) {
        case "a-z":
          sortQuery = { title: 1 };
          break;
        case "z-a":
          sortQuery = { title: -1 };
          break;
        case "date_added_newest":
          sortQuery = { createdAt: -1 };
          break;
        case "date_added_oldest":
          sortQuery = { createdAt: 1 };
          break;
        case "last_modified":
          sortQuery = { updatedAt: -1 };
          break;
        case "release_year_newest":
          sortQuery = { release_date: -1 };
          break;
        case "release_year_oldest":
          sortQuery = { release_date: 1 };
          break;
        case "rating_highest":
          sortQuery = { rating: -1 };
          break;
        case "rating_lowest":
          sortQuery = { rating: 1 };
          break;
        default:
          break;
      }
    }

    const user = await User.findOne({ email: token.email }).populate({
      path: "medias",
      match: matchQuery,
      options: { sort: sortQuery },
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
