"use client";

import React from "react";
import { Expense } from "@/lib/db/schema";
import {
  TrendingDown,
  Trash2,
  Cpu,
  Fuel,
  Wrench,
  Truck,
  Package,
  UserCheck,
  Plus,
} from "lucide-react";
import { formatINR, formatDate } from "./invoices-table";

interface ExpensesTableProps {
  expenses: Expense[];
  onDeleteExpense: (expense: Expense) => void;
  onOpenLogModal: () => void;
}

export function ExpensesTable({
  expenses,
  onDeleteExpense,
  onOpenLogModal,
}: ExpensesTableProps) {
  const getCategoryBadge = (category: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("diesel") || c.includes("fuel")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Fuel className="w-3.5 h-3.5 text-amber-600" />
          {category}
        </span>
      );
    }
    if (c.includes("maintenance") || c.includes("repair")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          {category}
        </span>
      );
    }
    if (c.includes("transport") || c.includes("crane")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
          <Truck className="w-3.5 h-3.5 text-cyan-600" />
          {category}
        </span>
      );
    }
    if (c.includes("spare") || c.includes("part")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-200">
          <Package className="w-3.5 h-3.5 text-violet-600" />
          {category}
        </span>
      );
    }
    if (c.includes("wage") || c.includes("operator")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          {category}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
        {category}
      </span>
    );
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-14 h-14 bg-rose-50 text-rose-700 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingDown className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No operational expenses logged
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No expenses match your search. Log generator fuel, maintenance, transport, or operator expenses.
        </p>
        <button
          onClick={onOpenLogModal}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Log Expense</span>
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
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Expense #</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Date</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Category</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Description</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Generator</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Vendor / Payee</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0">Mode</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Amount (₹)</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((exp) => (
              <tr
                key={exp.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Expense # */}
                <td className="py-3.5 px-4 whitespace-nowrap font-semibold">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {exp.expenseNumber}
                  </span>
                </td>

                {/* Date */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                  {formatDate(exp.expenseDate)}
                </td>

                {/* Category */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {getCategoryBadge(exp.category)}
                </td>

                {/* Description */}
                <td className="py-3.5 px-4 text-slate-800 font-medium max-w-xs truncate">
                  {exp.description}
                </td>

                {/* Generator */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {exp.generatorName ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      <Cpu className="w-3 h-3 text-slate-500" />
                      {exp.generatorName}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">General Fleet</span>
                  )}
                </td>

                {/* Vendor / Payee */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                  {exp.vendor || "—"}
                </td>

                {/* Payment Mode */}
                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                  {exp.paymentMethod || "Bank Transfer"}
                </td>

                {/* Amount */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-rose-600">
                  -{formatINR(exp.amount)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onDeleteExpense(exp)}
                    title="Delete Expense Record"
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
