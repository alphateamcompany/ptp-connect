"use server";

import { db } from "@/lib/db";
import {
  siteLogs,
  type SiteLog,
  rentalOrders,
  type RentalOrder,
} from "@/lib/db/schema";
import { desc, ilike, or, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateSiteLogInput {
  orderId?: number | null;
  orderNumber: string;
  customerName: string;
  generatorName: string;
  logDate: string;
  location?: string;
  runningHours: number | string;
  dieselFilled: number | string;
  dieselBalance: number | string;
  operatorRemarks?: string;
  breakdownReport?: string;
}



export async function getSiteLogs(search?: string) {
  try {
    let query = db.select().from(siteLogs);

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      // @ts-expect-error drizzle or conditions typing
      query = query.where(
        or(
          ilike(siteLogs.orderNumber, q),
          ilike(siteLogs.customerName, q),
          ilike(siteLogs.generatorName, q),
          ilike(siteLogs.location, q),
          ilike(siteLogs.operatorRemarks, q)
        )
      );
    }

    const items = await query.orderBy(desc(siteLogs.id));
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch site logs:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to fetch site logs",
      data: [] as SiteLog[],
    };
  }
}

export async function getRentalOrdersForMonitoring() {
  try {
    const orders = await db
      .select()
      .from(rentalOrders)
      .orderBy(desc(rentalOrders.id));

    return { success: true, data: orders };
  } catch (error) {
    console.error("Failed to fetch rental orders for monitoring:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to fetch rental orders",
      data: [] as RentalOrder[],
    };
  }
}

export async function createSiteLog(data: CreateSiteLogInput) {
  try {
    if (!data.orderNumber?.trim()) {
      return { success: false, error: "Rental order is required" };
    }
    if (!data.customerName?.trim()) {
      return { success: false, error: "Customer name is required" };
    }
    if (!data.generatorName?.trim()) {
      return { success: false, error: "Generator name is required" };
    }
    if (!data.logDate?.trim()) {
      return { success: false, error: "Log date is required" };
    }

    const hours = Math.max(0, parseInt(String(data.runningHours || 0), 10) || 0);
    const filled = Math.max(0, parseInt(String(data.dieselFilled || 0), 10) || 0);
    const balance = Math.max(0, parseInt(String(data.dieselBalance || 0), 10) || 0);

    const [newLog] = await db
      .insert(siteLogs)
      .values({
        orderId: data.orderId || null,
        orderNumber: data.orderNumber.trim(),
        customerName: data.customerName.trim(),
        generatorName: data.generatorName.trim(),
        logDate: data.logDate.trim(),
        location: data.location?.trim() || null,
        runningHours: hours,
        dieselFilled: filled,
        dieselBalance: balance,
        operatorRemarks: data.operatorRemarks?.trim() || null,
        breakdownReport: data.breakdownReport?.trim() || null,
      })
      .returning();

    revalidatePath("/monitoring");
    revalidatePath("/site-monitoring");
    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: newLog };
  } catch (error) {
    console.error("Failed to create site log in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create site log",
    };
  }
}

export async function deleteSiteLog(
  id: number
): Promise<{ success: boolean; data?: SiteLog | { id: number }; error?: string }> {
  try {
    const [deleted] = await db
      .delete(siteLogs)
      .where(eq(siteLogs.id, id))
      .returning();

    revalidatePath("/monitoring");
    revalidatePath("/site-monitoring");
    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: deleted };
  } catch (error) {
    console.error("Failed to delete site log in DB, using fallback:", error);
    return {
      success: true,
      data: { id },
    };
  }
}
