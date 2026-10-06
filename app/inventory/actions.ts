"use server";

import { db } from "@/lib/db";
import { inventory, type InventoryItem, generators } from "@/lib/db/schema";
import { desc, asc, ilike, or, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateInventoryInput {
  partNumber: string;
  partName: string;
  model?: string | null;
  category: string;
  compatibleGenerator: string;
  qtyAvailable: number | string;
  reorderLevel: number | string;
  unitCost: number | string;
  location?: string;
  status?: string;
  notes?: string | null;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}


function computeStockStatus(qty: number, reorderLevel: number, manualStatus?: string): string {
  if (manualStatus && manualStatus !== "Auto") {
    return manualStatus;
  }
  if (qty <= 0) return "Out of Stock";
  if (qty <= reorderLevel) return "Low Stock";
  return "In Stock";
}

export async function getInventory(search?: string): Promise<InventoryItem[]> {
  try {
    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      return await db
        .select()
        .from(inventory)
        .where(
          or(
            ilike(inventory.partNumber, q),
            ilike(inventory.partName, q),
            ilike(inventory.model, q),
            ilike(inventory.category, q),
            ilike(inventory.compatibleGenerator, q),
            ilike(inventory.location, q),
            ilike(inventory.status, q)
          )
        )
        .orderBy(asc(inventory.id));
    }

    const rows = await db.select().from(inventory).orderBy(asc(inventory.id));
    return rows;
  } catch (error) {
    console.error("Failed to fetch inventory from database:", error);
    return [];
  }
}

export async function getInventoryStats(items?: InventoryItem[]): Promise<InventoryStats> {
  const currentItems = items || (await getInventory());
  const totalItems = currentItems.length;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const item of currentItems) {
    const qty = Number(item.qtyAvailable) || 0;
    const cost = parseFloat(item.unitCost) || 0;
    totalValue += qty * cost;

    const reorder = Number(item.reorderLevel) || 0;
    if (qty <= 0 || item.status === "Out of Stock") {
      outOfStockCount++;
    } else if (qty <= reorder || item.status === "Low Stock") {
      lowStockCount++;
    }
  }

  return {
    totalItems,
    totalValue,
    lowStockCount,
    outOfStockCount,
  };
}

export async function getGeneratorOptions(): Promise<string[]> {
  try {
    const rows = await db
      .select({
        name: generators.name,
        brand: generators.brand,
        capacityKva: generators.capacityKva,
      })
      .from(generators)
      .orderBy(asc(generators.id));

    const options = new Set<string>();

    for (const row of rows) {
      if (row.name) options.add(row.name);
      if (row.brand && row.capacityKva) {
        options.add(`${row.brand} ${Math.round(Number(row.capacityKva))} kVA`);
      }
    }

    return Array.from(options);
  } catch (error) {
    console.error("Failed to fetch generator options:", error);
    return [];
  }
}

export async function getNextPartNumber(categoryPrefix = "FLT"): Promise<string> {
  try {
    const prefix = `PPD-${categoryPrefix}-`;
    const rows = await db
      .select({ partNumber: inventory.partNumber })
      .from(inventory)
      .where(ilike(inventory.partNumber, `${prefix}%`))
      .orderBy(desc(inventory.id));

    let maxNum = 0;
    for (const r of rows) {
      const match = r.partNumber.match(/PPD-[A-Z]+-(\d+)/i);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }

    const nextSeq = String(maxNum + 1).padStart(3, "0");
    return `${prefix}${nextSeq}`;
  } catch {
    return `PPD-${categoryPrefix}-001`;
  }
}

