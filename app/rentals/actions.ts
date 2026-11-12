"use server";

import { db } from "@/lib/db";
import {
  rentalOrders,
  type RentalOrder,
  generators,
  customers,
  dispatches,
  siteLogs,
  returns,
  invoices,
  type Customer,
  type Generator,
} from "@/lib/db/schema";
import { desc, asc, ilike, or, eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { syncGeneratorStatusesWithRentals } from "@/lib/sync-generators";

export interface CreateRentalOrderInput {
  orderNumber?: string;
  customerId?: number | null;
  customerName: string;
  billingCompany?: string;
  siteLocation?: string;
  generatorId?: number | null;
  generatorName: string;
  generatorKva?: string;
  dcNumber?: string;
  ewayBill?: string;
  startDate: string;
  endDate: string;
  startHours?: number | string;
  closeHours?: number | string;
  rentalType: string;
  dailyRate: number | string;
  transportCharges?: number | string;
  securityDeposit?: number | string;
  dieselIncluded?: boolean;
  dieselValue?: string;
  operatorIncluded?: boolean;
  gstRate?: number | string;
  status?: string;
  notes?: string;
}

import { calculateRentalTotals, RentalTotals } from "@/lib/rentals-calc";
export type { RentalTotals };

export async function getNextRentalOrderNumber(): Promise<string> {
  try {
    const list = await db
      .select({ orderNumber: rentalOrders.orderNumber })
      .from(rentalOrders);

    let maxNum = 0;
    for (const item of list) {
      const match = item.orderNumber?.match(/RO-(\d+)/i);
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

export async function checkOrderNumberAvailable(
  orderNumber: string,
  excludeId?: number
): Promise<{ available: boolean; message?: string }> {
  try {
    const trimmed = orderNumber?.trim();
    if (!trimmed) {
      return { available: false, message: "Order ID/Number cannot be empty" };
    }

    const conditions = [eq(rentalOrders.orderNumber, trimmed)];
    if (excludeId) {
      conditions.push(ne(rentalOrders.id, excludeId));
    }

    const [existing] = await db
      .select({ id: rentalOrders.id })
      .from(rentalOrders)
      .where(and(...conditions));

    if (existing) {
      return {
        available: false,
        message: `Order ID "${trimmed}" already exists. Please choose a unique Order ID.`,
      };
    }
    return { available: true };
  } catch (err) {
    return { available: false, message: (err as Error).message };
  }
}

export async function getRentalOrders(search?: string) {
  try {
    // Automatically complete overdue active orders and sync generator statuses
    try {
      await syncGeneratorStatusesWithRentals();
    } catch (syncErr) {
      console.error("Non-fatal sync error before getRentalOrders:", syncErr);
    }

    let query = db.select().from(rentalOrders);

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      // @ts-expect-error drizzle or conditions typing
      query = query.where(
        or(
          ilike(rentalOrders.orderNumber, q),
          ilike(rentalOrders.customerName, q),
          ilike(rentalOrders.billingCompany, q),
          ilike(rentalOrders.siteLocation, q),
          ilike(rentalOrders.generatorName, q),
          ilike(rentalOrders.generatorKva, q),
          ilike(rentalOrders.dcNumber, q),
          ilike(rentalOrders.ewayBill, q),
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

    // Determine and validate manual/automatic order number
    const orderNumber = data.orderNumber?.trim() || (await getNextRentalOrderNumber());

    const [existing] = await db
      .select({ id: rentalOrders.id })
      .from(rentalOrders)
      .where(eq(rentalOrders.orderNumber, orderNumber));

    if (existing) {
      return {
        success: false,
        error: `Order ID/Number "${orderNumber}" already exists. Please enter a unique Order ID.`,
      };
    }

    // Auto-resolve generatorId if not supplied
    let resolvedGeneratorId = data.generatorId || null;
    if (!resolvedGeneratorId && data.generatorName) {
      try {
        const trimmed = data.generatorName.trim();
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
          resolvedGeneratorId = matched.id;
        }
      } catch (e) {
        console.error("Could not match generator by name:", e);
      }
    }

    // Auto-derive generator kVA if not supplied
    let generatorKva = data.generatorKva?.trim() || "";
    if (!generatorKva && resolvedGeneratorId) {
      try {
        const [gen] = await db
          .select({ capacityKva: generators.capacityKva })
          .from(generators)
          .where(eq(generators.id, resolvedGeneratorId));
        if (gen?.capacityKva) {
          generatorKva = String(gen.capacityKva);
        }
      } catch (e) {
        console.error("Could not fetch generator capacity:", e);
      }
    }

    const gstRateVal = data.gstRate !== undefined && data.gstRate !== "" ? data.gstRate : 18;

    const totals = calculateRentalTotals(
      data.startDate,
      data.endDate,
      data.dailyRate,
      data.transportCharges,
      data.rentalType || "Monthly",
      gstRateVal
    );

    const status = data.status || "Active";

    const [newOrder] = await db
      .insert(rentalOrders)
      .values({
        orderNumber,
        customerId: data.customerId || null,
        customerName: data.customerName.trim(),
        billingCompany: data.billingCompany?.trim() || null,
        siteLocation: data.siteLocation?.trim() || null,
        generatorId: resolvedGeneratorId,
        generatorName: data.generatorName.trim(),
        generatorKva: generatorKva || null,
        dcNumber: data.dcNumber?.trim() || null,
        ewayBill: data.ewayBill?.trim() || null,
        startDate: data.startDate.trim(),
        endDate: data.endDate.trim(),
        startHours: data.startHours !== undefined && data.startHours !== "" ? String(data.startHours) : null,
        closeHours: data.closeHours !== undefined && data.closeHours !== "" ? String(data.closeHours) : null,
        rentalType: data.rentalType?.trim() || "Monthly",
        dailyRate: String(totals.dailyRate),
        transportCharges: String(totals.transportCharges),
        securityDeposit: data.securityDeposit !== undefined ? String(data.securityDeposit) : "0",
        dieselIncluded: Boolean(data.dieselIncluded),
        dieselValue: data.dieselIncluded ? data.dieselValue?.trim() || null : null,
        operatorIncluded: Boolean(data.operatorIncluded),
        rentalCharge: String(totals.rentalCharge),
        gstRate: String(totals.gstRate),
        gstAmount: String(totals.gstAmount),
        totalAmount: String(totals.totalAmount),
        status,
        notes: data.notes?.trim() || null,
      })
      .returning();

    // Auto-update generator status based on rental order
    await syncGeneratorStatusesWithRentals(resolvedGeneratorId || undefined);

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
    const gstRateVal =
      data.gstRate !== undefined && data.gstRate !== ""
        ? data.gstRate
        : currentOrder.gstRate || "18";

    const totals = calculateRentalTotals(
      startDate,
      endDate,
      dailyRate,
      transportCharges,
      rentalType,
      gstRateVal
    );

    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Check unique orderNumber if changed
    if (data.orderNumber !== undefined && data.orderNumber.trim() !== "") {
      const trimmedOrderNumber = data.orderNumber.trim();
      if (trimmedOrderNumber !== currentOrder.orderNumber) {
        const [existing] = await db
          .select({ id: rentalOrders.id })
          .from(rentalOrders)
          .where(
            and(
              eq(rentalOrders.orderNumber, trimmedOrderNumber),
              ne(rentalOrders.id, id)
            )
          );
        if (existing) {
          return {
            success: false,
            error: `Order ID/Number "${trimmedOrderNumber}" already exists on another order. Please enter a unique Order ID.`,
          };
        }
        updateValues.orderNumber = trimmedOrderNumber;

        // Propagate orderNumber to linked dispatches, siteLogs, returns, invoices
        try {
          await Promise.all([
            db
              .update(dispatches)
              .set({ orderNumber: trimmedOrderNumber, updatedAt: new Date() })
              .where(eq(dispatches.orderId, id)),
            db
              .update(siteLogs)
              .set({ orderNumber: trimmedOrderNumber, updatedAt: new Date() })
              .where(eq(siteLogs.orderId, id)),
            db
              .update(returns)
              .set({ orderNumber: trimmedOrderNumber, updatedAt: new Date() })
              .where(eq(returns.orderId, id)),
            db
              .update(invoices)
              .set({ orderNumber: trimmedOrderNumber, updatedAt: new Date() })
              .where(eq(invoices.orderId, id)),
          ]);
        } catch (e) {
          console.error("Failed to cascade orderNumber update:", e);
        }
      }
    }

    if (data.customerId !== undefined) updateValues.customerId = data.customerId;
    if (data.customerName !== undefined) updateValues.customerName = data.customerName.trim();
    if (data.billingCompany !== undefined) updateValues.billingCompany = data.billingCompany?.trim() || null;
    if (data.siteLocation !== undefined) updateValues.siteLocation = data.siteLocation?.trim() || null;
    if (data.generatorId !== undefined) updateValues.generatorId = data.generatorId;
    if (data.generatorName !== undefined) updateValues.generatorName = data.generatorName.trim();
    if (data.generatorKva !== undefined) {
      updateValues.generatorKva = data.generatorKva?.trim() || null;
    } else if (data.generatorId && data.generatorId !== currentOrder.generatorId) {
      try {
        const [gen] = await db
          .select({ capacityKva: generators.capacityKva })
          .from(generators)
          .where(eq(generators.id, data.generatorId));
        if (gen?.capacityKva) {
          updateValues.generatorKva = String(gen.capacityKva);
        }
      } catch (e) {
        console.error("Could not fetch generator capacity on update:", e);
      }
    }
    if (data.dcNumber !== undefined) updateValues.dcNumber = data.dcNumber?.trim() || null;
    if (data.ewayBill !== undefined) updateValues.ewayBill = data.ewayBill?.trim() || null;
    if (data.startDate !== undefined) updateValues.startDate = data.startDate.trim();
    if (data.endDate !== undefined) updateValues.endDate = data.endDate.trim();
    if (data.startHours !== undefined) {
      updateValues.startHours = data.startHours !== "" ? String(data.startHours) : null;
    }
    if (data.closeHours !== undefined) {
      updateValues.closeHours = data.closeHours !== "" ? String(data.closeHours) : null;
    }
    if (data.rentalType !== undefined) updateValues.rentalType = data.rentalType.trim();
    if (data.dailyRate !== undefined) updateValues.dailyRate = String(totals.dailyRate);
    if (data.transportCharges !== undefined) updateValues.transportCharges = String(totals.transportCharges);
    if (data.securityDeposit !== undefined) updateValues.securityDeposit = String(data.securityDeposit);
    if (data.dieselIncluded !== undefined) {
      updateValues.dieselIncluded = Boolean(data.dieselIncluded);
      if (!data.dieselIncluded) {
        updateValues.dieselValue = null;
      }
    }
    if (data.dieselValue !== undefined) {
      updateValues.dieselValue = data.dieselValue?.trim() || null;
    }
    if (data.operatorIncluded !== undefined) updateValues.operatorIncluded = Boolean(data.operatorIncluded);
    if (data.status !== undefined) updateValues.status = data.status.trim();
    if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

    updateValues.rentalCharge = String(totals.rentalCharge);
    updateValues.gstRate = String(totals.gstRate);
    updateValues.gstAmount = String(totals.gstAmount);
    updateValues.totalAmount = String(totals.totalAmount);

    const [updatedOrder] = await db
      .update(rentalOrders)
      .set(updateValues)
      .where(eq(rentalOrders.id, id))
      .returning();

    // Automatically sync generator statuses based on all rental orders
    await syncGeneratorStatusesWithRentals();

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

    // Automatically sync generator status back to Available (if no other active rentals)
    await syncGeneratorStatusesWithRentals(order?.generatorId || undefined);

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

    // Automatically sync generator status back to Available (if no other active rentals)
    await syncGeneratorStatusesWithRentals(deletedOrder?.generatorId || undefined);

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
