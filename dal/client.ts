import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and start Postgres.",
    );
  }

  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as {
  __dalDb?: ReturnType<typeof createDb>;
};

export const db = globalForDb.__dalDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__dalDb = db;
}
