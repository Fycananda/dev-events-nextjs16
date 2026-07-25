// import { MongoClient, Db } from "mongodb";

// // MongoDB connection string (replace with your actual URI)
// const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
// const DATABASE_NAME = process.env.DATABASE_NAME || "myapp";

// let client: MongoClient | null = null;
// let db: Db | null = null;

// // Function to get the database connection
// export async function connectDb(): Promise<Db> {
//   if (db) {
//     return db;
//   }

//   // Check if already connected
//   if (!client) {
//     client = new MongoClient(MONGODB_URI);
//     await client.connect();
//   }

//   db = client.db(DATABASE_NAME);
//   return db;
// }

// // Function to close the connection
// export async function closeDb(): Promise<void> {
//   if (db && client) {
//     await client.close();
//     console.log("MongoDB connection closed");
//   }
// }

// // Optional: Check connection status
// export async function checkConnection(): Promise<boolean> {
//   try {
//     const db = await connectDb();
//     const result = await db.admin().ping();
//     return result.ok === 1;
//   } catch (error) {
//     console.error("MongoDB connection failed:", error);
//     return false;
//   }
// }

// // Export the client for direct use if needed
// export default client

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
  await client.connect();
  const db = client.db(dbName);

  // Ini gantinya "index otomatis" Mongoose — dipanggil sekali aja
  // karena createIndex idempotent (aman dipanggil berkali-kali,
  // MongoDB skip kalau index udah ada dan definisinya sama)
  await Promise.all([ensureEventIndexes(db), ensureBookingIndexes(db)]);

  cache.client = client;
  cache.db = db;

  return db;
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
