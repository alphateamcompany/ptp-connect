"use server";

import { db } from "@/lib/db";
import {
  dispatches,
  type Dispatch,
  rentalOrders,
  type RentalOrder,
} from "@/lib/db/schema";
import { desc, ilike, or, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateDispatchInput {
  orderId?: number | null;
  orderNumber: string;
  customerName: string;
  generatorName: string;
  dispatchDate: string;
  dispatchTime?: string;
  driverName: string;
  vehicleNumber: string;
  hoursBeforeDispatch?: number | string;
  fuelFilled?: number | string;
  notes?: string;
}

export async function getDispatches(search?: string) {
  try {
    let query = db.select().from(dispatches);

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      // @ts-expect-error drizzle or conditions typing
      query = query.where(
        or(
          ilike(dispatches.orderNumber, q),
          ilike(dispatches.customerName, q),
          ilike(dispatches.generatorName, q),
          ilike(dispatches.driverName, q),
          ilike(dispatches.vehicleNumber, q)
        )
      );
    }

    const items = await query.orderBy(desc(dispatches.id));
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch dispatches:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to fetch dispatches",
      data: [] as Dispatch[],
    };
  }
}

export async function getRentalOrdersForDispatch() {
  try {
    const orders = await db
      .select()
      .from(rentalOrders)
      .orderBy(desc(rentalOrders.id));

    return { success: true, data: orders };
  } catch (error) {
    console.error("Failed to fetch rental orders for dispatch:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to fetch rental orders",
      data: [] as RentalOrder[],
    };
  }
}

export async function createDispatch(data: CreateDispatchInput) {
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
    if (!data.dispatchDate?.trim()) {
      return { success: false, error: "Dispatch date is required" };
    }
    if (!data.driverName?.trim()) {
      return { success: false, error: "Driver name is required" };
    }
    if (!data.vehicleNumber?.trim()) {
      return { success: false, error: "Vehicle number is required" };
    }

    const hours = Math.max(0, parseInt(String(data.hoursBeforeDispatch || 0), 10) || 0);
    const fuel = Math.max(0, parseInt(String(data.fuelFilled || 0), 10) || 0);

    const [newDispatch] = await db
      .insert(dispatches)
      .values({
        orderId: data.orderId || null,
        orderNumber: data.orderNumber.trim(),
        customerName: data.customerName.trim(),
        generatorName: data.generatorName.trim(),
        dispatchDate: data.dispatchDate.trim(),
        dispatchTime: data.dispatchTime?.trim() || null,
        driverName: data.driverName.trim(),
        vehicleNumber: data.vehicleNumber.trim(),
        hoursBeforeDispatch: hours,
        fuelFilled: fuel,
        notes: data.notes?.trim() || null,
      })
      .returning();

    revalidatePath("/dispatch");
    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: newDispatch };
  } catch (error) {
    console.error("Failed to create dispatch in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create dispatch in database",
    };
  }
}

export async function deleteDispatch(
  id: number
): Promise<{ success: boolean; data?: Dispatch | { id: number }; error?: string }> {
  try {
    const [deleted] = await db
      .delete(dispatches)
      .where(eq(dispatches.id, id))
      .returning();

    revalidatePath("/dispatch");
    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: deleted };
  } catch (error) {
    console.error("Failed to delete dispatch:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to delete dispatch",
    };
  }
}
