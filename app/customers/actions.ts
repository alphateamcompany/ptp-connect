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
    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch customers from database:", error);
    return { success: false, error: (error as Error).message, data: [] as Customer[] };
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
        paymentTerms: data.paymentTerms?.trim() || "Cash",
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
    const updateValues: Partial<Customer> = {
      updatedAt: new Date(),
    };

    if (data.customerName !== undefined) {
      updateValues.customerName = data.customerName.trim();
    }
    if (data.companyName !== undefined) {
      updateValues.companyName = data.companyName.trim();
    }
    if (data.gstNumber !== undefined) {
      updateValues.gstNumber = data.gstNumber.trim().toUpperCase() || null;
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
      updateValues.paymentTerms = data.paymentTerms.trim() || "Cash";
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
