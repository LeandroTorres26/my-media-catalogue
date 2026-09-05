"use client";
import Image from "next/image";
import { useState } from "react";

export interface TmdbResult {
  tmdbId: number;
  title: string;
  image: string | null;
  plot: string | null;
  release_date: number | null;
  genres: string[];
  category: "movie" | "tv show";
}

export default function TmdbSearch({
  onSelect,
}: {
  onSelect: (result: TmdbResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const term = query.trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error("Search failed");

      const data: TmdbResult[] = await res.json();
      setResults(data);
      if (data.length === 0) setError("No results found");
    } catch (err) {
      console.error(err);
      setError("Could not reach TMDB. Check your TMDB_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: TmdbResult) => {
    onSelect(result);
    setResults([]);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="tmdb-search">Fill Form automatically</label>
      <div className="flex gap-2">
        <input
          id="tmdb-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Sem isso, Enter aqui dispara o submit do form inteiro.
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Search for a movie or TV show"
          className="input w-full"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            "Search"
          )}
        </button>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {results.length > 0 && (
        <ul className="bg-base-200 max-h-64 overflow-y-auto rounded-md">
          {results.map((result) => (
            <li key={`${result.category}-${result.tmdbId}`}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="hover:bg-base-300 flex w-full items-center gap-3 p-2 text-left"
              >
                {result.image ? (
                  <Image
                    src={result.image}
                    width={40}
                    height={60}
                    alt=""
                    className="h-15 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="bg-base-300 h-15 w-10 shrink-0 rounded" />
                )}
                <span className="flex flex-col">
                  <span>{result.title}</span>
                  <span className="text-sm capitalize opacity-60">
                    {result.category}
                    {result.release_date ? ` · ${result.release_date}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
