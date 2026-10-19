import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Missing DATABASE_URL environment variable. Please configure your Neon connection string."
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export * from "./schema";
