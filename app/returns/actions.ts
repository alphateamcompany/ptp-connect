"use server";

import { db } from "@/lib/db";
import {
  returns,
  type ReturnRecord,
  rentalOrders,
  type RentalOrder,
  generators,
  customers,
} from "@/lib/db/schema";
import { desc, ilike, or, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateReturnInput {
  returnNumber: string;
  orderId?: number | null;
  orderNumber: string;
  generatorId?: number | null;
  generatorCode: string;
  generatorCapacity?: string;
  customerName: string;
  siteLocation: string;
  returnDate: string;
  closingHours: number | string;
  notes?: string;
}

export interface RentalOrderOption {
  id: number;
  orderNumber: string;
  customerName: string;
  generatorName: string;
  generatorId: number | null;
  siteLocation: string;
  capacity?: string;
}

export async function getReturns(search?: string): Promise<ReturnRecord[]> {
  try {
    let query = db.select().from(returns);

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
            ilike(returns.siteLocation, q)
          )
        )
        .orderBy(desc(returns.id));
    }

    const rows = await query.orderBy(desc(returns.id));
    return rows;
  } catch (error) {
    console.error("Failed to fetch returns from database:", error);
    return [];
  }
}

export async function getRentalOrdersForReturn(): Promise<RentalOrderOption[]> {
  try {
    const orders = await db
      .select({
        id: rentalOrders.id,
        orderNumber: rentalOrders.orderNumber,
        customerName: rentalOrders.customerName,
        generatorName: rentalOrders.generatorName,
        generatorId: rentalOrders.generatorId,
        siteAddress: customers.siteAddress,
      })
      .from(rentalOrders)
      .leftJoin(customers, eq(rentalOrders.customerId, customers.id))
      .orderBy(desc(rentalOrders.id));

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      generatorName: o.generatorName,
      generatorId: o.generatorId,
      siteLocation: o.siteAddress || "Main Site",
    }));
  } catch (error) {
    console.error("Failed to fetch rental orders for return:", error);
    return [];
  }
}

export async function getNextReturnNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  try {
    const rows = await db
      .select({ returnNumber: returns.returnNumber })
      .from(returns)
      .orderBy(desc(returns.id))
      .limit(1);

    if (rows.length > 0 && rows[0].returnNumber) {
      const match = rows[0].returnNumber.match(/RTN-(\d{4})-(\d+)/);
      if (match) {
        const year = match[1];
        const seq = parseInt(match[2], 10) + 1;
        return `RTN-${year}-${String(seq).padStart(4, "0")}`;
      }
    }

    return `RTN-${currentYear}-0001`;
  } catch {
    return `RTN-${currentYear}-0001`;
  }
}

export async function createReturn(
  data: CreateReturnInput
): Promise<{ success: boolean; data?: ReturnRecord; error?: string }> {
  try {
    const existing = await db
      .select({ id: returns.id })
      .from(returns)
      .where(eq(returns.returnNumber, data.returnNumber.trim()))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: `Return Number "${data.returnNumber}" already exists`,
      };
    }

    const closingHours = Math.max(
      0,
      parseInt(String(data.closingHours ?? 0).replace(/,/g, ""), 10) || 0
    );

    const [newRecord] = await db
      .insert(returns)
      .values({
        returnNumber: data.returnNumber.trim(),
        orderId: data.orderId || null,
        orderNumber: data.orderNumber.trim(),
        generatorId: data.generatorId || null,
        generatorCode: data.generatorCode.trim(),
        generatorCapacity: data.generatorCapacity?.trim() || null,
        customerName: data.customerName.trim(),
        siteLocation: data.siteLocation.trim(),
        returnDate: data.returnDate.trim(),
        closingHours,
        notes: data.notes?.trim() || null,
      })
      .returning();

    // If generatorId is attached, update generator hours & mark Available
    if (data.generatorId) {
      try {
        await db
          .update(generators)
          .set({
            currentHours: closingHours,
            status: "Available",
            updatedAt: new Date(),
          })
          .where(eq(generators.id, data.generatorId));
      } catch (err) {
        console.error("Failed to update generator hours upon return:", err);
      }
    }

    revalidatePath("/returns");
    revalidatePath("/rentals");
    revalidatePath("/generators");
    revalidatePath("/");

    return { success: true, data: newRecord };
  } catch (error) {
    console.error("Failed to create return in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create return record",
    };
  }
}

export async function deleteReturn(
  id: number
): Promise<{ success: boolean; data?: ReturnRecord | { id: number }; error?: string }> {
  try {
    const [deleted] = await db
      .delete(returns)
      .where(eq(returns.id, id))
      .returning();

    revalidatePath("/returns");
    return { success: true, data: deleted || { id } };
  } catch (error) {
    console.error("Failed to delete return record:", error);
    return { success: true, data: { id } };
  }
}
