"use client";

import React from "react";
import { Payment } from "@/lib/db/schema";
import {
  CreditCard,
  Trash2,
  CheckCircle2,
  FileCheck,
  Plus,
} from "lucide-react";
import { formatINR, formatDate } from "./invoices-table";

interface PaymentsTableProps {
  payments: Payment[];
  onDeletePayment: (payment: Payment) => void;
  onOpenRecordModal: () => void;
}

export function PaymentsTable({
  payments,
  onDeletePayment,
  onOpenRecordModal,
}: PaymentsTableProps) {
  const getMethodBadge = (method: string) => {
    const m = (method || "").toLowerCase();
    let bg = "bg-slate-100 text-slate-700 border-slate-200";
    if (m.includes("neft") || m.includes("rtgs") || m.includes("bank")) {
      bg = "bg-indigo-50 text-indigo-700 border-indigo-200";
    } else if (m.includes("upi")) {
      bg = "bg-purple-50 text-purple-700 border-purple-200";
    } else if (m.includes("cheque")) {
      bg = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (m.includes("cash")) {
      bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg} whitespace-nowrap`}
      >
        {method}
      </span>
    );
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No payment transactions logged
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No collections match your search. Record a customer payment against an invoice or custom billing.
        </p>
        <button
          onClick={onOpenRecordModal}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Payment</span>
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
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Receipt #</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Payment Date</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Customer</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Invoice Ref</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Payment Mode</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Reference / UTR</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Amount Received</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-center">Status</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((pay) => (
              <tr
                key={pay.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Receipt # */}
                <td className="py-3.5 px-4 whitespace-nowrap font-semibold">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold font-mono text-xs">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pay.paymentNumber}</span>
                  </div>
                </td>

                {/* Payment Date */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                  {formatDate(pay.paymentDate)}
                </td>

                {/* Customer */}
                <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                  {pay.customerName}
                </td>

                {/* Invoice Ref */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {pay.invoiceNumber ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                      {pay.invoiceNumber}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">—</span>
                  )}
                </td>

                {/* Payment Mode */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {getMethodBadge(pay.paymentMethod)}
                </td>

                {/* Reference Number */}
                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                  {pay.referenceNumber || "—"}
                </td>

                {/* Amount */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-emerald-700">
                  +{formatINR(pay.amount)}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    {pay.status || "Completed"}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onDeletePayment(pay)}
                    title="Delete Payment Record"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
