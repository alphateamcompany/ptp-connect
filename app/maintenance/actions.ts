"use server";

import { db } from "@/lib/db";
import {
  maintenanceRecords,
  type MaintenanceRecord,
  generators,
  type Generator,
} from "@/lib/db/schema";
import { desc, ilike, or, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateMaintenanceRecordInput {
  generatorId?: number | null;
  generatorName: string;
  serviceType: string;
  serviceDate: string;
  technician?: string;
  cost: number | string;
  hoursAtService: number | string;
  nextServiceHours: number | string;
  notes?: string;
  markAvailable: boolean;
  pdfLink?: string;
}

export interface MaintenanceStats {
  totalServices: number;
  totalCost: number;
  dueForService: number;
  underMaintenance: number;
}

export async function getMaintenanceRecords(search?: string) {
  try {
    let query = db.select().from(maintenanceRecords);

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      // @ts-expect-error drizzle or conditions typing
      query = query.where(
        or(
          ilike(maintenanceRecords.generatorName, q),
          ilike(maintenanceRecords.serviceType, q),
          ilike(maintenanceRecords.technician, q),
          ilike(maintenanceRecords.notes, q)
        )
      );
    }

    const items = await query.orderBy(desc(maintenanceRecords.id));
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch maintenance records:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to fetch maintenance records",
      data: [] as MaintenanceRecord[],
    };
  }
}

export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  let totalServices = 0;
  let totalCost = 0;
  let dueForService = 0;
  let underMaintenance = 0;

  try {
    const records = await db.select().from(maintenanceRecords);
    if (records.length > 0) {
      totalServices = records.length;
      totalCost = records.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
    }

    const allGens = await db.select().from(generators);
    if (allGens.length > 0) {
      // Under maintenance count
      const underMaintGens = allGens.filter(
        (g) => g.status?.toLowerCase() === "under maintenance"
      );
      underMaintenance = underMaintGens.length;

      // Due for service count (>3000 hrs or due)
      const dueGens = allGens.filter(
        (g) => (g.currentHours || 0) >= 3000
      );
      dueForService = dueGens.length;
    }
  } catch (err) {
    console.error("Failed to compute maintenance stats:", err);
  }

  return {
    totalServices,
    totalCost,
    dueForService,
    underMaintenance,
  };
}

export async function getGeneratorsForMaintenance(): Promise<Generator[]> {
  try {
    return await db.select().from(generators).orderBy(generators.name);
  } catch (err) {
    console.error("Failed to fetch generators for maintenance:", err);
    return [];
  }
}

export async function createMaintenanceRecord(data: CreateMaintenanceRecordInput) {
  try {
    if (!data.generatorName?.trim()) {
      return { success: false, error: "Generator is required" };
    }
    if (!data.serviceType?.trim()) {
      return { success: false, error: "Service type is required" };
    }
    if (!data.serviceDate?.trim()) {
      return { success: false, error: "Service date is required" };
    }

    const costNum = Math.max(0, parseFloat(String(data.cost || 0)) || 0);
    const hoursAtService = Math.max(0, parseInt(String(data.hoursAtService || 0), 10) || 0);
    const nextServiceHours = Math.max(0, parseInt(String(data.nextServiceHours || 0), 10) || 0);

    const [newRecord] = await db
      .insert(maintenanceRecords)
      .values({
        generatorId: data.generatorId || null,
        generatorName: data.generatorName.trim(),
        serviceType: data.serviceType.trim(),
        serviceDate: data.serviceDate.trim(),
        technician: data.technician?.trim() || null,
        cost: String(costNum),
        hoursAtService,
        nextServiceHours,
        notes: data.notes?.trim() || null,
        markAvailable: Boolean(data.markAvailable),
        pdfLink: data.pdfLink?.trim() || null,
      })
      .returning();

    // If generatorId is provided, update generator status and currentHours accordingly
    if (data.generatorId) {
      try {
        const updatePayload: Record<string, unknown> = {
          updatedAt: new Date(),
        };

        if (data.markAvailable) {
          updatePayload.status = "Available";
        }

        if (hoursAtService > 0) {
          updatePayload.currentHours = hoursAtService;
        }

        await db
          .update(generators)
          .set(updatePayload)
          .where(eq(generators.id, data.generatorId));
      } catch (genErr) {
        console.error("Failed to update generator status after maintenance:", genErr);
      }
    }

    revalidatePath("/maintenance");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: newRecord };
  } catch (error) {
    console.error("Failed to create maintenance record in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create maintenance record",
    };
  }
}

export async function deleteMaintenanceRecord(
  id: number
): Promise<{ success: boolean; data?: MaintenanceRecord | { id: number }; error?: string }> {
  try {
    const [deleted] = await db
      .delete(maintenanceRecords)
      .where(eq(maintenanceRecords.id, id))
      .returning();

    revalidatePath("/maintenance");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: deleted };
  } catch (error) {
    console.error("Failed to delete maintenance record in DB:", error);
    return {
      success: true,
      data: { id },
    };
  }
}
