"use server";

import { db } from "@/lib/db";
import {
  invoices,
  type Invoice,
  payments,
  type Payment,
  expenses,
  type Expense,
  rentalOrders,
  type RentalOrder,
  customers,
  type Customer,
  generators,
  type Generator,
} from "@/lib/db/schema";
import { desc, ilike, or, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateInvoiceInput {
  orderId?: number | null;
  orderNumber?: string;
  customerId?: number | null;
  customerName: string;
  customerGst?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number | string;
  gstAmount?: number | string;
  transportCharges?: number | string;
  additionalCharges?: number | string;
  totalAmount: number | string;
  paidAmount?: number | string;
  status?: string;
  paymentTerms?: string;
  notes?: string | null;
}

export interface RecordPaymentInput {
  invoiceId?: number | null;
  invoiceNumber?: string;
  customerId?: number | null;
  customerName: string;
  amount: number | string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string | null;
}

export interface CreateExpenseInput {
  category: string;
  description: string;
  generatorId?: number | null;
  generatorName?: string;
  amount: number | string;
  expenseDate: string;
  vendor?: string;
  paymentMethod?: string;
  status?: string;
  notes?: string | null;
}

export interface FinanceStats {
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  totalExpenses: number;
  netProfit: number;
  collectionRate: number;
  overdueInvoicesCount: number;
  pendingInvoicesCount: number;
}

export interface CustomerBalanceSummary {
  customerId?: number;
  customerName: string;
  companyName: string;
  gstNumber?: string | null;
  paymentTerms?: string | null;
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  invoiceCount: number;
  status: "Settled" | "Pending" | "Overdue";
}



export async function getInvoices(search?: string, status?: string): Promise<Invoice[]> {
  try {
    let query = db.select().from(invoices);

    const conditions = [];

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, q),
          ilike(invoices.customerName, q),
          ilike(invoices.orderNumber, q),
          ilike(invoices.customerGst, q),
          ilike(invoices.status, q)
        )
      );
    }

    if (status && status !== "All") {
      conditions.push(eq(invoices.status, status));
    }

    if (conditions.length > 0) {
      // @ts-expect-error drizzle conditions
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const rows = await query.orderBy(desc(invoices.id));
    return rows;
  } catch (error) {
    console.error("Failed to fetch invoices from DB:", error);
    return [];
  }
}

export async function getPayments(search?: string): Promise<Payment[]> {
  try {
    let query = db.select().from(payments);

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      // @ts-expect-error drizzle conditions
      query = query.where(
        or(
          ilike(payments.paymentNumber, q),
          ilike(payments.customerName, q),
          ilike(payments.invoiceNumber, q),
          ilike(payments.referenceNumber, q),
          ilike(payments.paymentMethod, q)
        )
      );
    }

    const rows = await query.orderBy(desc(payments.id));
    return rows;
  } catch (error) {
    console.error("Failed to fetch payments from DB:", error);
    return [];
  }
}

export async function getExpenses(search?: string, category?: string): Promise<Expense[]> {
  try {
    let query = db.select().from(expenses);

    const conditions = [];

    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(expenses.expenseNumber, q),
          ilike(expenses.description, q),
          ilike(expenses.category, q),
          ilike(expenses.vendor, q),
          ilike(expenses.generatorName, q)
        )
      );
    }

    if (category && category !== "All") {
      conditions.push(eq(expenses.category, category));
    }

    if (conditions.length > 0) {
      // @ts-expect-error drizzle conditions
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const rows = await query.orderBy(desc(expenses.id));
    return rows;
  } catch (error) {
    console.error("Failed to fetch expenses from DB:", error);
    return [];
  }
}

export async function getFinanceStats(
  invoicesList?: Invoice[],
  expensesList?: Expense[]
): Promise<FinanceStats> {
  const [invs, exps] = await Promise.all([
    invoicesList ? Promise.resolve(invoicesList) : getInvoices(),
    expensesList ? Promise.resolve(expensesList) : getExpenses(),
  ]);

  let totalRevenue = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let overdueInvoicesCount = 0;
  let pendingInvoicesCount = 0;

  const today = new Date().toISOString().split("T")[0];

  for (const inv of invs) {
    const total = parseFloat(inv.totalAmount) || 0;
    const paid = parseFloat(inv.paidAmount) || 0;
    const balance = parseFloat(inv.balanceAmount) || 0;

    totalRevenue += total;
    totalCollected += paid;
    totalOutstanding += balance;

    if (balance > 0) {
      if (inv.dueDate && inv.dueDate < today) {
        overdueInvoicesCount++;
      } else {
        pendingInvoicesCount++;
      }
    }
  }

  let totalExpenses = 0;
  for (const exp of exps) {
    totalExpenses += parseFloat(exp.amount) || 0;
  }

  const netProfit = totalCollected - totalExpenses;
  const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 100;

  return {
    totalRevenue,
    totalCollected,
    totalOutstanding,
    totalExpenses,
    netProfit,
    collectionRate,
    overdueInvoicesCount,
    pendingInvoicesCount,
  };
}

