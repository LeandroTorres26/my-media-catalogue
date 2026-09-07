import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface TmdbSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  poster_path: string | null;
  overview?: string;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
}

// TMDB returns genres as ids; the id -> name map rarely changes,
// so it's worth keeping it in memory instead of fetching on every request.
let genreCache: Map<number, string> | null = null;

async function getGenreMap(): Promise<Map<number, string>> {
  if (genreCache) return genreCache;

  const [movie, tv] = await Promise.all([
    fetch(`${TMDB_BASE}/genre/movie/list?api_key=${TMDB_API_KEY}`).then((r) =>
      r.json(),
    ),
    fetch(`${TMDB_BASE}/genre/tv/list?api_key=${TMDB_API_KEY}`).then((r) =>
      r.json(),
    ),
  ]);

  const genres = [...(movie?.genres ?? []), ...(tv?.genres ?? [])];
  const map = new Map<number, string>();
  for (const genre of genres) {
    map.set(genre.id, String(genre.name).toLowerCase());
  }

  // Only cache if something actually came back, so a temporary failure
  // doesn't freeze an empty map for the rest of the process lifetime.
  if (map.size > 0) genreCache = map;
  return map;
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB_API_KEY not configured" },
      { status: 500 },
    );
  }

  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const [response, genreMap] = await Promise.all([
      fetch(
        `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
      ),
      getGenreMap(),
    ]);

    if (!response.ok) {
      throw new Error(`TMDB respondeu ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results as TmdbSearchResult[])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, 8)
      .map((item) => {
        const date = item.release_date || item.first_air_date;
        return {
          tmdbId: item.id,
          title: item.title ?? item.name ?? "",
          image: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : null,
          plot: item.overview || null,
          release_date: date ? Number(date.slice(0, 4)) : null,
          genres: (item.genre_ids ?? [])
            .map((id) => genreMap.get(id))
            .filter((name): name is string => Boolean(name)),
          category: item.media_type === "movie" ? "movie" : "tv show",
        };
      });

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error searching TMDB" },
      { status: 502 },
    );
  }
}
