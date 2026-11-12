import { db } from "@/lib/db";
import { generators, type Generator } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { GeneratorsView } from "@/components/generators/generators-view";
import {
  getLiveLocationsByGenerator,
  attachLiveLocationToGenerator,
} from "@/lib/sync-generators";

export const dynamic = "force-dynamic";

export default async function GeneratorsPage() {
  let initialGenerators: Generator[] = [];
  try {
    const liveMap = await getLiveLocationsByGenerator();
    const rows = await db
      .select()
      .from(generators)
      .orderBy(asc(generators.generatorId), asc(generators.id));

    initialGenerators = rows.map((g) => attachLiveLocationToGenerator(g, liveMap));
  } catch (err) {
    console.error("Error loading generators from database:", err);
  }

  return <GeneratorsView initialGenerators={initialGenerators} />;
}
