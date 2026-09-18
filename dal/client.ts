import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

export function createDb(connectionString?: string): AppDatabase {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and start Postgres.",
    );
  }

  const client = postgres(url, { max: 10 });
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as {
  __dalDb?: AppDatabase;
};

/** Lazy singleton — does not connect until first call. */
export function getDb(): AppDatabase {
  if (!globalForDb.__dalDb) {
    globalForDb.__dalDb = createDb();
  }
  return globalForDb.__dalDb;
}
