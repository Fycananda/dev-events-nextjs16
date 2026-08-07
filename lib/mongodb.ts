import { ensureBookingIndexes } from "@/repository/bookings";
import { ensureEventIndexes } from "@/repository/events";
import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) throw new Error("Please define MONGODB_URI in .env.local");
if (!dbName) throw new Error("Please define MONGODB_DB in .env.local");

// Cache koneksi di global object supaya gak ke-reset tiap hot-reload (dev mode)
// dan biar gak bikin koneksi baru tiap function dipanggil (production/serverless)
interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<Db> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: MongoCache | undefined;
}

const cache: MongoCache = global._mongoCache ?? {
  client: null,
  db: null,
  promise: null,
};
global._mongoCache = cache;

async function connect(): Promise<Db> {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db(dbName);

    // Ini gantinya "index otomatis" Mongoose — dipanggil sekali aja
    // karena createIndex idempotent (aman dipanggil berkali-kali,
    // MongoDB skip kalau index udah ada dan definisinya sama)
    await Promise.all([ensureEventIndexes(db), ensureBookingIndexes(db)]);

    cache.client = client;
    cache.db = db;

    return db;
  } catch (error) {
    try {
      await client.close();
    } catch (closeError) {
      console.log("Failed to close MongoDB connection:", closeError);
    }
    console.error(error);
    throw error;
  }
}

export async function getDb(): Promise<Db> {
  if (cache.db) return cache.db;

  if (!cache.promise) {
    cache.promise = connect().catch((err) => {
      cache.promise = null;
      throw err;
    });
  }

  return cache.promise;
}
