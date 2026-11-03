import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;

function getDb(): NeonHttpDatabase<typeof schema> {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL environment variable. Please configure your Neon connection string in your environment or Vercel project settings."
    );
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

let _db: NeonHttpDatabase<typeof schema> | null = null;

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = getDb();
    }
    const val = Reflect.get(_db, prop, receiver);
    if (typeof val === "function") {
      return (val as (...args: unknown[]) => unknown).bind(_db);
    }
    return val;
  },
});

export * from "./schema";
