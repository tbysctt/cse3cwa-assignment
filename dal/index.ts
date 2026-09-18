import { sql } from "drizzle-orm";

import { db } from "./client";

/** Temp check for DB connection */
export async function ping(): Promise<boolean> {
  await db.execute(sql`SELECT 1`);
  return true;
}
