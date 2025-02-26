import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (MONGODB_URI === "") {
  throw new Error("Please, add the MongoDB URI to the .env file");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
  console.log("uri>", MONGODB_URI);
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connect;

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}
