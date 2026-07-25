import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI!);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  await client.close();
}
