"use server";

import { db } from "@/lib/db";
import {
  returns,
  type ReturnRecord,
  type TransportRecord,
  rentalOrders,
  type RentalOrder,
  generators,
  customers,
  dispatches,
} from "@/lib/db/schema";
import { desc, ilike, or, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { syncGeneratorStatusesWithRentals } from "@/lib/sync-generators";

export interface CreateReturnInput {
  returnNumber?: string;
  orderId?: number | null;
  orderNumber: string;
  generatorId?: number | null;
  generatorCode: string;
  generatorCapacity?: string;
  customerName: string;
  siteLocation: string;
  // Start / Dispatch details
  startDate?: string;
  startingHours?: number | string;
  driverName?: string;
  vehicleNumber?: string;
  // Return / Closing details
  closingDate?: string;
  returnDate?: string;
  closingHours?: number | string;
  returnDriverName?: string;
  returnVehicleNumber?: string;
  status?: string;
  notes?: string;
}

export type CreateTransportInput = CreateReturnInput;

export interface RentalOrderOption {
  id: number;
  orderNumber: string;
  customerName: string;
  generatorName: string;
  generatorId: number | null;
  siteLocation: string;
  capacity?: string;
  orderStartDate?: string;
  currentHours?: number;
  dispatchDate?: string;
  dispatchHours?: number;
  dispatchDriverName?: string;
  dispatchVehicleNumber?: string;
}

export async function getReturns(search?: string): Promise<ReturnRecord[]> {
  try {
    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      return await db
        .select()
        .from(returns)
        .where(
          or(
            ilike(returns.returnNumber, q),
            ilike(returns.orderNumber, q),
            ilike(returns.generatorCode, q),
            ilike(returns.customerName, q),
            ilike(returns.siteLocation, q),
            ilike(returns.driverName, q),
            ilike(returns.vehicleNumber, q),
            ilike(returns.returnDriverName, q),
            ilike(returns.returnVehicleNumber, q)
          )
        )
        .orderBy(desc(returns.id));
    }

    const rows = await db.select().from(returns).orderBy(desc(returns.id));
    return rows;
  } catch (error) {
    console.error("Failed to fetch returns from database:", error);
    return [];
  }
}

export const getTransports = getReturns;

export async function getRentalOrdersForReturn(): Promise<RentalOrderOption[]> {
  try {
    const orders = await db
      .select({
        id: rentalOrders.id,
        orderNumber: rentalOrders.orderNumber,
        customerName: rentalOrders.customerName,
        generatorName: rentalOrders.generatorName,
        generatorId: rentalOrders.generatorId,
        startDate: rentalOrders.startDate,
        siteAddress: customers.siteAddress,
        generatorCurrentHours: generators.currentHours,
        generatorCapacity: generators.capacityKva,
        dispatchDate: dispatches.dispatchDate,
        dispatchHours: dispatches.hoursBeforeDispatch,
        dispatchDriver: dispatches.driverName,
        dispatchVehicle: dispatches.vehicleNumber,
      })
      .from(rentalOrders)
      .leftJoin(customers, eq(rentalOrders.customerId, customers.id))
      .leftJoin(generators, eq(rentalOrders.generatorId, generators.id))
      .leftJoin(dispatches, eq(rentalOrders.id, dispatches.orderId))
      .orderBy(desc(rentalOrders.id));

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      generatorName: o.generatorName,
      generatorId: o.generatorId,
      siteLocation: o.siteAddress || "Main Site",
      capacity: o.generatorCapacity ? `${o.generatorCapacity} kVA` : undefined,
      orderStartDate: o.startDate || undefined,
      currentHours: o.generatorCurrentHours ?? 0,
      dispatchDate: o.dispatchDate || undefined,
      dispatchHours: o.dispatchHours ?? undefined,
      dispatchDriverName: o.dispatchDriver || undefined,
      dispatchVehicleNumber: o.dispatchVehicle || undefined,
    }));
  } catch (error) {
    console.error("Failed to fetch rental orders for return/transport:", error);
    return [];
  }
}

export const getRentalOrdersForTransport = getRentalOrdersForReturn;

