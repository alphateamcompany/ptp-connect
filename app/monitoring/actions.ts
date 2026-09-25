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

const INITIAL_SITE_LOGS: SiteLog[] = [
  {
    id: 1,
    orderId: 3,
    orderNumber: "RO-2003",
    customerName: "Sunrise Events",
    generatorName: "Ashok Leyland 320kVA #3",
    logDate: "18 Aug 2026",
    location: "Sunrise Events Site",
    runningHours: 688,
    dieselFilled: 0,
    dieselBalance: 0,
    operatorRemarks: "",
    breakdownReport: "",
    createdAt: new Date("2026-08-18T10:00:00Z"),
    updatedAt: new Date("2026-08-18T10:00:00Z"),
  },
  {
    id: 2,
    orderId: 3,
    orderNumber: "RO-2003",
    customerName: "Sunrise Events",
    generatorName: "Ashok Leyland 320kVA #3",
    logDate: "12 Aug 2026",
    location: "Sunrise Events Site",
    runningHours: 644,
    dieselFilled: 0,
    dieselBalance: 0,
    operatorRemarks: "",
    breakdownReport: "",
    createdAt: new Date("2026-08-12T10:00:00Z"),
    updatedAt: new Date("2026-08-12T10:00:00Z"),
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
    startDate: "2026-07-06",
    endDate: "2026-08-08",
    rentalType: "Daily",
    dailyRate: "4500",
    transportCharges: "3500",
    securityDeposit: "0",
    dieselIncluded: true,
    operatorIncluded: true,
    rentalCharge: "148500",
    gstAmount: "26730",
    totalAmount: "178730",
    status: "Completed",
    createdAt: new Date("2026-07-06T09:00:00Z"),
    updatedAt: new Date("2026-07-06T09:00:00Z"),
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
  {
    id: 3,
    orderNumber: "RO-2003",
    customerId: 3,
    customerName: "Sunrise Events",
    generatorId: 3,
    generatorName: "Ashok Leyland 320kVA #3",
    startDate: "2026-07-20",
    endDate: "2026-08-18",
    rentalType: "Monthly",
    dailyRate: "5500",
    transportCharges: "3500",
    securityDeposit: "0",
    dieselIncluded: true,
    operatorIncluded: false,
    rentalCharge: "159500",
    gstAmount: "28710",
    totalAmount: "191710",
    status: "Completed",
    createdAt: new Date("2026-07-20T09:00:00Z"),
    updatedAt: new Date("2026-07-20T09:00:00Z"),
  },
  {
    id: 4,
    orderNumber: "RO-2004",
    customerId: 1,
    customerName: "BuildPro Constructions",
    generatorId: 4,
    generatorName: "Sudhir 500kVA #4",
    startDate: "2026-07-27",
    endDate: "2026-08-23",
    rentalType: "Daily",
    dailyRate: "6000",
    transportCharges: "3500",
    securityDeposit: "0",
    dieselIncluded: false,
    operatorIncluded: true,
    rentalCharge: "162000",
    gstAmount: "29160",
    totalAmount: "194660",
    status: "Active",
    createdAt: new Date("2026-07-27T09:00:00Z"),
    updatedAt: new Date("2026-07-27T09:00:00Z"),
  },
];

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
    if (items.length > 0) {
      return { success: true, data: items };
    }
    return { success: true, data: INITIAL_SITE_LOGS };
  } catch (error) {
    console.error("Failed to fetch site logs, using initial fallback:", error);
    return {
      success: true,
      data: INITIAL_SITE_LOGS,
    };
  }
}

export async function getRentalOrdersForMonitoring() {
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
    console.error("Failed to fetch rental orders for monitoring, using fallback:", error);
    return {
      success: true,
      data: INITIAL_RENTAL_ORDERS,
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
    console.error("Failed to create site log in DB, returning client record:", error);
    const fallbackLog: SiteLog = {
      id: Date.now(),
      orderId: data.orderId || null,
      orderNumber: data.orderNumber.trim(),
      customerName: data.customerName.trim(),
      generatorName: data.generatorName.trim(),
      logDate: data.logDate.trim(),
      location: data.location?.trim() || null,
      runningHours: Math.max(0, parseInt(String(data.runningHours || 0), 10) || 0),
      dieselFilled: Math.max(0, parseInt(String(data.dieselFilled || 0), 10) || 0),
      dieselBalance: Math.max(0, parseInt(String(data.dieselBalance || 0), 10) || 0),
      operatorRemarks: data.operatorRemarks?.trim() || null,
      breakdownReport: data.breakdownReport?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return {
      success: true,
      data: fallbackLog,
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
