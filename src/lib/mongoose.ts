import mongoose from "mongoose"; // Importa o Mongoose para interagir com o MongoDB

const MONGODB_URI = process.env.MONGODB_URI || ""; // Obtém a URI de conexão do MongoDB do arquivo .env

if (MONGODB_URI === "") {
  // Verifica se a URI do MongoDB foi fornecida
  throw new Error("Por favor, adicione a URI do MongoDB no arquivo .env"); // Lança um erro se a URI não estiver definida
}

let cached = global.mongoose; // Tenta reutilizar uma conexão existente armazenada no objeto global

if (!cached) {
  // Se não houver uma conexão em cache, inicializa o objeto
  cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
  console.log("uri>", MONGODB_URI);
  // Função para conectar ao MongoDB
  if (cached.conn) {
    // Se já houver uma conexão em cache, retorna ela
    return cached.conn;
  }

  if (!cached.promise) {
    // Se não houver uma promessa de conexão em cache, cria uma nova
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose); // Conecta ao MongoDB e armazena a promessa
  }

  cached.conn = await cached.promise; // Aguarda a resolução da promessa e armazena a conexão
  return cached.conn; // Retorna a conexão estabelecida
}

export default connect; // Exporta a função de conexão para ser usada em outros arquivos

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}
