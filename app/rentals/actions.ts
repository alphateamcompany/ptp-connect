"use server";

import { db } from "@/lib/db";
import {
  rentalOrders,
  type RentalOrder,
  generators,
  customers,
  type Customer,
  type Generator,
} from "@/lib/db/schema";
import { desc, asc, ilike, or, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateRentalOrderInput {
  customerId?: number | null;
  customerName: string;
  generatorId?: number | null;
  generatorName: string;
  startDate: string;
  endDate: string;
  rentalType: string;
  dailyRate: number | string;
  transportCharges?: number | string;
  securityDeposit?: number | string;
  dieselIncluded?: boolean;
  operatorIncluded?: boolean;
  status?: string;
}

export interface RentalTotals {
  diffDays: number;
  rentalCharge: number;
  gstAmount: number;
  totalAmount: number;
  dailyRate: number;
  transportCharges: number;
}

function calculateRentalTotals(
  startDateStr: string,
  endDateStr: string,
  dailyRateInput: number | string,
  transportChargesInput: number | string = 0,
  rentalType: string = "Monthly"
): RentalTotals {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const rate = Number(dailyRateInput) || 0;
  const transportCharges = Number(transportChargesInput) || 0;

  let rentalCharge = 0;
  const normalizedType = (rentalType || "Monthly").trim().toLowerCase();
  if (normalizedType === "monthly") {
    rentalCharge = Math.round((diffDays / 30) * rate);
  } else if (normalizedType === "weekly") {
    rentalCharge = Math.round((diffDays / 7) * rate);
  } else {
    rentalCharge = Math.round(diffDays * rate);
  }

  const gstAmount = Math.round(rentalCharge * 0.18);
  const totalAmount = rentalCharge + gstAmount + transportCharges;

  return {
    diffDays,
    rentalCharge,
    gstAmount,
    totalAmount,
    dailyRate: rate,
    transportCharges,
  };
}

export async function getNextRentalOrderNumber(): Promise<string> {
  try {
    const list = await db
      .select({ orderNumber: rentalOrders.orderNumber })
      .from(rentalOrders);

    let maxNum = 0;
    for (const item of list) {
      const match = item.orderNumber.match(/RO-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `RO-${String(maxNum + 1).padStart(4, "0")}`;
  } catch {
    return "RO-0001";
  }
}

export async function getRentalOrders(search?: string) {
  try {
    let query = db.select().from(rentalOrders);

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      // @ts-expect-error drizzle or conditions typing
      query = query.where(
        or(
          ilike(rentalOrders.orderNumber, q),
          ilike(rentalOrders.customerName, q),
          ilike(rentalOrders.generatorName, q),
          ilike(rentalOrders.status, q),
          ilike(rentalOrders.rentalType, q)
        )
      );
    }

    const items = await query.orderBy(asc(rentalOrders.id));
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch rental orders:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to fetch rental orders",
      data: [] as RentalOrder[],
    };
  }
}

export async function createRentalOrder(data: CreateRentalOrderInput) {
  try {
    if (!data.customerName?.trim()) {
      return { success: false, error: "Customer is required" };
    }
    if (!data.generatorName?.trim()) {
      return { success: false, error: "Generator is required" };
    }
    if (!data.startDate?.trim()) {
      return { success: false, error: "Start date is required" };
    }
    if (!data.endDate?.trim()) {
      return { success: false, error: "End date is required" };
    }

    const orderNumber = await getNextRentalOrderNumber();
    const totals = calculateRentalTotals(
      data.startDate,
      data.endDate,
      data.dailyRate,
      data.transportCharges,
      data.rentalType || "Monthly"
    );

    const status = data.status || "Active";

    const [newOrder] = await db
      .insert(rentalOrders)
      .values({
        orderNumber,
        customerId: data.customerId || null,
        customerName: data.customerName.trim(),
        generatorId: data.generatorId || null,
        generatorName: data.generatorName.trim(),
        startDate: data.startDate.trim(),
        endDate: data.endDate.trim(),
        rentalType: data.rentalType?.trim() || "Monthly",
        dailyRate: String(totals.dailyRate),
        transportCharges: String(totals.transportCharges),
        securityDeposit: data.securityDeposit !== undefined ? String(data.securityDeposit) : "0",
        dieselIncluded: Boolean(data.dieselIncluded),
        operatorIncluded: Boolean(data.operatorIncluded),
        rentalCharge: String(totals.rentalCharge),
        gstAmount: String(totals.gstAmount),
        totalAmount: String(totals.totalAmount),
        status,
      })
      .returning();

    // If order is active and linked to a generator, update generator status to "On Rent"
    if (status === "Active" && data.generatorId) {
      try {
        await db
          .update(generators)
          .set({ status: "On Rent", updatedAt: new Date() })
          .where(eq(generators.id, data.generatorId));
      } catch (genErr) {
        console.error("Failed to update generator status to On Rent:", genErr);
      }
    }

    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: newOrder };
  } catch (error) {
    console.error("Failed to create rental order:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create rental order",
    };
  }
}

