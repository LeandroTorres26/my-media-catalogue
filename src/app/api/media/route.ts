import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import Media from "@/models/Media";
import User from "@/models/User"; // Importe o modelo User
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

    const media = new Media({
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

    await media.save();

    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ error: "User not Found" }, { status: 404 });
    }
    user.medias.push(media._id);
    await user.save();

    return NextResponse.json({ message: "Meddia added succesfully" });
  } catch {
    return NextResponse.json(
      { error: "Ocorreu um erro ao cadastrar a mídia." },
      { status: 500 },
    );
  }
}
