"use server";

import { db } from "@/lib/db";
import { generators } from "@/lib/db/schema";
import { desc, ilike, or, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateGeneratorInput {
  generatorId: string;
  name: string;
  brand?: string;
  model: string;
  capacityKva: number | string;
  engineNumber?: string;
  alternatorNumber?: string;
  controllerType?: string;
  serialNumber?: string;
  fuelTankLiters?: number;
  purchaseDate?: string;
  purchaseCost?: number | string;
  currentHours?: number;
  location?: string;
  status: string;
}

export async function getGenerators(search?: string, status?: string) {
  try {
    const conditions = [];

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(generators.generatorId, q),
          ilike(generators.name, q),
          ilike(generators.brand, q),
          ilike(generators.model, q),
          ilike(generators.location, q)
        )
      );
    }

    if (status && status !== "All Status" && status !== "all") {
      conditions.push(eq(generators.status, status));
    }

    let query = db.select().from(generators);
    if (conditions.length === 1) {
      // @ts-expect-error drizzle where condition typing
      query = query.where(conditions[0]);
    } else if (conditions.length > 1) {
      // @ts-expect-error drizzle where condition typing
      query = query.where(and(...conditions));
    }

    const items = await query.orderBy(desc(generators.createdAt), desc(generators.id));
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch generators:", error);
    return { success: false, error: (error as Error).message, data: [] };
  }
}

export async function createGenerator(data: CreateGeneratorInput) {
  try {
    if (!data.generatorId?.trim()) {
      return { success: false, error: "Generator ID is required" };
    }
    if (!data.name?.trim()) {
      return { success: false, error: "Generator Name is required" };
    }
    if (!data.model?.trim()) {
      return { success: false, error: "Model is required" };
    }
    if (data.capacityKva === undefined || isNaN(Number(data.capacityKva))) {
      return { success: false, error: "Valid capacity (kVA) is required" };
    }

    const newGen = await db
      .insert(generators)
      .values({
        generatorId: data.generatorId.trim(),
        name: data.name.trim(),
        brand: data.brand?.trim() || null,
        model: data.model.trim(),
        capacityKva: String(data.capacityKva),
        engineNumber: data.engineNumber?.trim() || null,
        alternatorNumber: data.alternatorNumber?.trim() || null,
        controllerType: data.controllerType?.trim() || null,
        serialNumber: data.serialNumber?.trim() || null,
        fuelTankLiters: data.fuelTankLiters ? Number(data.fuelTankLiters) : null,
        purchaseDate: data.purchaseDate?.trim() || null,
        purchaseCost: data.purchaseCost ? String(data.purchaseCost) : null,
        currentHours: data.currentHours ? Number(data.currentHours) : 0,
        location: data.location?.trim() || null,
        status: data.status?.trim() || "Available",
      })
      .returning();

    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: newGen[0] };
  } catch (error) {
    console.error("Failed to create generator:", error);
    const msg = (error as Error).message;
    if (msg.includes("unique constraint") || msg.includes("generator_id")) {
      return {
        success: false,
        error: `Generator ID "${data.generatorId}" is already in use. Please use a unique ID.`,
      };
    }
    return { success: false, error: msg };
  }
}

export async function deleteGenerator(id: number) {
  try {
    await db.delete(generators).where(eq(generators.id, id));
    revalidatePath("/generators");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete generator:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateGenerator(
  id: number,
  data: Partial<CreateGeneratorInput>
) {
  try {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (data.generatorId !== undefined) updateValues.generatorId = data.generatorId.trim();
    if (data.name !== undefined) updateValues.name = data.name.trim();
    if (data.brand !== undefined) updateValues.brand = data.brand.trim() || null;
    if (data.model !== undefined) updateValues.model = data.model.trim();
    if (data.capacityKva !== undefined) updateValues.capacityKva = String(data.capacityKva);
    if (data.engineNumber !== undefined) updateValues.engineNumber = data.engineNumber.trim() || null;
    if (data.alternatorNumber !== undefined) updateValues.alternatorNumber = data.alternatorNumber.trim() || null;
    if (data.controllerType !== undefined) updateValues.controllerType = data.controllerType.trim() || null;
    if (data.serialNumber !== undefined) updateValues.serialNumber = data.serialNumber.trim() || null;
    if (data.fuelTankLiters !== undefined) {
      updateValues.fuelTankLiters = data.fuelTankLiters ? Number(data.fuelTankLiters) : null;
    }
    if (data.purchaseDate !== undefined) updateValues.purchaseDate = data.purchaseDate.trim() || null;
    if (data.purchaseCost !== undefined) {
      updateValues.purchaseCost = data.purchaseCost ? String(data.purchaseCost) : null;
    }
    if (data.currentHours !== undefined) updateValues.currentHours = Number(data.currentHours);
    if (data.location !== undefined) updateValues.location = data.location.trim() || null;
    if (data.status !== undefined) updateValues.status = data.status.trim() || "Available";

    const updated = await db
      .update(generators)
      .set(updateValues)
      .where(eq(generators.id, id))
      .returning();

    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: updated[0] };
  } catch (error) {
    console.error("Failed to update generator:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getNextSuggestedGeneratorId() {
  try {
    const list = await db
      .select({ generatorId: generators.generatorId })
      .from(generators);

    let maxNum = 0;
    for (const item of list) {
      const match = item.generatorId.match(/GEN-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = String(maxNum + 1).padStart(4, "0");
    return `GEN-${nextNum}`;
  } catch {
    return "GEN-0001";
  }
}
