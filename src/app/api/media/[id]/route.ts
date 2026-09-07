import { NextResponse, NextRequest } from "next/server";
import connect from "@/lib/mongoose";
import Media from "@/models/Media";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

const EDITABLE_FIELDS = [
  "title",
  "category",
  "status",
  "rating",
  "image",
  "genres",
  "plot",
  "release_date",
  "current_episode",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    await connect();

    const media = await Media.findOne({ _id: id, user: token.sub });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: "Error getting media" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    await connect();

    const body = await request.json();
    const updates = Object.fromEntries(
      Object.entries(body).filter(([key]) => EDITABLE_FIELDS.includes(key)),
    );

    const media = await Media.findOneAndUpdate(
      { _id: id, user: token.sub },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch {
    return NextResponse.json(
      { error: "Error updating media" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    await connect();

    const media = await Media.findOneAndDelete({ _id: id, user: token.sub });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Media deleted" });
  } catch {
    return NextResponse.json(
      { error: "Error deleting media" },
      { status: 500 },
    );
  }
}
