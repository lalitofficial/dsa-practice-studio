import { MongoClient, type Db } from "mongodb";

// Reuse one connection across warm serverless invocations. Vercel keeps the
// module scope alive between requests on the same instance, so caching the
// connect() promise on globalThis avoids opening a new pool per request.
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "dsa_studio";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local / Vercel env.");
  }
  if (!globalThis.__mongoClientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    globalThis.__mongoClientPromise = client.connect();
  }
  return globalThis.__mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