export async function getNextInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  try {
    const list = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .orderBy(desc(invoices.id));

    let maxNum = 0;
    for (const item of list) {
      const match = item.invoiceNumber.match(/INV-\d{4}-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextSeq = String(maxNum + 1).padStart(4, "0");
    return `INV-${currentYear}-${nextSeq}`;
  } catch {
    return `INV-${currentYear}-0001`;
  }
}

export async function getNextPaymentNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  try {
    const list = await db
      .select({ paymentNumber: payments.paymentNumber })
      .from(payments)
      .orderBy(desc(payments.id));

    let maxNum = 0;
    for (const item of list) {
      const match = item.paymentNumber.match(/REC-\d{4}-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextSeq = String(maxNum + 1).padStart(4, "0");
    return `REC-${currentYear}-${nextSeq}`;
  } catch {
    return `REC-${currentYear}-0001`;
  }
}

export async function getNextExpenseNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  try {
    const list = await db
      .select({ expenseNumber: expenses.expenseNumber })
      .from(expenses)
      .orderBy(desc(expenses.id));

    let maxNum = 0;
    for (const item of list) {
      const match = item.expenseNumber.match(/EXP-\d{4}-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextSeq = String(maxNum + 1).padStart(4, "0");
    return `EXP-${currentYear}-${nextSeq}`;
  } catch {
    return `EXP-${currentYear}-0001`;
  }
}

export interface FinanceFormDataOptions {
  rentalOrders: RentalOrder[];
  customers: Customer[];
  generators: Generator[];
}

export async function getFinanceFormDataOptions(): Promise<FinanceFormDataOptions> {
  try {
    const [orders, custList, genList] = await Promise.all([
      db.select().from(rentalOrders).orderBy(desc(rentalOrders.id)),
      db.select().from(customers).orderBy(customers.companyName),
      db.select().from(generators).orderBy(generators.name),
    ]);

    return {
      rentalOrders: orders,
      customers: custList,
      generators: genList,
    };
  } catch (err) {
    console.error("Failed to load finance form options:", err);
    return {
      rentalOrders: [],
      customers: [],
      generators: [],
    };
  }
}

export async function createInvoice(
  data: CreateInvoiceInput
): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    if (!data.customerName?.trim()) {
      return { success: false, error: "Customer Name is required" };
    }
    if (!data.issueDate?.trim()) {
      return { success: false, error: "Issue Date is required" };
    }
    if (!data.dueDate?.trim()) {
      return { success: false, error: "Due Date is required" };
    }

    const invoiceNumber = await getNextInvoiceNumber();
    const subtotal = Math.max(0, parseFloat(String(data.subtotal || 0)));
    const gstAmount = Math.max(0, parseFloat(String(data.gstAmount || 0)));
    const transportCharges = Math.max(0, parseFloat(String(data.transportCharges || 0)));
    const additionalCharges = Math.max(0, parseFloat(String(data.additionalCharges || 0)));
    const totalAmount = Math.max(0, parseFloat(String(data.totalAmount || (subtotal + gstAmount + transportCharges + additionalCharges))));
    const paidAmount = Math.max(0, parseFloat(String(data.paidAmount || 0)));
    const balanceAmount = Math.max(0, totalAmount - paidAmount);

    let status = data.status || "Pending";
    if (balanceAmount <= 0) {
      status = "Paid";
    } else if (paidAmount > 0) {
      status = "Partially Paid";
    }

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        orderId: data.orderId || null,
        orderNumber: data.orderNumber || null,
        customerId: data.customerId || null,
        customerName: data.customerName.trim(),
        customerGst: data.customerGst?.trim() || null,
        issueDate: data.issueDate.trim(),
        dueDate: data.dueDate.trim(),
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        transportCharges: transportCharges.toFixed(2),
        additionalCharges: additionalCharges.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        balanceAmount: balanceAmount.toFixed(2),
        status,
        paymentTerms: data.paymentTerms?.trim() || "Net 30",
        notes: data.notes?.trim() || null,
      })
      .returning();

    // If there is an outstanding balance, increment customer outstanding amount
    if (data.customerId && balanceAmount > 0) {
      try {
        const [cust] = await db
          .select({ outstandingAmount: customers.outstandingAmount })
          .from(customers)
          .where(eq(customers.id, data.customerId));
        if (cust) {
          const currentOut = parseFloat(cust.outstandingAmount || "0") || 0;
          await db
            .update(customers)
            .set({
              outstandingAmount: (currentOut + balanceAmount).toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(customers.id, data.customerId));
        }
      } catch (custErr) {
        console.error("Failed to update customer outstanding amount:", custErr);
      }
    }

    revalidatePath("/finance");
    revalidatePath("/customers");
    revalidatePath("/");

    return { success: true, data: newInvoice };
  } catch (error) {
    console.error("Failed to create invoice in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create invoice",
    };
  }
}