export async function getNextReturnNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  try {
    const rows = await db
      .select({ returnNumber: returns.returnNumber })
      .from(returns)
      .orderBy(desc(returns.id))
      .limit(1);

    if (rows.length > 0 && rows[0].returnNumber) {
      const match = rows[0].returnNumber.match(/(?:TRN|RTN)-(\d{4})-(\d+)/);
      if (match) {
        const year = match[1];
        const seq = parseInt(match[2], 10) + 1;
        return `TRN-${year}-${String(seq).padStart(4, "0")}`;
      }
    }

    return `TRN-${currentYear}-0001`;
  } catch {
    return `TRN-${currentYear}-0001`;
  }
}

export const getNextTransportNumber = getNextReturnNumber;

export async function createReturn(
  data: CreateReturnInput
): Promise<{ success: boolean; data?: ReturnRecord; error?: string }> {
  try {
    const finalReturnNumber =
      data.returnNumber?.trim() || (await getNextReturnNumber());

    const existing = await db
      .select({ id: returns.id })
      .from(returns)
      .where(eq(returns.returnNumber, finalReturnNumber))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: `Record Number "${finalReturnNumber}" already exists`,
      };
    }

    const closingHours = Math.max(
      0,
      parseInt(String(data.closingHours ?? 0).replace(/,/g, ""), 10) || 0
    );

    const startingHours = Math.max(
      0,
      parseInt(String(data.startingHours ?? 0).replace(/,/g, ""), 10) || 0
    );

    const closingDateVal = data.closingDate?.trim() || data.returnDate?.trim() || "";
    const startDateVal = data.startDate?.trim() || "";
    const effectiveReturnDate = closingDateVal || startDateVal || "—";

    const determinedStatus =
      data.status ||
      (closingDateVal && closingHours > 0 ? "Returned" : "Dispatched");

    const [newRecord] = await db
      .insert(returns)
      .values({
        returnNumber: finalReturnNumber,
        orderId: data.orderId || null,
        orderNumber: data.orderNumber.trim(),
        generatorId: data.generatorId || null,
        generatorCode: data.generatorCode.trim(),
        generatorCapacity: data.generatorCapacity?.trim() || null,
        customerName: data.customerName.trim(),
        siteLocation: data.siteLocation.trim(),
        // Start / Dispatch
        startDate: startDateVal || null,
        startingHours: startingHours,
        driverName: data.driverName?.trim() || null,
        vehicleNumber: data.vehicleNumber?.trim() || null,
        // Return / Closing
        returnDate: effectiveReturnDate,
        closingDate: closingDateVal || null,
        closingHours,
        returnDriverName: data.returnDriverName?.trim() || null,
        returnVehicleNumber: data.returnVehicleNumber?.trim() || null,
        status: determinedStatus,
        notes: data.notes?.trim() || null,
      })
      .returning();

    // If orderId is attached and return is completed, mark rental order as Completed
    if ((closingHours > 0 || determinedStatus === "Returned") && (data.orderId || data.orderNumber)) {
      try {
        if (data.orderId) {
          await db
            .update(rentalOrders)
            .set({ status: "Completed", updatedAt: new Date() })
            .where(eq(rentalOrders.id, data.orderId));
        } else if (data.orderNumber) {
          await db
            .update(rentalOrders)
            .set({ status: "Completed", updatedAt: new Date() })
            .where(eq(rentalOrders.orderNumber, data.orderNumber.trim()));
        }
      } catch (err) {
        console.error("Failed to mark rental order Completed upon return:", err);
      }
    }

    // If generatorId is attached and closing details exist, update generator hours
    if (data.generatorId && closingHours > 0) {
      try {
        await db
          .update(generators)
          .set({
            currentHours: closingHours,
            updatedAt: new Date(),
          })
          .where(eq(generators.id, data.generatorId));
      } catch (err) {
        console.error("Failed to update generator hours upon return:", err);
      }
    }

    // Automatically sync generator status based on remaining active rentals
    await syncGeneratorStatusesWithRentals(data.generatorId || undefined);

    revalidatePath("/transport");
    revalidatePath("/returns");
    revalidatePath("/dispatch");
    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: newRecord };
  } catch (error) {
    console.error("Failed to create return/transport in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create transport record",
    };
  }
}

export const createTransport = createReturn;