export async function updateRentalOrder(
  id: number,
  data: Partial<CreateRentalOrderInput>
) {
  try {
    const [currentOrder] = await db
      .select()
      .from(rentalOrders)
      .where(eq(rentalOrders.id, id));

    if (!currentOrder) {
      return { success: false, error: "Rental order not found" };
    }

    const startDate = data.startDate?.trim() || currentOrder.startDate;
    const endDate = data.endDate?.trim() || currentOrder.endDate;
    const dailyRate = data.dailyRate !== undefined ? data.dailyRate : currentOrder.dailyRate;
    const transportCharges =
      data.transportCharges !== undefined
        ? data.transportCharges
        : currentOrder.transportCharges || "0";
    const rentalType = data.rentalType?.trim() || currentOrder.rentalType || "Monthly";

    const totals = calculateRentalTotals(
      startDate,
      endDate,
      dailyRate,
      transportCharges,
      rentalType
    );

    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.customerId !== undefined) updateValues.customerId = data.customerId;
    if (data.customerName !== undefined) updateValues.customerName = data.customerName.trim();
    if (data.generatorId !== undefined) updateValues.generatorId = data.generatorId;
    if (data.generatorName !== undefined) updateValues.generatorName = data.generatorName.trim();
    if (data.startDate !== undefined) updateValues.startDate = data.startDate.trim();
    if (data.endDate !== undefined) updateValues.endDate = data.endDate.trim();
    if (data.rentalType !== undefined) updateValues.rentalType = data.rentalType.trim();
    if (data.dailyRate !== undefined) updateValues.dailyRate = String(totals.dailyRate);
    if (data.transportCharges !== undefined) updateValues.transportCharges = String(totals.transportCharges);
    if (data.securityDeposit !== undefined) updateValues.securityDeposit = String(data.securityDeposit);
    if (data.dieselIncluded !== undefined) updateValues.dieselIncluded = Boolean(data.dieselIncluded);
    if (data.operatorIncluded !== undefined) updateValues.operatorIncluded = Boolean(data.operatorIncluded);
    if (data.status !== undefined) updateValues.status = data.status.trim();

    updateValues.rentalCharge = String(totals.rentalCharge);
    updateValues.gstAmount = String(totals.gstAmount);
    updateValues.totalAmount = String(totals.totalAmount);

    const [updatedOrder] = await db
      .update(rentalOrders)
      .set(updateValues)
      .where(eq(rentalOrders.id, id))
      .returning();

    // Handle generator status updates
    const finalStatus = (data.status || currentOrder.status || "Active").toLowerCase();
    const oldGenId = currentOrder.generatorId;
    const newGenId = data.generatorId !== undefined ? data.generatorId : oldGenId;

    if (oldGenId && oldGenId !== newGenId) {
      if (currentOrder.status?.toLowerCase() === "active") {
        try {
          await db
            .update(generators)
            .set({ status: "Available", updatedAt: new Date() })
            .where(eq(generators.id, oldGenId));
        } catch (e) {
          console.error("Failed to release old generator status:", e);
        }
      }
    }

    if (newGenId) {
      if (finalStatus === "active") {
        try {
          await db
            .update(generators)
            .set({ status: "On Rent", updatedAt: new Date() })
            .where(eq(generators.id, newGenId));
        } catch (e) {
          console.error("Failed to update new generator status to On Rent:", e);
        }
      } else if (finalStatus === "completed") {
        try {
          await db
            .update(generators)
            .set({ status: "Available", updatedAt: new Date() })
            .where(eq(generators.id, newGenId));
        } catch (e) {
          console.error("Failed to mark generator Available on complete:", e);
        }
      }
    }

    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: updatedOrder };
  } catch (error) {
    console.error("Failed to update rental order:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to update rental order",
    };
  }
}

export async function markRentalOrderCompleted(id: number) {
  try {
    const [order] = await db
      .update(rentalOrders)
      .set({
        status: "Completed",
        updatedAt: new Date(),
      })
      .where(eq(rentalOrders.id, id))
      .returning();

    // If order had a linked generator, set generator back to "Available" if it was "On Rent"
    if (order?.generatorId) {
      try {
        const [gen] = await db
          .select({ status: generators.status })
          .from(generators)
          .where(eq(generators.id, order.generatorId));

        if (gen && gen.status === "On Rent") {
          await db
            .update(generators)
            .set({ status: "Available", updatedAt: new Date() })
            .where(eq(generators.id, order.generatorId));
        }
      } catch (genErr) {
        console.error("Failed to release generator status:", genErr);
      }
    }

    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: order };
  } catch (error) {
    console.error("Failed to mark rental order as completed:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to update rental order",
    };
  }
}

export async function deleteRentalOrder(id: number) {
  try {
    const [deletedOrder] = await db
      .delete(rentalOrders)
      .where(eq(rentalOrders.id, id))
      .returning();

    // If order was active and linked to a generator, reset generator to Available
    if (deletedOrder?.generatorId && deletedOrder.status?.toLowerCase() === "active") {
      try {
        const [gen] = await db
          .select({ status: generators.status })
          .from(generators)
          .where(eq(generators.id, deletedOrder.generatorId));

        if (gen && gen.status === "On Rent") {
          await db
            .update(generators)
            .set({ status: "Available", updatedAt: new Date() })
            .where(eq(generators.id, deletedOrder.generatorId));
        }
      } catch (genErr) {
        console.error("Failed to release generator status on rental deletion:", genErr);
      }
    }

    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: deletedOrder };
  } catch (error) {
    console.error("Failed to delete rental order:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to delete rental order",
    };
  }
}

export async function getFormDataOptions() {
  try {
    const [customerList, generatorList] = await Promise.all([
      db.select().from(customers).orderBy(customers.companyName),
      db.select().from(generators).orderBy(generators.name),
    ]);

    return {
      customers: customerList,
      generators: generatorList,
    };
  } catch (err) {
    console.error("Failed to load customer and generator options:", err);
    return {
      customers: [] as Customer[],
      generators: [] as Generator[],
    };
  }
}
