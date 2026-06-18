import mongoose from "mongoose";

// Serverless-safe connection cache. On Vercel each cold start re-imports the
// module; without this cache every invocation would open a new connection and
// storm Atlas. We stash the connection (and the in-flight promise) on `global`.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = global as unknown as { _mongoose?: MongooseCache };

const cached: MongooseCache =
  globalForMongoose._mongoose ?? (globalForMongoose._mongoose = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to your environment / .env file.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Don't cache a rejected promise — otherwise every later invocation on this
    // warm instance reuses the failed connect and never retries until a cold
    // start. Clear it so the next request can attempt a fresh connection.
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
