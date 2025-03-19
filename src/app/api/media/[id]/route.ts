import { NextResponse, NextRequest } from "next/server";
import connect from "@/lib/mongoose";
import Media from "@/models/Media";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const userId = token.sub;

    await connect();

    let mediaId;
    try {
      mediaId = new mongoose.Types.ObjectId(params.id);
    } catch {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (
      !user ||
      !user.medias.some((id: mongoose.Types.ObjectId) => id.equals(mediaId))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: "Error getting media" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const userId = token.sub;

    await connect();

    let mediaId;
    try {
      mediaId = new mongoose.Types.ObjectId(params.id);
    } catch {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (
      !user ||
      !user.medias.some((id: mongoose.Types.ObjectId) => id.equals(mediaId))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    Object.keys(body).forEach((key) => {
      media[key] = body[key];
    });

    await media.save();

    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: "Error getting media" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const userId = token.sub;

    await connect();

    let mediaId;
    try {
      mediaId = new mongoose.Types.ObjectId(params.id);
    } catch {
      return NextResponse.json({ error: "Invalid media ID" }, { status: 400 });
    }

    const media = await Media.findByIdAndDelete(mediaId);
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (
      !user ||
      !user.medias.some((id: mongoose.Types.ObjectId) => id.equals(mediaId))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ message: "Media deleted" });
  } catch {
    return NextResponse.json({ error: "Error getting media" }, { status: 500 });
  }
}
