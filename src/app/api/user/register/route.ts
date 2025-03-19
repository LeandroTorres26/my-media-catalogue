import { NextResponse } from "next/server"; // Importa NextResponse para criar respostas da API
import connect from "@/lib/mongoose"; // Importa a função de conexão com o MongoDB
import User from "@/models/User"; // Importa o modelo User
import bcrypt from "bcryptjs"; // Importa o bcrypt para criptografar senhas

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  await connect();

  const hashedPassword = bcrypt.hashSync(password, 10); // Criptografa a senha com bcrypt
  const user = new User({ name, email, password: hashedPassword }); // Cria um novo usuário com email e senha criptografada
  await user.save(); // Salva o usuário no banco de dados

  return NextResponse.json({ message: "Usuário registrado com sucesso" }); // Retorna uma mensagem de sucesso
}
