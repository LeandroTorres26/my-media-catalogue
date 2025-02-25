import { NextResponse } from "next/server"; // Importa NextResponse para criar respostas da API
import connect from "@/lib/mongoose"; // Importa a função de conexão com o MongoDB
import Media from "@/models/Media"; // Importa o modelo Media
import { getSession } from "next-auth/react"; // Importa getSession para verificar a sessão do usuário

export async function POST(request: Request) {
  // Função para lidar com requisições POST
  const session = await getSession(); // Obtém a sessão do usuário
  if (!session) {
    // Verifica se o usuário está autenticado
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); // Retorna um erro se o usuário não estiver autenticado
  }

  const {
    title,
    category,
    rating,
    genres,
    plot,
    image,
    release_date,
    status,
    current_episode,
    userId,
  } = await request.json();
  await connect(); // Conecta ao MongoDB

  const media = new Media({
    title,
    category,
    rating,
    genres,
    plot,
    image,
    release_date,
    status,
    current_episode,
    userId,
  });

  await media.save(); // Salva a mídia no banco de dados

  return NextResponse.json({ message: "Mídia cadastrada com sucesso" }); // Retorna uma mensagem de sucesso
}
