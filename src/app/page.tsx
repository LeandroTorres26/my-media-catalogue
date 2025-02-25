import ChangingText from "@/components/changingText/ChangingText";

export default function Home() {
  const words = ["movies", "tv shows", "documentaries", "anime"];
  return (
    <div className="grid min-h-screen place-content-center place-items-center gap-y-8 p-8 pb-20 sm:p-20">
      <h1 className="hidden">My Media Catalogue</h1>
      <h2 className="text-6xl">
        All your <ChangingText text={words} />, organized in one place
      </h2>
      <button className="rounded-3xl bg-main-500 px-8 py-4 font-bold text-black">
        Start Organizing
      </button>
    </div>
  );
}
