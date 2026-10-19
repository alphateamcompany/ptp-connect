import { db } from "@/lib/db";
import { generators, rentalOrders } from "@/lib/db/schema";
import { eq, sql, inArray, or, ilike } from "drizzle-orm";

/**
 * Synchronizes generator status(es) based on current rental orders:
 * - If a generator has at least one active rental order -> status becomes "On Rent"
 * - If a generator has NO active rental orders:
 *     - If currently "On Rent", status reverts to "Available"
 *     - If currently "Maintenance", it remains "Maintenance"
 */
export async function syncGeneratorStatusesWithRentals(targetGeneratorId?: number) {
  try {
    // 1. Try to auto-link any active rental orders that have null generatorId
    // but match an existing generator's name or generatorId
    const unlinkedActiveOrders = await db
      .select({
        id: rentalOrders.id,
        generatorName: rentalOrders.generatorName,
      })
      .from(rentalOrders)
      .where(
        sql`LOWER(${rentalOrders.status}) = 'active' AND ${rentalOrders.generatorId} IS NULL`
      );

    if (unlinkedActiveOrders.length > 0) {
      for (const order of unlinkedActiveOrders) {
        if (!order.generatorName) continue;
        const trimmed = order.generatorName.trim();
        const baseName = trimmed.split("(")[0].trim();
        const [matched] = await db
          .select({ id: generators.id })
          .from(generators)
          .where(
            or(
              eq(generators.name, trimmed),
              eq(generators.generatorId, trimmed),
              eq(generators.name, baseName),
              ilike(generators.name, `%${baseName}%`)
            )
          )
          .limit(1);

        if (matched) {
          await db
            .update(rentalOrders)
            .set({ generatorId: matched.id, updatedAt: new Date() })
            .where(eq(rentalOrders.id, order.id));
        }
      }
    }

    // 2. Fetch all active rental orders with a non-null generatorId
    const activeOrders = await db
      .select({
        generatorId: rentalOrders.generatorId,
      })
      .from(rentalOrders)
      .where(
        sql`LOWER(${rentalOrders.status}) = 'active' AND ${rentalOrders.generatorId} IS NOT NULL`
      );

    const activeGenIdSet = new Set<number>();
    for (const order of activeOrders) {
      if (order.generatorId) activeGenIdSet.add(order.generatorId);
    }

    // 3. Query target generator(s)
    let gensQuery = db.select({ id: generators.id, status: generators.status }).from(generators);
    if (targetGeneratorId) {
      // @ts-expect-error drizzle where typing
      gensQuery = gensQuery.where(eq(generators.id, targetGeneratorId));
    }
    const allGens = await gensQuery;

    const toMarkOnRent: number[] = [];
    const toMarkAvailable: number[] = [];

    for (const gen of allGens) {
      const hasActiveRental = activeGenIdSet.has(gen.id);
      const currentStatus = (gen.status || "").trim();

      if (hasActiveRental) {
        if (currentStatus !== "On Rent") {
          toMarkOnRent.push(gen.id);
        }
      } else {
        // No active rental order
        // If it was "On Rent", it should revert to "Available"
        if (currentStatus === "On Rent") {
          toMarkAvailable.push(gen.id);
        }
      }
    }

    if (toMarkOnRent.length > 0) {
      await db
        .update(generators)
        .set({ status: "On Rent", updatedAt: new Date() })
        .where(inArray(generators.id, toMarkOnRent));
    }

    if (toMarkAvailable.length > 0) {
      await db
        .update(generators)
        .set({ status: "Available", updatedAt: new Date() })
        .where(inArray(generators.id, toMarkAvailable));
    }

    return {
      success: true,
      updatedOnRent: toMarkOnRent.length,
      updatedAvailable: toMarkAvailable.length,
    };
  } catch (err) {
    console.error("Failed to sync generator statuses with rental orders:", err);
    return { success: false, error: (err as Error).message };
  }
}
