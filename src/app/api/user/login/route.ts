import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  await connect();

  const user = await User.findOne({ email });
  if (user && bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ message: "Login successful" });
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
