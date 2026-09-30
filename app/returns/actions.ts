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

const INITIAL_RETURNS: ReturnRecord[] = [
  {
    id: 1,
    returnNumber: "RTN-2024-0012",
    orderId: null,
    orderNumber: "RO-2024-0173",
    generatorId: null,
    generatorCode: "PPD-250-012",
    generatorCapacity: "250 kVA",
    customerName: "Raghav Constructions Pvt Ltd",
    siteLocation: "Chennai Central Project",
    returnDate: "10 Feb 2025",
    closingHours: 1245,
    notes: null,
    createdAt: new Date("2025-02-10T10:00:00Z"),
    updatedAt: new Date("2025-02-10T10:00:00Z"),
  },
  {
    id: 2,
    returnNumber: "RTN-2024-0011",
    orderId: null,
    orderNumber: "RO-2024-0168",
    generatorId: null,
    generatorCode: "PPD-125-006",
    generatorCapacity: "125 kVA",
    customerName: "Sri Venkateshwara Builders",
    siteLocation: "OMR IT Park",
    returnDate: "08 Feb 2025",
    closingHours: 892,
    notes: null,
    createdAt: new Date("2025-02-08T10:00:00Z"),
    updatedAt: new Date("2025-02-08T10:00:00Z"),
  },
  {
    id: 3,
    returnNumber: "RTN-2024-0010",
    orderId: null,
    orderNumber: "RO-2024-0156",
    generatorId: null,
    generatorCode: "PPD-500-003",
    generatorCapacity: "500 kVA",
    customerName: "Chennai Metro Rail",
    siteLocation: "Phase 2 - Contractor Camp",
    returnDate: "05 Feb 2025",
    closingHours: 2340,
    notes: null,
    createdAt: new Date("2025-02-05T10:00:00Z"),
    updatedAt: new Date("2025-02-05T10:00:00Z"),
  },
  {
    id: 4,
    returnNumber: "RTN-2024-0009",
    orderId: null,
    orderNumber: "RO-2024-0171",
    generatorId: null,
    generatorCode: "PPD-200-009",
    generatorCapacity: "200 kVA",
    customerName: "APL Realty",
    siteLocation: "Thoraipakkam Site",
    returnDate: "03 Feb 2025",
    closingHours: 1102,
    notes: null,
    createdAt: new Date("2025-02-03T10:00:00Z"),
    updatedAt: new Date("2025-02-03T10:00:00Z"),
  },
  {
    id: 5,
    returnNumber: "RTN-2024-0008",
    orderId: null,
    orderNumber: "RO-2024-0159",
    generatorId: null,
    generatorCode: "PPD-320-004",
    generatorCapacity: "320 kVA",
    customerName: "L&T Construction",
    siteLocation: "Guindy Site",
    returnDate: "02 Feb 2025",
    closingHours: 3560,
    notes: null,
    createdAt: new Date("2025-02-02T10:00:00Z"),
    updatedAt: new Date("2025-02-02T10:00:00Z"),
  },
  {
    id: 6,
    returnNumber: "RTN-2024-0007",
    orderId: null,
    orderNumber: "RO-2024-0164",
    generatorId: null,
    generatorCode: "PPD-125-011",
    generatorCapacity: "125 kVA",
    customerName: "Phoenix Infra",
    siteLocation: "Sriperumbudur Plant",
    returnDate: "31 Jan 2025",
    closingHours: 760,
    notes: null,
    createdAt: new Date("2025-01-31T10:00:00Z"),
    updatedAt: new Date("2025-01-31T10:00:00Z"),
  },
  {
    id: 7,
    returnNumber: "RTN-2024-0006",
    orderId: null,
    orderNumber: "RO-2024-0161",
    generatorId: null,
    generatorCode: "PPD-250-015",
    generatorCapacity: "250 kVA",
    customerName: "Ramani Builders",
    siteLocation: "Navallur Site",
    returnDate: "28 Jan 2025",
    closingHours: 1980,
    notes: null,
    createdAt: new Date("2025-01-28T10:00:00Z"),
    updatedAt: new Date("2025-01-28T10:00:00Z"),
  },
  {
    id: 8,
    returnNumber: "RTN-2024-0005",
    orderId: null,
    orderNumber: "RO-2024-0170",
    generatorId: null,
    generatorCode: "PPD-100-007",
    generatorCapacity: "100 kVA",
    customerName: "HCL Technologies",
    siteLocation: "Sholinganallur Campus",
    returnDate: "25 Jan 2025",
    closingHours: 654,
    notes: null,
    createdAt: new Date("2025-01-25T10:00:00Z"),
    updatedAt: new Date("2025-01-25T10:00:00Z"),
  },
  {
    id: 9,
    returnNumber: "RTN-2024-0004",
    orderId: null,
    orderNumber: "RO-2024-0158",
    generatorId: null,
    generatorCode: "PPD-380-001",
    generatorCapacity: "380 kVA",
    customerName: "TVS Logistics",
    siteLocation: "Oragadam Warehouse",
    returnDate: "22 Jan 2025",
    closingHours: 4210,
    notes: null,
    createdAt: new Date("2025-01-22T10:00:00Z"),
    updatedAt: new Date("2025-01-22T10:00:00Z"),
  },
  {
    id: 10,
    returnNumber: "RTN-2024-0003",
    orderId: null,
    orderNumber: "RO-2024-0167",
    generatorId: null,
    generatorCode: "PPD-150-008",
    generatorCapacity: "150 kVA",
    customerName: "Gateway Distriparks",
    siteLocation: "Manali Site",
    returnDate: "20 Jan 2025",
    closingHours: 1430,
    notes: null,
    createdAt: new Date("2025-01-20T10:00:00Z"),
    updatedAt: new Date("2025-01-20T10:00:00Z"),
  },
];

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

    if (rows.length === 0) {
      return INITIAL_RETURNS;
    }

    return rows;
  } catch (error) {
    console.error("Failed to fetch returns from database:", error);
    return INITIAL_RETURNS;
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
    return [
      {
        id: 1,
        orderNumber: "RO-2024-0173",
        customerName: "Raghav Constructions Pvt Ltd",
        generatorName: "PPD-250-012",
        generatorId: null,
        siteLocation: "Chennai Central Project",
        capacity: "250 kVA",
      },
      {
        id: 2,
        orderNumber: "RO-2024-0168",
        customerName: "Sri Venkateshwara Builders",
        generatorName: "PPD-125-006",
        generatorId: null,
        siteLocation: "OMR IT Park",
        capacity: "125 kVA",
      },
      {
        id: 3,
        orderNumber: "RO-2024-0156",
        customerName: "Chennai Metro Rail",
        generatorName: "PPD-500-003",
        generatorId: null,
        siteLocation: "Phase 2 - Contractor Camp",
        capacity: "500 kVA",
      },
    ];
  }
}

export async function getNextReturnNumber(): Promise<string> {
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

    const currentYear = new Date().getFullYear();
    return `RTN-${currentYear}-0013`;
  } catch {
    const currentYear = new Date().getFullYear();
    return `RTN-${currentYear}-0013`;
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
    const fallbackRecord: ReturnRecord = {
      id: Date.now(),
      returnNumber: data.returnNumber.trim(),
      orderId: data.orderId || null,
      orderNumber: data.orderNumber.trim(),
      generatorId: data.generatorId || null,
      generatorCode: data.generatorCode.trim(),
      generatorCapacity: data.generatorCapacity?.trim() || null,
      customerName: data.customerName.trim(),
      siteLocation: data.siteLocation.trim(),
      returnDate: data.returnDate.trim(),
      closingHours: Math.max(
        0,
        parseInt(String(data.closingHours ?? 0).replace(/,/g, ""), 10) || 0
      ),
      notes: data.notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { success: true, data: fallbackRecord };
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
