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
}

export interface MaintenanceStats {
  totalServices: number;
  totalCost: number;
  dueForService: number;
  underMaintenance: number;
}

const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 1,
    generatorId: 2,
    generatorName: "Mahindra 250kVA #2",
    serviceType: "Oil Change",
    serviceDate: "15 Jun 2025",
    technician: "Ramesh",
    cost: "2500",
    hoursAtService: 2800,
    nextServiceHours: 3050,
    notes: "Regular oil and filter change completed. Generator tested under load.",
    markAvailable: true,
    createdAt: new Date("2025-06-15T10:00:00Z"),
    updatedAt: new Date("2025-06-15T10:00:00Z"),
  },
];

const FALLBACK_GENERATORS = [
  { id: 1, generatorId: "GEN-0801", name: "Cummins 125kVA #1", brand: "Cummins", model: "QSB5-G5", capacityKva: "125", currentHours: 1250, status: "Available", location: "Warehouse A" },
  { id: 2, generatorId: "GEN-0802", name: "Mahindra 250kVA #2", brand: "Mahindra", model: "mPower 250", capacityKva: "250", currentHours: 2850, status: "Available", location: "Warehouse B" },
  { id: 3, generatorId: "GEN-0803", name: "Ashok Leyland 320kVA #3", brand: "Ashok Leyland", model: "AL320", capacityKva: "320", currentHours: 3200, status: "Under Maintenance", location: "Service Bay 1" },
  { id: 4, generatorId: "GEN-0804", name: "Sudhir 500kVA #4", brand: "Sudhir", model: "PowerPro 500", capacityKva: "500", currentHours: 1800, status: "Under Maintenance", location: "Service Bay 2" },
];

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
    if (items.length > 0) {
      return { success: true, data: items };
    }
    return { success: true, data: INITIAL_MAINTENANCE_RECORDS };
  } catch (error) {
    console.error("Failed to fetch maintenance records, using initial fallback:", error);
    return {
      success: true,
      data: INITIAL_MAINTENANCE_RECORDS,
    };
  }
}

export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  let totalServices = 1;
  let totalCost = 2500;
  let dueForService = 1;
  let underMaintenance = 2;

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
    console.error("Failed to compute maintenance stats, using defaults:", err);
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
    const list = await db.select().from(generators).orderBy(generators.name);
    if (list.length > 0) {
      return list;
    }
    return FALLBACK_GENERATORS as unknown as Generator[];
  } catch (err) {
    console.error("Failed to fetch generators for maintenance, using fallback:", err);
    return FALLBACK_GENERATORS as unknown as Generator[];
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
    const fallbackRecord: MaintenanceRecord = {
      id: Date.now(),
      generatorId: data.generatorId || null,
      generatorName: data.generatorName.trim(),
      serviceType: data.serviceType.trim(),
      serviceDate: data.serviceDate.trim(),
      technician: data.technician?.trim() || null,
      cost: String(data.cost || "0"),
      hoursAtService: Math.max(0, parseInt(String(data.hoursAtService || 0), 10) || 0),
      nextServiceHours: Math.max(0, parseInt(String(data.nextServiceHours || 0), 10) || 0),
      notes: data.notes?.trim() || null,
      markAvailable: Boolean(data.markAvailable),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { success: true, data: fallbackRecord };
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
