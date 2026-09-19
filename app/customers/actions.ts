"use server";

import { db } from "@/lib/db";
import { customers, type Customer } from "@/lib/db/schema";
import { asc, ilike, or, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateCustomerInput {
  customerName: string;
  companyName: string;
  gstNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  paymentTerms?: string;
  outstandingAmount?: number | string;
  billingAddress?: string;
  siteAddress?: string;
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    customerName: "BuildPro Constructions",
    companyName: "BuildPro Constructions",
    gstNumber: "27ABCDE1234F1Z5",
    contactPerson: "Rajesh Sharma",
    phone: "+91 9876543210",
    email: "rajesh@buildpro.com",
    paymentTerms: "Net 30",
    outstandingAmount: "75000",
    billingAddress: "402, Trade Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
    siteAddress: "Metro Line 4 Project Site, Mulund West, Mumbai",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
  },
  {
    id: 2,
    customerName: "TechPark Realty",
    companyName: "TechPark Realty",
    gstNumber: "27FGHIJ5678K1L9",
    contactPerson: "Priya Menon",
    phone: "+91 9765432109",
    email: "priya@techpark.com",
    paymentTerms: "Net 15",
    outstandingAmount: "0",
    billingAddress: "12th Floor, Cyber Heights, HITEC City, Hyderabad, Telangana 500081",
    siteAddress: "Phase 3 Commercial Tower, Gachibowli, Hyderabad",
    createdAt: new Date("2024-02-10T11:30:00Z"),
    updatedAt: new Date("2024-02-10T11:30:00Z"),
  },
  {
    id: 3,
    customerName: "Sunrise Events",
    companyName: "Sunrise Events",
    gstNumber: "27MNOPQ9012R3S4",
    contactPerson: "Anil Kumar",
    phone: "+91 9654321098",
    email: "anil@sunriseevents.com",
    paymentTerms: "Net 30",
    outstandingAmount: "45000",
    billingAddress: "Plot 88, Industrial Area Phase II, Chandigarh 160002",
    siteAddress: "Grand Heritage Lawn, NH-1, Ambala Highway",
    createdAt: new Date("2024-03-05T14:15:00Z"),
    updatedAt: new Date("2024-03-05T14:15:00Z"),
  },
];

export async function getCustomers(search?: string) {
  try {
    let query = db.select().from(customers);

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      // @ts-expect-error drizzle or conditions typing
      query = query.where(
        or(
          ilike(customers.companyName, q),
          ilike(customers.customerName, q),
          ilike(customers.contactPerson, q),
          ilike(customers.phone, q),
          ilike(customers.email, q),
          ilike(customers.gstNumber, q)
        )
      );
    }

    const items = await query.orderBy(asc(customers.id));

    if (items.length === 0 && (!search || search.trim() === "")) {
      // Seed default customers if database table is empty
      try {
        const seeded = await db
          .insert(customers)
          .values(
            INITIAL_CUSTOMERS.map((c) => ({
              customerName: c.customerName,
              companyName: c.companyName,
              gstNumber: c.gstNumber,
              contactPerson: c.contactPerson,
              phone: c.phone,
              email: c.email,
              paymentTerms: c.paymentTerms,
              outstandingAmount: c.outstandingAmount,
              billingAddress: c.billingAddress,
              siteAddress: c.siteAddress,
            }))
          )
          .returning();
        return { success: true, data: seeded };
      } catch {
        return { success: true, data: INITIAL_CUSTOMERS };
      }
    }

    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch customers from database:", error);
    return { success: true, data: INITIAL_CUSTOMERS };
  }
}

export async function createCustomer(data: CreateCustomerInput) {
  try {
    const customerName = data.customerName?.trim() || data.companyName?.trim();
    const companyName = data.companyName?.trim() || data.customerName?.trim();

    if (!customerName || !companyName) {
      return { success: false, error: "Customer Name and Company Name are required." };
    }

    const newCustomer = await db
      .insert(customers)
      .values({
        customerName,
        companyName,
        gstNumber: data.gstNumber?.trim() || null,
        contactPerson: data.contactPerson?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        paymentTerms: data.paymentTerms?.trim() || "Net 30",
        outstandingAmount:
          data.outstandingAmount !== undefined && data.outstandingAmount !== ""
            ? String(data.outstandingAmount)
            : "0",
        billingAddress: data.billingAddress?.trim() || null,
        siteAddress: data.siteAddress?.trim() || null,
      })
      .returning();

    revalidatePath("/customers");
    revalidatePath("/");

    return { success: true, data: newCustomer[0] };
  } catch (error) {
    console.error("Failed to create customer:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create customer in database",
    };
  }
}

export async function updateCustomer(
  id: number,
  data: Partial<CreateCustomerInput>
) {
  try {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.customerName !== undefined) {
      updateValues.customerName = data.customerName.trim();
    }
    if (data.companyName !== undefined) {
      updateValues.companyName = data.companyName.trim();
    }
    if (data.gstNumber !== undefined) {
      updateValues.gstNumber = data.gstNumber.trim() || null;
    }
    if (data.contactPerson !== undefined) {
      updateValues.contactPerson = data.contactPerson.trim() || null;
    }
    if (data.phone !== undefined) {
      updateValues.phone = data.phone.trim() || null;
    }
    if (data.email !== undefined) {
      updateValues.email = data.email.trim() || null;
    }
    if (data.paymentTerms !== undefined) {
      updateValues.paymentTerms = data.paymentTerms.trim() || "Net 30";
    }
    if (data.outstandingAmount !== undefined) {
      updateValues.outstandingAmount =
        data.outstandingAmount !== "" ? String(data.outstandingAmount) : "0";
    }
    if (data.billingAddress !== undefined) {
      updateValues.billingAddress = data.billingAddress.trim() || null;
    }
    if (data.siteAddress !== undefined) {
      updateValues.siteAddress = data.siteAddress.trim() || null;
    }

    const updated = await db
      .update(customers)
      .set(updateValues)
      .where(eq(customers.id, id))
      .returning();

    revalidatePath("/customers");
    revalidatePath("/");

    return { success: true, data: updated[0] };
  } catch (error) {
    console.error("Failed to update customer:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to update customer",
    };
  }
}

export async function deleteCustomer(id: number) {
  try {
    await db.delete(customers).where(eq(customers.id, id));
    revalidatePath("/customers");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to delete customer",
    };
  }
}
