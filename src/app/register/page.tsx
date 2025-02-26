"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="grid h-screen w-full place-items-center px-4">
      <form
        onSubmit={registerUser}
        className="grid w-full max-w-[25rem] gap-6 self-center rounded-2xl bg-neutral-900 px-6 py-4"
      >
        <h1 className="justify-self-center text-2xl">Sign Up</h1>
        <div className="flex flex-col gap-2">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            placeholder="John Doe"
            className="rounded-md px-2 py-1 text-sm text-black"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            placeholder="youremail@mail.com"
            className="rounded-md px-2 py-1 text-sm text-black"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            placeholder="password"
            className="rounded-md px-2 py-1 text-sm text-black"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <button className="mx-auto w-fit rounded-md border border-white px-4 py-2 hover:border-main-500 hover:bg-main-500 hover:text-black">
            Sign Up
          </button>
          <Link href="/login" className="hover:underline">
            Already have an account?
          </Link>
        </div>
      </form>
    </div>
  );
}
