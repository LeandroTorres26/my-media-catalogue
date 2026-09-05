import connect from "@/lib/mongoose";
import Media from "@/models/Media";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const urlParams = request.nextUrl.searchParams;
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

    const medias = await Media.find({ user: token.sub, ...matchQuery }).sort(
      sortQuery,
    );

    return NextResponse.json(medias);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server internal error" },
      { status: 500 },
    );
  }
}
