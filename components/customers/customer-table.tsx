"use client";

import React from "react";
import { Customer } from "@/lib/db/schema";
import { Printer, Pencil, Trash2 } from "lucide-react";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function formatIndianCurrency(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "₹0";
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Printer className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No customers found
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No customer records match your search criteria. Try a different query or add a new customer.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-[#fbfcfd]/50">
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                COMPANY
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase hidden md:table-cell">
                CONTACT
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase hidden sm:table-cell">
                PHONE
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase hidden lg:table-cell">
                GST
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase text-right">
                OUTSTANDING
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase text-right">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => {
              const outstandingNum = Number(customer.outstandingAmount || 0);
              const isZero = outstandingNum === 0;

              return (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* COMPANY Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#e3ecf5] flex items-center justify-center text-[#255b88] shrink-0 border border-[#d2dfed]">
                        <Printer className="w-5 h-5 stroke-[1.75]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {customer.companyName || customer.customerName}
                        </span>
                        <span className="text-xs text-slate-500 truncate mt-0.5">
                          {customer.email || "No email"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* CONTACT Column */}
                  <td className="py-4 px-6 hidden md:table-cell">
                    <span className="text-sm font-medium text-slate-800">
                      {customer.contactPerson || customer.customerName || "—"}
                    </span>
                  </td>

                  {/* PHONE Column */}
                  <td className="py-4 px-6 hidden sm:table-cell">
                    <span className="text-sm font-medium text-slate-800 whitespace-nowrap">
                      {customer.phone || "—"}
                    </span>
                  </td>

                  {/* GST Column */}
                  <td className="py-4 px-6 hidden lg:table-cell">
                    <span className="text-sm font-medium text-slate-700 tracking-tight">
                      {customer.gstNumber || "—"}
                    </span>
                  </td>

                  {/* OUTSTANDING Column */}
                  <td className="py-4 px-6 text-right">
                    <span
                      className={`text-sm font-bold whitespace-nowrap ${
                        isZero ? "text-emerald-600" : "text-[#e03131]"
                      }`}
                    >
                      {formatIndianCurrency(customer.outstandingAmount)}
                    </span>
                  </td>

                  {/* ACTIONS Column */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit customer"
                        aria-label={`Edit ${customer.companyName}`}
                      >
                        <Pencil className="w-4 h-4 stroke-[1.75]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(customer)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete customer"
                        aria-label={`Delete ${customer.companyName}`}
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.75]" />
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
