"use client";

import React from "react";
import { Invoice } from "@/lib/db/schema";
import {
  FileText,
  Printer,
  CreditCard,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";

import { formatINR, formatDate } from "@/lib/utils";
export { formatINR, formatDate };

interface InvoicesTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onDeleteInvoice: (invoice: Invoice) => void;
  onOpenCreateModal: () => void;
}

export function InvoicesTable({
  invoices,
  onViewInvoice,
  onRecordPayment,
  onDeleteInvoice,
  onOpenCreateModal,
}: InvoicesTableProps) {
  const today = new Date().toISOString().split("T")[0];

  const getStatusBadge = (inv: Invoice) => {
    const balance = parseFloat(inv.balanceAmount) || 0;
    const isOverdue = balance > 0 && inv.dueDate && inv.dueDate < today;

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shrink-0">
          <AlertCircle className="w-3.5 h-3.5 stroke-[2.2]" />
          Overdue
        </span>
      );
    }

    const s = inv.status.toLowerCase();
    if (s === "paid" || balance <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
          Paid
        </span>
      );
    }

    if (s === "partially paid" || (parseFloat(inv.paidAmount) > 0 && balance > 0)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
          Partially Paid
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        Pending
      </span>
    );
  };

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-14 h-14 bg-blue-50 text-[#083a60] border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No invoices found
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No invoices match your search or filter. Create a new invoice from an active rental order.
        </p>
        <button
          onClick={onOpenCreateModal}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Invoice</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-[#fbfcfd]/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider h-12">
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Invoice #</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Customer</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Order Ref</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Issue Date</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Due Date</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Total Amount</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Paid</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Balance</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-center">Status</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const balance = parseFloat(inv.balanceAmount) || 0;
              const hasBalance = balance > 0;
              const isOverdue = hasBalance && inv.dueDate && inv.dueDate < today;

              return (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Invoice # */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="text-[#083a60] hover:text-[#0c4a7e] hover:underline flex items-center gap-1.5 text-left cursor-pointer font-bold"
                    >
                      <FileText className="w-4 h-4 text-[#083a60]/70 shrink-0" />
                      <span>{inv.invoiceNumber}</span>
                    </button>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{inv.customerName}</div>
                    {inv.customerGst && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        GST: {inv.customerGst}
                      </div>
                    )}
                  </td>

                  {/* Order Ref */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {inv.orderNumber ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 font-mono">
                        {inv.orderNumber}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">—</span>
                    )}
                  </td>

                  {/* Issue Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    {formatDate(inv.issueDate)}
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={
                        isOverdue
                          ? "text-rose-600 font-semibold"
                          : "text-slate-600"
                      }
                    >
                      {formatDate(inv.dueDate)}
                    </span>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-semibold text-slate-900">
                    {formatINR(inv.totalAmount)}
                  </td>

                  {/* Paid */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right text-emerald-700 font-medium">
                    {formatINR(inv.paidAmount)}
                  </td>

                  {/* Balance */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold">
                    <span className={hasBalance ? "text-rose-600" : "text-slate-500"}>
                      {formatINR(inv.balanceAmount)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    {getStatusBadge(inv)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View & Print */}
                      <button
                        onClick={() => onViewInvoice(inv)}
                        title="View & Print Tax Invoice"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#083a60] hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Collect Payment */}
                      {hasBalance && (
                        <button
                          onClick={() => onRecordPayment(inv)}
                          title="Record Payment"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay</span>
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteInvoice(inv)}
                        title="Delete Invoice"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
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
