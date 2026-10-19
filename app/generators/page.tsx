import { db } from "@/lib/db";
import { generators, type Generator } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { GeneratorsView } from "@/components/generators/generators-view";
import { syncGeneratorStatusesWithRentals } from "@/lib/sync-generators";

export const dynamic = "force-dynamic";

export default async function GeneratorsPage() {
  let initialGenerators: Generator[] = [];
  try {
    await syncGeneratorStatusesWithRentals();
    initialGenerators = await db
      .select()
      .from(generators)
      .orderBy(desc(generators.createdAt), desc(generators.id));
  } catch (err) {
    console.error("Error loading generators from database:", err);
  }

  return <GeneratorsView initialGenerators={initialGenerators} />;
}
