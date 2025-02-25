"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function Header() {
  const { status } = useSession();
  const router = useRouter();

  const showSession = () => {
    if (status === "authenticated") {
      return (
        <button
          className="rounded-full border px-4 py-2 transition-colors duration-200 hover:border-main-300 hover:text-main-300"
          onClick={() => {
            signOut({ redirect: false }).then(() => {
              router.push("/");
            });
          }}
        >
          Sign Out
        </button>
      );
    } else if (status === "loading") {
      return <span className="mt-7 text-sm text-[#888]">Loading...</span>;
    } else {
      return (
        <Link
          href="/login"
          className="rounded-full border px-4 py-2 transition-colors duration-200 hover:border-main-300 hover:text-main-300"
        >
          Sign In
        </Link>
      );
    }
  };
  return (
    <header className="fixed flex w-full justify-end px-8 py-4 text-xl">
      <nav className="flex w-fit items-center gap-8">
        <Link
          href="/"
          className="transition-colors duration-200 hover:text-main-300"
        >
          Home
        </Link>
        <Link
          href="/catalogue"
          className="transition-colors duration-200 hover:text-main-300"
        >
          Catalogue
        </Link>
        {showSession()}
      </nav>
    </header>
  );
}
