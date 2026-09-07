"use client";
import { useSession } from "next-auth/react";

export default function ProtectedPage() {
  const { data: session } = useSession();

  if (!session) {
    return <p>Você precisa estar logado para acessar esta página.</p>;
  }

  return <p>Bem-vindo, {session.user?.name}!</p>;
}
