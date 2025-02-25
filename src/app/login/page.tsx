"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import Link from "next/link";
export default function Login() {
  const [error, setError] = useState("");

  const router = useRouter();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),

      password: formData.get("password"),

      redirect: false,
    });

    if (res?.error) {
      setError(res.error as string);
    }

    if (res?.ok) {
      return router.push("/catalogue");
    }
  };
  return (
    <div className="grid h-screen w-full place-items-center px-4">
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-[25rem] gap-6 self-center rounded-2xl bg-neutral-900 px-6 py-4"
      >
        {error && <div className="text-black">{error}</div>}
        <h1 className="justify-self-center text-2xl">Sign In</h1>
        <div className="flex flex-col gap-2">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            placeholder="youremail@mail.com"
            className="rounded-md px-2 py-1 text-sm text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            placeholder="password"
            className="rounded-md px-2 py-1 text-sm text-black"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <button className="mx-auto w-fit rounded-md border border-white px-4 py-2">
            Sign In
          </button>
          <Link href="/register" className="hover:underline">
            Do not have an account?
          </Link>
        </div>
      </form>
    </div>
  );
}
