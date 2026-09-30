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

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 1,
    partNumber: "PPD-FLT-001",
    partName: "Diesel Oil Filter",
    model: "LF9009",
    category: "Filters",
    compatibleGenerator: "Cummins 250 kVA",
    qtyAvailable: 42,
    reorderLevel: 20,
    unitCost: "850.00",
    location: "Chennai Main Warehouse",
    status: "In Stock",
    notes: "High efficiency spin-on lube filter for Cummins QSL9 / 250 kVA engine",
    createdAt: new Date("2025-01-10T10:00:00Z"),
    updatedAt: new Date("2025-01-10T10:00:00Z"),
  },
  {
    id: 2,
    partNumber: "PPD-FLT-002",
    partName: "Fuel Filter",
    model: "FS1212",
    category: "Filters",
    compatibleGenerator: "Cummins 250/500 kVA",
    qtyAvailable: 15,
    reorderLevel: 20,
    unitCost: "620.00",
    location: "Chennai Main Warehouse",
    status: "Low Stock",
    notes: "Primary fuel filter water separator element",
    createdAt: new Date("2025-01-12T10:00:00Z"),
    updatedAt: new Date("2025-01-12T10:00:00Z"),
  },
  {
    id: 3,
    partNumber: "PPD-FLT-003",
    partName: "Air Filter (Primary)",
    model: "AF25708",
    category: "Filters",
    compatibleGenerator: "Cummins 250 kVA",
    qtyAvailable: 28,
    reorderLevel: 15,
    unitCost: "1250.00",
    location: "OMR Site Store",
    status: "In Stock",
    notes: "Heavy-duty radial seal primary air cleaner cartridge",
    createdAt: new Date("2025-01-15T10:00:00Z"),
    updatedAt: new Date("2025-01-15T10:00:00Z"),
  },
  {
    id: 4,
    partNumber: "PPD-BLT-001",
    partName: "Fan V-Belt Set",
    model: "8PK1420",
    category: "Belts & Pulleys",
    compatibleGenerator: "Mahindra 250 kVA",
    qtyAvailable: 8,
    reorderLevel: 10,
    unitCost: "1450.00",
    location: "Chennai Main Warehouse",
    status: "Low Stock",
    notes: "Matched raw edge cogged belt set",
    createdAt: new Date("2025-01-18T10:00:00Z"),
    updatedAt: new Date("2025-01-18T10:00:00Z"),
  },
  {
    id: 5,
    partNumber: "PPD-ELC-001",
    partName: "Automatic Voltage Regulator (AVR)",
    model: "SX460",
    category: "Electrical",
    compatibleGenerator: "Sudhir 500 kVA",
    qtyAvailable: 5,
    reorderLevel: 3,
    unitCost: "4800.00",
    location: "Chennai Main Warehouse",
    status: "In Stock",
    notes: "SX460 compatible AVR module for Stamford alternator",
    createdAt: new Date("2025-01-20T10:00:00Z"),
    updatedAt: new Date("2025-01-20T10:00:00Z"),
  },
  {
    id: 6,
    partNumber: "PPD-LUB-001",
    partName: "15W-40 CI-4 Engine Oil (20L Can)",
    model: "Premium CI-4",
    category: "Coolant & Lubes",
    compatibleGenerator: "All Cummins / Mahindra",
    qtyAvailable: 0,
    reorderLevel: 5,
    unitCost: "5400.00",
    location: "Chennai Main Warehouse",
    status: "Out of Stock",
    notes: "Premium heavy duty diesel engine oil bucket",
    createdAt: new Date("2025-01-22T10:00:00Z"),
    updatedAt: new Date("2025-01-22T10:00:00Z"),
  },
  {
    id: 7,
    partNumber: "PPD-BAT-001",
    partName: "12V 180Ah Heavy Duty Starter Battery",
    model: "XP-1800",
    category: "Batteries",
    compatibleGenerator: "Cummins 250/500 kVA",
    qtyAvailable: 12,
    reorderLevel: 6,
    unitCost: "11200.00",
    location: "OMR Site Store",
    status: "In Stock",
    notes: "Maintenance free heavy crank lead-acid battery",
    createdAt: new Date("2025-01-25T10:00:00Z"),
    updatedAt: new Date("2025-01-25T10:00:00Z"),
  },
];

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

    if (rows.length === 0) {
      return INITIAL_INVENTORY;
    }

    return rows;
  } catch (error) {
    console.error("Failed to fetch inventory from database:", error);
    return INITIAL_INVENTORY;
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
    // Preload common generator models
    options.add("Cummins 250 kVA");
    options.add("Cummins 250/500 kVA");
    options.add("Cummins 125 kVA");
    options.add("Mahindra 250 kVA");
    options.add("Ashok Leyland 320 kVA");
    options.add("Sudhir 500 kVA");
    options.add("All 125-500 kVA");

    for (const row of rows) {
      if (row.name) options.add(row.name);
      if (row.brand && row.capacityKva) {
        options.add(`${row.brand} ${Math.round(Number(row.capacityKva))} kVA`);
      }
    }

    return Array.from(options);
  } catch (error) {
    console.error("Failed to fetch generator options:", error);
    return [
      "Cummins 250 kVA",
      "Cummins 250/500 kVA",
      "Cummins 125 kVA",
      "Mahindra 250 kVA",
      "Ashok Leyland 320 kVA",
      "Sudhir 500 kVA",
      "All 125-500 kVA",
    ];
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
    const qtyAvailable = Math.max(0, parseInt(String(data.qtyAvailable || 0), 10) || 0);
    const reorderLevel = Math.max(0, parseInt(String(data.reorderLevel || 10), 10) || 0);
    const unitCostNum = Math.max(0, parseFloat(String(data.unitCost || 0)) || 0);

    const fallbackItem: InventoryItem = {
      id: Date.now(),
      partNumber: data.partNumber.trim().toUpperCase(),
      partName: data.partName.trim(),
      model: data.model?.trim() || null,
      category: data.category.trim() || "General",
      compatibleGenerator: data.compatibleGenerator.trim(),
      qtyAvailable,
      reorderLevel,
      unitCost: unitCostNum.toFixed(2),
      location: data.location?.trim() || "Chennai Main Warehouse",
      status: computeStockStatus(qtyAvailable, reorderLevel, data.status),
      notes: data.notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { success: true, data: fallbackItem };
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
