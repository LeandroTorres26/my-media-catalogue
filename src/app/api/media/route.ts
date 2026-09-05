import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import Media from "@/models/Media";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const {
      title,
      category,
      rating,
      genres,
      plot,
      image,
      release_date,
      status,
      current_episode,
    } = await request.json();
    await connect();

    const media = await Media.create({
      user: token.sub,
      title,
      category,
      rating,
      genres,
      plot,
      image,
      release_date,
      status,
      current_episode,
    });

    return NextResponse.json(media, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ocorreu um erro ao cadastrar a mídia." },
      { status: 500 },
    );
  }
}
