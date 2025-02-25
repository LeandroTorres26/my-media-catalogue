import Link from "next/link";

interface MediaCardProps {
  isExpanded: boolean;
  onExpand: () => void;
}

export default function MediaCard({ isExpanded, onExpand }: MediaCardProps) {
  return (
    <li
      className={`grid cursor-pointer grid-rows-[auto_1fr] overflow-hidden rounded-3xl bg-neutral-900 transition-all duration-500 ease-in-out sm:grid-cols-[auto_1fr] sm:grid-rows-none ${isExpanded ? "sm:max-w-[600px]" : "sm:max-w-[250px]"}`}
      onClick={onExpand}
    >
      <div className="grid aspect-[1/1.5] grid-rows-[1fr_auto] sm:w-[250px]">
        <div className="bg-main-500 grid w-full place-content-center">
          Image
        </div>
        <h3 className="line-clamp-2 p-1 text-center">Movie Name</h3>
      </div>
      <div className="grid min-h-60 items-center gap-2 rounded-t-2xl border-t border-gray-800 px-4 py-2 sm:min-w-[350px] sm:border-none">
        <span>1952</span>
        <p className="text-justify text-sm">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam, facilis
          asperiores, ipsa enim, autem ipsam soluta iusto incidunt nostrum error
          perferendis eos. Maiores, eligendi hic. Natus autem veniam ipsum
          sapiente!
        </p>
        <ul className="mt-2 flex flex-wrap justify-between gap-2">
          <li className="rounded-full border px-2 py-1">Horror</li>
          <li className="rounded-full border px-2 py-1">Suspense</li>
          <li className="rounded-full border px-2 py-1">Drama</li>
          <li className="rounded-full border px-2 py-1">Drama</li>
          <li className="rounded-full border px-2 py-1">Romance</li>
        </ul>
        <Link href={"/catalogue"} className="ml-auto mr-0 mt-1 block w-fit">
          Ver mais
        </Link>
      </div>
    </li>
  );
}