export async function updateReturn(
  id: number,
  data: Partial<CreateReturnInput>
): Promise<{ success: boolean; data?: ReturnRecord; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.orderNumber !== undefined) updateData.orderNumber = data.orderNumber.trim();
    if (data.orderId !== undefined) updateData.orderId = data.orderId;
    if (data.generatorId !== undefined) updateData.generatorId = data.generatorId;
    if (data.generatorCode !== undefined) updateData.generatorCode = data.generatorCode.trim();
    if (data.generatorCapacity !== undefined) updateData.generatorCapacity = data.generatorCapacity?.trim() || null;
    if (data.customerName !== undefined) updateData.customerName = data.customerName.trim();
    if (data.siteLocation !== undefined) updateData.siteLocation = data.siteLocation.trim();

    // Start / Dispatch
    if (data.startDate !== undefined) updateData.startDate = data.startDate?.trim() || null;
    if (data.startingHours !== undefined) {
      updateData.startingHours = Math.max(
        0,
        parseInt(String(data.startingHours ?? 0).replace(/,/g, ""), 10) || 0
      );
    }
    if (data.driverName !== undefined) updateData.driverName = data.driverName?.trim() || null;
    if (data.vehicleNumber !== undefined) updateData.vehicleNumber = data.vehicleNumber?.trim() || null;

    // Return / Closing
    if (data.closingDate !== undefined) {
      const cDate = data.closingDate?.trim() || null;
      updateData.closingDate = cDate;
      if (cDate) updateData.returnDate = cDate;
    }
    if (data.returnDate !== undefined && data.closingDate === undefined) {
      updateData.returnDate = data.returnDate.trim();
      updateData.closingDate = data.returnDate.trim();
    }
    if (data.closingHours !== undefined) {
      updateData.closingHours = Math.max(
        0,
        parseInt(String(data.closingHours ?? 0).replace(/,/g, ""), 10) || 0
      );
    }
    if (data.returnDriverName !== undefined) updateData.returnDriverName = data.returnDriverName?.trim() || null;
    if (data.returnVehicleNumber !== undefined) updateData.returnVehicleNumber = data.returnVehicleNumber?.trim() || null;

    if (data.status !== undefined) {
      updateData.status = data.status;
    } else if (data.closingDate || (data.closingHours && Number(data.closingHours) > 0)) {
      updateData.status = "Returned";
    }

    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

    const [updated] = await db
      .update(returns)
      .set(updateData)
      .where(eq(returns.id, id))
      .returning();

    if (!updated) {
      return { success: false, error: "Record not found" };
    }

    // If orderId is attached and return is completed, mark rental order as Completed
    if ((updated.closingHours > 0 || updated.status === "Returned") && (updated.orderId || updated.orderNumber)) {
      try {
        if (updated.orderId) {
          await db
            .update(rentalOrders)
            .set({ status: "Completed", updatedAt: new Date() })
            .where(eq(rentalOrders.id, updated.orderId));
        } else if (updated.orderNumber) {
          await db
            .update(rentalOrders)
            .set({ status: "Completed", updatedAt: new Date() })
            .where(eq(rentalOrders.orderNumber, updated.orderNumber.trim()));
        }
      } catch (err) {
        console.error("Failed to mark rental order Completed upon return update:", err);
      }
    }

    // If closingHours updated and generatorId exists, update generator
    if (updated.generatorId && updated.closingHours > 0) {
      try {
        await db
          .update(generators)
          .set({
            currentHours: updated.closingHours,
            updatedAt: new Date(),
          })
          .where(eq(generators.id, updated.generatorId));
      } catch (err) {
        console.error("Failed to update generator hours upon return edit:", err);
      }
    }

    // Automatically sync generator status based on remaining active rentals
    await syncGeneratorStatusesWithRentals(updated.generatorId || undefined);

    revalidatePath("/transport");
    revalidatePath("/returns");
    revalidatePath("/dispatch");
    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update transport/return:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to update transport record",
    };
  }
}

export const updateTransport = updateReturn;

export async function deleteReturn(
  id: number
): Promise<{ success: boolean; data?: ReturnRecord | { id: number }; error?: string }> {
  try {
    const [deleted] = await db
      .delete(returns)
      .where(eq(returns.id, id))
      .returning();

    revalidatePath("/transport");
    revalidatePath("/returns");
    revalidatePath("/dispatch");
    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");
    return { success: true, data: deleted || { id } };
  } catch (error) {
    console.error("Failed to delete return record:", error);
    return { success: true, data: { id } };
  }
}

export const deleteTransport = deleteReturn;
