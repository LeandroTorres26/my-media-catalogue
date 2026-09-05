import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

interface GenerateBody {
  target: "genres" | "plot" | "release_date";
  title?: string;
  category?: string;
  plot?: string;
  releaseYear?: number;
}

function parseGenres(response: string): string[] {
  const start = response.indexOf("[");
  const end = response.lastIndexOf("]");
  if (start === -1 || end === -1) return [];

  try {
    const parsed = JSON.parse(response.slice(start, end + 1));
    return Array.isArray(parsed)
      ? parsed
          .filter((genre): genre is string => typeof genre === "string")
          .map((genre) => genre.toLowerCase())
      : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_API_KEY não configurada" },
      { status: 500 },
    );
  }

  const { target, title, category, plot, releaseYear }: GenerateBody =
    await request.json();

  if (!title?.trim()) {
    return NextResponse.json(
      { error: "Please provide the title of your media" },
      { status: 400 },
    );
  }

  // Contexto opcional: só entra no prompt quando existe de verdade.
  const plotHint = plot ? ` The synopsis is: ${plot}` : "";
  const yearHint = releaseYear ? ` The release year is: ${releaseYear}` : "";

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    switch (target) {
      case "genres": {
        const prompt = `List the genres for the ${category} titled "${title}" as a JSON array of strings (only if you find real genres, otherwise return nothing) all lowercase.${category === "anime" ? " You can include anime genres." : ""}${plotHint}${yearHint}`;
        const result = await model.generateContent(prompt);
        const genres = parseGenres(result.response.text());

        if (genres.length === 0) {
          return NextResponse.json(
            { error: "Could not find the genres for this title" },
            { status: 404 },
          );
        }
        return NextResponse.json({ genres });
      }

      case "plot": {
        const prompt = `Write the synopsis of the ${category} titled "${title}". Summarize it in just a paragraph and nothing more. If you cannot find a synopsis just say so.`;
        const result = await model.generateContent(prompt);
        return NextResponse.json({ plot: result.response.text().trim() });
      }

      case "release_date": {
        const prompt = `Give me the release year of the ${category} titled "${title}" as a number in the YYYY format.${plotHint}`;
        const result = await model.generateContent(prompt);
        const year = parseInt(result.response.text(), 10);

        if (!year) {
          return NextResponse.json(
            { error: "Could not find the release year for this title" },
            { status: 404 },
          );
        }
        return NextResponse.json({ release_date: year });
      }

      default:
        return NextResponse.json(
          { error: "Invalid target input" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error generating content" },
      { status: 502 },
    );
  }
}
