import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set; cannot run migrations.");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "..", "drizzle");

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

console.log(`Applying migrations from ${migrationsFolder}…`);
await migrate(db, { migrationsFolder });
await client.end();
console.log("Migrations applied successfully.");
