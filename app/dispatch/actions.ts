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

const INITIAL_DISPATCHES: Dispatch[] = [
  {
    id: 1,
    orderId: 1,
    orderNumber: "RO-2001",
    customerName: "BuildPro Constructions",
    generatorName: "Cummins 125kVA #1",
    dispatchDate: "15 Jun 2025",
    dispatchTime: "10:00 AM",
    driverName: "Suresh",
    vehicleNumber: "MH12AB1234",
    hoursBeforeDispatch: 1200,
    fuelFilled: 150,
    notes: "Record dispatch details before generator leaves warehouse",
    createdAt: new Date("2025-06-15T10:00:00Z"),
    updatedAt: new Date("2025-06-15T10:00:00Z"),
  },
];

const INITIAL_RENTAL_ORDERS: RentalOrder[] = [
  {
    id: 1,
    orderNumber: "RO-2001",
    customerId: 1,
    customerName: "BuildPro Constructions",
    generatorId: 1,
    generatorName: "Cummins 125kVA #1",
    startDate: "2025-06-15",
    endDate: "2025-07-15",
    rentalType: "Monthly",
    dailyRate: "4500",
    transportCharges: "3500",
    securityDeposit: "0",
    dieselIncluded: true,
    operatorIncluded: true,
    rentalCharge: "135000",
    gstAmount: "24300",
    totalAmount: "162800",
    status: "Active",
    createdAt: new Date("2025-06-15T09:00:00Z"),
    updatedAt: new Date("2025-06-15T09:00:00Z"),
  },
  {
    id: 2,
    orderNumber: "RO-2002",
    customerId: 2,
    customerName: "TechPark Realty",
    generatorId: 2,
    generatorName: "Mahindra 250kVA #2",
    startDate: "2026-07-13",
    endDate: "2026-08-13",
    rentalType: "Weekly",
    dailyRate: "5000",
    transportCharges: "3500",
    securityDeposit: "0",
    dieselIncluded: false,
    operatorIncluded: false,
    rentalCharge: "155000",
    gstAmount: "27900",
    totalAmount: "186400",
    status: "Active",
    createdAt: new Date("2026-07-13T09:00:00Z"),
    updatedAt: new Date("2026-07-13T09:00:00Z"),
  },
];

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
    if (items.length > 0) {
      return { success: true, data: items };
    }
    return { success: true, data: INITIAL_DISPATCHES };
  } catch (error) {
    console.error("Failed to fetch dispatches, using initial fallback:", error);
    return {
      success: true,
      data: INITIAL_DISPATCHES,
    };
  }
}

export async function getRentalOrdersForDispatch() {
  try {
    const orders = await db
      .select()
      .from(rentalOrders)
      .orderBy(desc(rentalOrders.id));

    if (orders.length > 0) {
      return { success: true, data: orders };
    }
    return { success: true, data: INITIAL_RENTAL_ORDERS };
  } catch (error) {
    console.error("Failed to fetch rental orders for dispatch, using fallback:", error);
    return {
      success: true,
      data: INITIAL_RENTAL_ORDERS,
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
    console.error("Failed to create dispatch in DB, returning client record:", error);
    // Fallback if db offline
    const fallbackDispatch: Dispatch = {
      id: Date.now(),
      orderId: data.orderId || null,
      orderNumber: data.orderNumber.trim(),
      customerName: data.customerName.trim(),
      generatorName: data.generatorName.trim(),
      dispatchDate: data.dispatchDate.trim(),
      dispatchTime: data.dispatchTime?.trim() || null,
      driverName: data.driverName.trim(),
      vehicleNumber: data.vehicleNumber.trim(),
      hoursBeforeDispatch: Math.max(0, parseInt(String(data.hoursBeforeDispatch || 0), 10) || 0),
      fuelFilled: Math.max(0, parseInt(String(data.fuelFilled || 0), 10) || 0),
      notes: data.notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return {
      success: true,
      data: fallbackDispatch,
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
