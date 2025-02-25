import { NextResponse } from "next/server"; // Importa NextResponse para criar respostas da API
import connect from "@/lib/mongoose"; // Importa a função de conexão com o MongoDB
import User from "@/models/User"; // Importa o modelo User
import bcrypt from "bcryptjs"; // Importa o bcrypt para comparar senhas

export async function POST(request: Request) {
  // Função para lidar com requisições POST
  const { email, password } = await request.json(); // Extrai email e senha do corpo da requisição
  await connect(); // Conecta ao MongoDB

  const user = await User.findOne({ email }); // Busca o usuário pelo email
  if (user && bcrypt.compareSync(password, user.password)) {
    // Compara a senha fornecida com a senha criptografada
    return NextResponse.json({ message: "Login bem-sucedido" }); // Retorna uma mensagem de sucesso
  }
  return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 }); // Retorna um erro se as credenciais estiverem incorretas
}
