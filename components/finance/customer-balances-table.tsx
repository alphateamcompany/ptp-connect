"use client";

import React from "react";
import { Customer, Invoice } from "@/lib/db/schema";
import {
  Users,
  CreditCard,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatINR } from "./invoices-table";

interface CustomerBalancesTableProps {
  customers: Customer[];
  invoices: Invoice[];
  searchQuery?: string;
  statusFilter?: string;
  sortBy?: string;
  onOpenCreateInvoice: (customer?: Customer) => void;
  onOpenRecordPayment: (customer?: Customer) => void;
}

export function CustomerBalancesTable({
  customers,
  invoices,
  searchQuery = "",
  statusFilter = "All",
  sortBy = "highest_due",
  onOpenCreateInvoice,
  onOpenRecordPayment,
}: CustomerBalancesTableProps) {
  // Compute totals per customer based on invoices
  const customerRows = React.useMemo(() => {
    let rows = customers.map((cust) => {
      const custInvoices = invoices.filter(
        (inv) =>
          inv.customerId === cust.id ||
          (cust.companyName && inv.customerName.toLowerCase() === cust.companyName.toLowerCase()) ||
          (cust.customerName && inv.customerName.toLowerCase() === cust.customerName.toLowerCase())
      );

      let totalBilled = 0;
      let totalPaid = 0;
      let balance = 0;
      let hasOverdue = false;
      const today = new Date().toISOString().split("T")[0];

      for (const inv of custInvoices) {
        const tot = parseFloat(inv.totalAmount) || 0;
        const pd = parseFloat(inv.paidAmount) || 0;
        const bal = parseFloat(inv.balanceAmount) || 0;
        totalBilled += tot;
        totalPaid += pd;
        balance += bal;

        if (bal > 0 && inv.dueDate && inv.dueDate < today) {
          hasOverdue = true;
        }
      }

      // If customer has explicit outstanding amount in customer profile and no invoices found
      if (custInvoices.length === 0 && cust.outstandingAmount) {
        balance = parseFloat(cust.outstandingAmount) || 0;
        totalBilled = balance;
      }

      return {
        customer: cust,
        invoicesCount: custInvoices.length,
        totalBilled,
        totalPaid,
        balance,
        hasOverdue,
      };
    });

    // Search filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      rows = rows.filter((r) => {
        const c = r.customer;
        return (
          (c.companyName && c.companyName.toLowerCase().includes(q)) ||
          (c.customerName && c.customerName.toLowerCase().includes(q)) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
          (c.gstNumber && c.gstNumber.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q))
        );
      });
    }

    // Status filter
    if (statusFilter === "Has Due") {
      rows = rows.filter((r) => r.balance > 0);
    } else if (statusFilter === "Overdue") {
      rows = rows.filter((r) => r.hasOverdue);
    } else if (statusFilter === "Clear") {
      rows = rows.filter((r) => r.balance <= 0);
    }

    // Sorting
    if (sortBy === "highest_due") {
      rows.sort((a, b) => b.balance - a.balance);
    } else if (sortBy === "most_billed") {
      rows.sort((a, b) => b.totalBilled - a.totalBilled);
    } else if (sortBy === "name_asc") {
      rows.sort((a, b) =>
        (a.customer.companyName || a.customer.customerName).localeCompare(
          b.customer.companyName || b.customer.customerName
        )
      );
    } else if (sortBy === "name_desc") {
      rows.sort((a, b) =>
        (b.customer.companyName || b.customer.customerName).localeCompare(
          a.customer.companyName || a.customer.customerName
        )
      );
    }

    return rows;
  }, [customers, invoices, searchQuery, statusFilter, sortBy]);

  if (customerRows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-14 h-14 bg-blue-50 text-[#083a60] border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No customer accounts found
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Customer balances and accounts receivable will show here as rentals and invoices are generated.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-[#fbfcfd]/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider h-12">
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Company / Customer</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">GST Number</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Payment Terms</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-center">Invoices</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Total Invoiced</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Total Paid</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Outstanding Due</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-center">Status</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customerRows.map((row) => {
              const { customer, invoicesCount, totalBilled, totalPaid, balance, hasOverdue } = row;
              const hasBalance = balance > 0;

              return (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Company */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">
                      {customer.companyName || customer.customerName}
                    </div>
                    {customer.contactPerson && (
                      <div className="text-xs text-slate-500">
                        {customer.contactPerson} {customer.phone ? `(${customer.phone})` : ""}
                      </div>
                    )}
                  </td>

                  {/* GST */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                    {customer.gstNumber || "—"}
                  </td>

                  {/* Payment Terms */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {customer.paymentTerms || "Cash"}
                    </span>
                  </td>

                  {/* Invoices Count */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono text-xs text-slate-600">
                    {invoicesCount}
                  </td>

                  {/* Total Invoiced */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-medium text-slate-900">
                    {formatINR(totalBilled)}
                  </td>

                  {/* Total Paid */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right text-emerald-700 font-medium">
                    {formatINR(totalPaid)}
                  </td>

                  {/* Outstanding Balance */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold">
                    <span className={hasBalance ? "text-rose-600" : "text-emerald-700"}>
                      {formatINR(balance)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    {hasOverdue ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Overdue
                      </span>
                    ) : hasBalance ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Due
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        All Clear
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {hasBalance && (
                        <button
                          onClick={() => onOpenRecordPayment(customer)}
                          title="Record payment from this customer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                      )}
                      <button
                        onClick={() => onOpenCreateInvoice(customer)}
                        title="Create new invoice for this customer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
