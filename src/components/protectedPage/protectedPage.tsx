"use client"; // Indica que este é um componente do lado do cliente
import { useSession } from "next-auth/react"; // Importa useSession para acessar a sessão do usuário

export default function ProtectedPage() {
  // Componente de página protegida
  const { data: session } = useSession(); // Obtém a sessão do usuário

  if (!session) {
    // Verifica se o usuário está autenticado
    return <p>Você precisa estar logado para acessar esta página.</p>; // Retorna uma mensagem se o usuário não estiver autenticado
  }

  return <p>Bem-vindo, {session.user?.name}!</p>; // Retorna uma mensagem de boas-vindas se o usuário estiver autenticado
}
