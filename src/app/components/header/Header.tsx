import Link from "next/link";
export default function Header() {
  return (
    <header className="grid w-full place-content-center p-8">
      <nav className="flex w-fit gap-4 text-xl">
        <Link href="/">Home</Link>
        <Link href="/catalogue">Catalogue</Link>
      </nav>
    </header>
  );
}
