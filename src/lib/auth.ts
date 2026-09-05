import CredentialsProvider from "next-auth/providers/credentials";
import connect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// Fica fora da route handler porque o App Router só permite que uma rota
// exporte métodos HTTP — exportar authOptions de lá quebra o build.
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connect();
        if (credentials) {
          const user = await User.findOne({ email: credentials.email });
          if (user && bcrypt.compareSync(credentials.password, user.password)) {
            return user;
          }
        }
        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};
