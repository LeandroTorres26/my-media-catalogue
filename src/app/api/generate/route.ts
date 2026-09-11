import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { AiError, generateJSON } from "@/lib/ai";

interface GenerateBody {
  target: "genres" | "plot" | "release_date";
  title?: string;
  category?: string;
  plot?: string;
  releaseYear?: number;
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { target, title, category, plot, releaseYear }: GenerateBody =
    await request.json();

  if (!title?.trim()) {
    return NextResponse.json(
      { error: "Please provide the title of your media" },
      { status: 400 },
    );
  }

  const plotHint = plot ? ` The synopsis is: ${plot}` : "";
  const yearHint = releaseYear ? ` The release year is: ${releaseYear}` : "";

  try {
    switch (target) {
      case "genres": {
        const { genres } = await generateJSON<{ genres: string[] }>(`
          List the genres for the ${category} titled "${title}".
          ${category === "anime" ? " Include anime-specific genres." : ""}
          ${plotHint}${yearHint}
          Reply as {"genres": ["genre one", "genre two"]} with lowercase names.
          If you don't recognize the title, reply {"genres": []}.
        `,);

        if (!Array.isArray(genres)) {
          return NextResponse.json(
            { error: "Could not find the genres for this title" },
            { status: 404 },
          );
        }
        return NextResponse.json({ genres });
      }

      case "plot": {
        const { plot: synopsis } = await generateJSON<{ plot: string }>(`
          Write a one-paragraph synopsis of the ${category} titled "${title}".
          Reply as {"plot": "the synopsis"}.
          If you don't recognize the title, reply {"plot": ""}.
        `,)
        if(!synopsis.trim()) {
          return NextResponse.json(
            { error: "Could not find a synopsis for this title" },
            { status: 404}
          )
        }
        return NextResponse.json({ plot: synopsis.trim() });
      }

      case "release_date": {
        const { release_date } = await generateJSON<{ release_date: string }>(`
          Give the release year of the ${category} titled "${title}".${plotHint}
          Reply as {"release_date": 1999} using a four-digit number.
          If you don't recognize the title, reply {"release_date": null}.
        `,);

        if (!release_date) {
          return NextResponse.json(
            { error: "Could not find the release year for this title" },
            { status: 404 },
          );
        }
        return NextResponse.json({ release_date });
      }

      default:
        return NextResponse.json(
          { error: "Invalid target input" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(error);
    const upstream = error instanceof AiError ? error.status : undefined;
    const status = upstream === 429 || upstream === 503 ? upstream : 502;
    return NextResponse.json(
      {
        error: "Error generating content",
        ...(process.env.NODE_ENV === "development" && {
          detail: error instanceof Error ? error.message : String(error),
        }),
      },
      { status },
    );
  }
}
