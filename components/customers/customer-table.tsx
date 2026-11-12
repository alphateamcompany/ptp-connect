"use client";

import React from "react";
import { Customer } from "@/lib/db/schema";
import { Building2, User, Phone, Pencil, Trash2, Eye } from "lucide-react";

interface CustomerTableProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
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
  onView,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400 mb-3">
          <User className="w-6 h-6" />
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
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                GST NUMBER
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                CONTACT PERSON
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                CONTACT PHONE NUMBER
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                ADDITIONAL PERSONS
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-600 uppercase text-right">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => {
              const phoneList = customer.phone
                ? customer.phone
                    .split(/[,;\n]+/)
                    .map((p) => p.trim())
                    .filter(Boolean)
                : [];

              return (
                <tr
                  key={customer.id}
                  onClick={() => onView(customer)}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                >
                  {/* COMPANY Column: Company Name (Title) & Customer Name (Subtitle) */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#e3ecf5] flex items-center justify-center text-[#255b88] shrink-0 border border-[#d2dfed]">
                        <Building2 className="w-5 h-5 stroke-[1.75]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {customer.companyName || customer.customerName}
                        </span>
                        <span className="text-xs text-slate-500 truncate mt-0.5">
                          {customer.customerName || "—"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* GST NUMBER Column */}
                  <td className="py-4 px-6">
                    {customer.gstNumber ? (
                      <span className="text-xs font-semibold text-slate-800 font-mono tracking-wide bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/70 inline-block whitespace-nowrap">
                        {customer.gstNumber}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>

                  {/* CONTACT PERSON Column */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-slate-800">
                        {customer.contactPerson || "—"}
                      </span>
                      {customer.primaryPersonRole && (
                        <span className="text-xs text-slate-500 truncate mt-0.5">
                          {customer.primaryPersonRole}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* CONTACT PHONE NUMBER Column */}
                  <td className="py-4 px-6">
                    {customer.phone ? (
                      <a
                        href={`tel:${customer.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs sm:text-sm font-medium text-slate-700 hover:text-[#083a60] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        title={`Call ${customer.phone}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{customer.phone}</span>
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>

                  {/* ADDITIONAL PERSONS Column (Another Person Details) */}
                  <td className="py-4 px-6">
                    {!customer.additionalPersons ||
                    !Array.isArray(customer.additionalPersons) ||
                    customer.additionalPersons.length === 0 ? (
                      <span className="text-sm text-slate-400">—</span>
                    ) : (
                      <div className="flex flex-col gap-2 min-w-[170px]">
                        {customer.additionalPersons.map((p, pIdx) => (
                          <div key={pIdx} className="flex flex-col text-xs min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-800">
                                {p.name || `Person #${pIdx + 2}`}
                              </span>
                              {p.role && (
                                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded">
                                  {p.role}
                                </span>
                              )}
                            </div>
                            {p.phone && (
                              <a
                                href={`tel:${p.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-slate-600 hover:text-[#083a60] inline-flex items-center gap-1 mt-0.5 transition-colors font-medium"
                                title={`Call ${p.name || "Contact"}: ${p.phone}`}
                              >
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{p.phone}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* ACTIONS Column: View, Edit, Delete */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(customer);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#083a60] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View customer details"
                        aria-label={`View ${customer.companyName}`}
                      >
                        <Eye className="w-4 h-4 stroke-[1.75]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(customer);
                        }}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit customer"
                        aria-label={`Edit ${customer.companyName}`}
                      >
                        <Pencil className="w-4 h-4 stroke-[1.75]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(customer);
                        }}
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
