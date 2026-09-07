import CredentialsProvider from "next-auth/providers/credentials";
import connect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// Lives outside the route handler because the App Router only lets a route
// export HTTP methods — exporting authOptions from there breaks the build.
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
