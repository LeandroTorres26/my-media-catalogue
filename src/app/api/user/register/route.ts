import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  await connect();

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  await user.save();

  return NextResponse.json({ message: "User registered successfully" });
}
