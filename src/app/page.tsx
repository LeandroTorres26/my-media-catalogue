import ChangingText from "@/components/changingText/ChangingText";
import Link from "next/link";

export default function Home() {
  const words = ["movies", "tv shows", "documentaries", "anime"];
  return (
    <div className="grid min-h-screen place-content-center place-items-center gap-y-8 p-8 pb-20 sm:p-20">
      <h1 className="hidden">My Media Catalogue</h1>
      <h2 className="w-full text-center text-5xl sm:text-6xl">
        All your <ChangingText text={words} />, organized in one place.
      </h2>
      <Link href={"/login"} className="btn btn-primary btn-xl">
        Start Now
      </Link>
    </div>
  );
}