export async function createInventoryItem(
  data: CreateInventoryInput
): Promise<{ success: boolean; data?: InventoryItem; error?: string }> {
  try {
    const partNumber = data.partNumber.trim().toUpperCase();
    const partName = data.partName.trim();
    const model = data.model?.trim() || null;
    const category = data.category.trim() || "General";
    const compatibleGenerator = data.compatibleGenerator.trim();
    const location = data.location?.trim() || "Chennai Main Warehouse";

    if (!partNumber || !partName || !compatibleGenerator) {
      return {
        success: false,
        error: "Part Number, Part Name, and Compatible Generator are required.",
      };
    }

    // Check unique partNumber
    const existing = await db
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.partNumber, partNumber))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: `Part Number "${partNumber}" already exists. Please use a unique part number.`,
      };
    }

    const qtyAvailable = Math.max(0, parseInt(String(data.qtyAvailable || 0), 10) || 0);
    const reorderLevel = Math.max(0, parseInt(String(data.reorderLevel || 10), 10) || 0);
    const unitCostNum = Math.max(0, parseFloat(String(data.unitCost || 0)) || 0);
    const unitCost = unitCostNum.toFixed(2);

    const calculatedStatus = computeStockStatus(qtyAvailable, reorderLevel, data.status);

    const [newItem] = await db
      .insert(inventory)
      .values({
        partNumber,
        partName,
        model,
        category,
        compatibleGenerator,
        qtyAvailable,
        reorderLevel,
        unitCost,
        location,
        status: calculatedStatus,
        notes: data.notes?.trim() || null,
      })
      .returning();

    revalidatePath("/inventory");
    revalidatePath("/");

    return { success: true, data: newItem };
  } catch (error) {
    console.error("Failed to create inventory item in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create inventory item",
    };
  }
}

export async function updateInventoryItem(
  id: number,
  data: Partial<CreateInventoryInput>
): Promise<{ success: boolean; data?: InventoryItem; error?: string }> {
  try {
    const updateValues: Partial<InventoryItem> = {
      updatedAt: new Date(),
    };

    if (data.partNumber !== undefined) {
      updateValues.partNumber = data.partNumber.trim().toUpperCase();
    }
    if (data.partName !== undefined) {
      updateValues.partName = data.partName.trim();
    }
    if (data.model !== undefined) {
      updateValues.model = data.model?.trim() || null;
    }
    if (data.category !== undefined) {
      updateValues.category = data.category.trim();
    }
    if (data.compatibleGenerator !== undefined) {
      updateValues.compatibleGenerator = data.compatibleGenerator.trim();
    }
    if (data.location !== undefined) {
      updateValues.location = data.location.trim();
    }
    if (data.notes !== undefined) {
      updateValues.notes = data.notes?.trim() || null;
    }

    let qty = 0;
    let reorder = 0;
    if (data.qtyAvailable !== undefined) {
      qty = Math.max(0, parseInt(String(data.qtyAvailable), 10) || 0);
      updateValues.qtyAvailable = qty;
    }
    if (data.reorderLevel !== undefined) {
      reorder = Math.max(0, parseInt(String(data.reorderLevel), 10) || 0);
      updateValues.reorderLevel = reorder;
    }
    if (data.unitCost !== undefined) {
      const num = Math.max(0, parseFloat(String(data.unitCost)) || 0);
      updateValues.unitCost = num.toFixed(2);
    }

    if (data.status !== undefined) {
      updateValues.status = computeStockStatus(qty, reorder, data.status);
    } else if (data.qtyAvailable !== undefined || data.reorderLevel !== undefined) {
      updateValues.status = computeStockStatus(qty, reorder);
    }

    const [updated] = await db
      .update(inventory)
      .set(updateValues)
      .where(eq(inventory.id, id))
      .returning();

    revalidatePath("/inventory");
    revalidatePath("/");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update inventory item in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to update inventory item",
    };
  }
}

export async function deleteInventoryItem(
  id: number
): Promise<{ success: boolean; data?: { id: number }; error?: string }> {
  try {
    await db.delete(inventory).where(eq(inventory.id, id));
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete inventory item:", error);
    return { success: true, data: { id } };
  }
}
