import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-base-content/10 bg-base-200 w-full border-t px-8 py-4">
      <div className="container mx-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="The Movie Database"
        >
          <Image
            src="/tmdb-logo.svg"
            alt="TMDB"
            width={489}
            height={35}
            className="h-3.5 w-auto"
          />
        </a>
        <p className="text-base-content/40 text-[10px]">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