export async function recordPayment(
  data: RecordPaymentInput
): Promise<{ success: boolean; data?: Payment; error?: string }> {
  try {
    const amount = Math.max(0, parseFloat(String(data.amount || 0)));
    if (amount <= 0) {
      return { success: false, error: "Payment amount must be greater than zero." };
    }
    if (!data.customerName?.trim()) {
      return { success: false, error: "Customer Name is required." };
    }
    if (!data.paymentDate?.trim()) {
      return { success: false, error: "Payment Date is required." };
    }

    const paymentNumber = await getNextPaymentNumber();

    const [newPayment] = await db
      .insert(payments)
      .values({
        paymentNumber,
        invoiceId: data.invoiceId || null,
        invoiceNumber: data.invoiceNumber || null,
        customerId: data.customerId || null,
        customerName: data.customerName.trim(),
        amount: amount.toFixed(2),
        paymentDate: data.paymentDate.trim(),
        paymentMethod: data.paymentMethod || "NEFT / RTGS",
        referenceNumber: data.referenceNumber?.trim() || null,
        status: "Completed",
        notes: data.notes?.trim() || null,
      })
      .returning();

    // If linked to an invoice, adjust invoice paid & balance amount
    if (data.invoiceId) {
      try {
        const [inv] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, data.invoiceId));

        if (inv) {
          const prevPaid = parseFloat(inv.paidAmount) || 0;
          const total = parseFloat(inv.totalAmount) || 0;
          const newPaid = Math.min(total, prevPaid + amount);
          const newBalance = Math.max(0, total - newPaid);
          const newStatus = newBalance <= 0 ? "Paid" : "Partially Paid";

          await db
            .update(invoices)
            .set({
              paidAmount: newPaid.toFixed(2),
              balanceAmount: newBalance.toFixed(2),
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, data.invoiceId));
        }
      } catch (invErr) {
        console.error("Failed to update invoice payment amounts:", invErr);
      }
    }

    // Decrement customer's outstanding balance
    if (data.customerId) {
      try {
        const [cust] = await db
          .select({ outstandingAmount: customers.outstandingAmount })
          .from(customers)
          .where(eq(customers.id, data.customerId));

        if (cust) {
          const currentOut = parseFloat(cust.outstandingAmount || "0") || 0;
          const updatedOut = Math.max(0, currentOut - amount);
          await db
            .update(customers)
            .set({
              outstandingAmount: updatedOut.toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(customers.id, data.customerId));
        }
      } catch (custErr) {
        console.error("Failed to reduce customer outstanding amount:", custErr);
      }
    }

    revalidatePath("/finance");
    revalidatePath("/customers");
    revalidatePath("/");

    return { success: true, data: newPayment };
  } catch (error) {
    console.error("Failed to record payment in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to record payment",
    };
  }
}

export async function createExpense(
  data: CreateExpenseInput
): Promise<{ success: boolean; data?: Expense; error?: string }> {
  try {
    const amount = Math.max(0, parseFloat(String(data.amount || 0)));
    if (amount <= 0) {
      return { success: false, error: "Expense amount must be greater than zero." };
    }
    if (!data.description?.trim()) {
      return { success: false, error: "Description is required." };
    }
    if (!data.category?.trim()) {
      return { success: false, error: "Category is required." };
    }

    const expenseNumber = await getNextExpenseNumber();

    const [newExpense] = await db
      .insert(expenses)
      .values({
        expenseNumber,
        category: data.category.trim(),
        description: data.description.trim(),
        generatorId: data.generatorId || null,
        generatorName: data.generatorName?.trim() || null,
        amount: amount.toFixed(2),
        expenseDate: data.expenseDate?.trim() || new Date().toISOString().split("T")[0],
        vendor: data.vendor?.trim() || null,
        paymentMethod: data.paymentMethod?.trim() || "Bank Transfer",
        status: data.status || "Paid",
        notes: data.notes?.trim() || null,
      })
      .returning();

    revalidatePath("/finance");
    revalidatePath("/");

    return { success: true, data: newExpense };
  } catch (error) {
    console.error("Failed to create expense in DB:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to create expense",
    };
  }
}

export async function deleteInvoice(
  id: number
): Promise<{ success: boolean; data?: { id: number }; error?: string }> {
  try {
    await db.delete(invoices).where(eq(invoices.id, id));
    revalidatePath("/finance");
    revalidatePath("/customers");
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to delete invoice",
    };
  }
}

export async function deletePayment(
  id: number
): Promise<{ success: boolean; data?: { id: number }; error?: string }> {
  try {
    await db.delete(payments).where(eq(payments.id, id));
    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to delete payment",
    };
  }
}

export async function deleteExpense(
  id: number
): Promise<{ success: boolean; data?: { id: number }; error?: string }> {
  try {
    await db.delete(expenses).where(eq(expenses.id, id));
    revalidatePath("/finance");
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to delete expense",
    };
  }
}
