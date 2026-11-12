import { db } from "@/lib/db";
import { generators, rentalOrders } from "@/lib/db/schema";
import { eq, sql, inArray, or, ilike, desc } from "drizzle-orm";

/**
 * Checks whether the rental period for a given end date is over.
 * The end date is considered active throughout the entire end day (until 23:59:59.999).
 */
export function isRentalPeriodOver(endDateStr: string | null | undefined): boolean {
  if (!endDateStr || !endDateStr.trim()) return false;
  const trimmed = endDateStr.trim();

  // Try YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
    return endOfDay.getTime() < Date.now();
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
    return endOfDay.getTime() < Date.now();
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    parsed.setHours(23, 59, 59, 999);
    return parsed.getTime() < Date.now();
  }

  return false;
}

/**
 * Checks whether the rental period has started.
 */
export function isRentalPeriodStarted(startDateStr: string | null | undefined): boolean {
  if (!startDateStr || !startDateStr.trim()) return true;
  const trimmed = startDateStr.trim();

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    return startOfDay.getTime() <= Date.now();
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    parsed.setHours(0, 0, 0, 0);
    return parsed.getTime() <= Date.now();
  }

  return true;
}

/**
 * Synchronizes generator status(es) based on current rental orders:
 * - If a generator has at least one active, unexpired rental order -> status becomes "On Rent"
 * - If a generator has NO active/unexpired rental orders:
 *     - If currently "On Rent", status reverts to "Available"
 *     - If currently "Maintenance" or "Sales", it remains untouched
 * - Also auto-completes rental orders whose assigned rental period has ended.
 */
export async function syncGeneratorStatusesWithRentals(targetGeneratorId?: number) {
  try {
    // 0. Auto-complete rental orders whose assigned rental period has ended
    const allActiveOrders = await db
      .select({
        id: rentalOrders.id,
        orderNumber: rentalOrders.orderNumber,
        generatorId: rentalOrders.generatorId,
        endDate: rentalOrders.endDate,
      })
      .from(rentalOrders)
      .where(sql`LOWER(${rentalOrders.status}) = 'active'`);

    const expiredOrderIds: number[] = [];
    for (const order of allActiveOrders) {
      if (isRentalPeriodOver(order.endDate)) {
        expiredOrderIds.push(order.id);
      }
    }

    if (expiredOrderIds.length > 0) {
      await db
        .update(rentalOrders)
        .set({ status: "Completed", updatedAt: new Date() })
        .where(inArray(rentalOrders.id, expiredOrderIds));
    }

    // 1. Try to auto-link any active, unexpired rental orders that have null generatorId
    // but match an existing generator's name or generatorId
    const unlinkedActiveOrders = await db
      .select({
        id: rentalOrders.id,
        generatorName: rentalOrders.generatorName,
        endDate: rentalOrders.endDate,
      })
      .from(rentalOrders)
      .where(
        sql`LOWER(${rentalOrders.status}) = 'active' AND ${rentalOrders.generatorId} IS NULL`
      );

    if (unlinkedActiveOrders.length > 0) {
      for (const order of unlinkedActiveOrders) {
        if (!order.generatorName) continue;
        if (isRentalPeriodOver(order.endDate)) continue;
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
        startDate: rentalOrders.startDate,
        endDate: rentalOrders.endDate,
      })
      .from(rentalOrders)
      .where(
        sql`LOWER(${rentalOrders.status}) = 'active' AND ${rentalOrders.generatorId} IS NOT NULL`
      );

    const activeGenIdSet = new Set<number>();
    for (const order of activeOrders) {
      if (
        order.generatorId &&
        !isRentalPeriodOver(order.endDate) &&
        isRentalPeriodStarted(order.startDate)
      ) {
        activeGenIdSet.add(order.generatorId);
      }
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
      completedExpiredOrders: expiredOrderIds.length,
    };
  } catch (err) {
    console.error("Failed to sync generator statuses with rental orders:", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function getLiveLocationsByGenerator(): Promise<Map<number, string>> {
  try {
    await syncGeneratorStatusesWithRentals();
    const activeOrders = await db
      .select({
        id: rentalOrders.id,
        generatorId: rentalOrders.generatorId,
        siteLocation: rentalOrders.siteLocation,
        startDate: rentalOrders.startDate,
        endDate: rentalOrders.endDate,
      })
      .from(rentalOrders)
      .where(
        sql`LOWER(${rentalOrders.status}) = 'active' AND ${rentalOrders.generatorId} IS NOT NULL`
      )
      .orderBy(desc(rentalOrders.id));

    const map = new Map<number, string>();
    for (const o of activeOrders) {
      if (
        o.generatorId &&
        !map.has(o.generatorId) &&
        o.siteLocation?.trim() &&
        !isRentalPeriodOver(o.endDate) &&
        isRentalPeriodStarted(o.startDate)
      ) {
        map.set(o.generatorId, o.siteLocation.trim());
      }
    }
    return map;
  } catch (err) {
    console.error("Failed to get live locations by generator:", err);
    return new Map();
  }
}

export function attachLiveLocationToGenerator<T extends { id: number; status?: string | null }>(
  gen: T,
  liveMap?: Map<number, string>
): T & { currentLocation: string | null } {
  const live = liveMap?.get(gen.id);
  const statusLower = (gen.status || "").toLowerCase().trim();
  let currentLocation: string | null = null;
  if (live) {
    currentLocation = live;
  } else if (statusLower === "on rent") {
    currentLocation = "On Rent (Site Unspecified)";
  } else if (statusLower === "sales" || statusLower === "sold") {
    currentLocation = null;
  } else if (statusLower.includes("maintenance")) {
    currentLocation = "Main Yard (Service)";
  } else {
    currentLocation = "Main Yard";
  }
  return {
    ...gen,
    currentLocation,
  };
}
