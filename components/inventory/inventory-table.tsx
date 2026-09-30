"use client";

import React from "react";
import { InventoryItem } from "@/lib/db/schema";
import {
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  Plus,
} from "lucide-react";

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onOpenAddModal: () => void;
}

export function formatIndianCurrency(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "₹0";
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}

export function InventoryTable({
  items,
  onEdit,
  onDelete,
  onOpenAddModal,
}: InventoryTableProps) {
  const getStatusBadge = (status: string, qty: number, reorder: number) => {
    const s = (status || "").toLowerCase();
    const isOut = s === "out of stock" || qty <= 0;
    const isLow = s === "low stock" || (!isOut && qty <= reorder);

    if (isOut) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Out of Stock
        </span>
      );
    }
    if (isLow) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        In Stock
      </span>
    );
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-14 h-14 bg-blue-50 text-[#083a60] border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No inventory parts found
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No parts match your search criteria. Try a different filter or register a new spare part into stock.
        </p>
        <button
          onClick={onOpenAddModal}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Part</span>
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
              <th className="py-3 px-4 whitespace-nowrap shrink-0" title="Part Number">Part No.</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0" title="Part Name">Part Name</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0" title="Model / Specification">Model</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0" title="Category">Category</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0" title="Compatible Generator">Compatible Generator</th>
              <th className="py-3 px-4 text-center whitespace-nowrap shrink-0" title="Quantity Available">Qty Available</th>
              <th className="py-3 px-4 text-center whitespace-nowrap shrink-0" title="Reorder Level">Reorder Level</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0" title="Unit Cost in Rupees">Unit Cost (₹)</th>
              <th className="py-3 px-4 whitespace-nowrap shrink-0" title="Stock Status">Status</th>
              <th className="py-3 px-4 text-right whitespace-nowrap shrink-0">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const qty = Number(item.qtyAvailable) || 0;
              const reorder = Number(item.reorderLevel) || 0;
              const isLow = qty <= reorder && qty > 0;
              const isOut = qty <= 0;

              return (
                <tr
                  key={item.id}
                  className="h-14 hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Part No. (single line) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-xs text-[#083a60] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap shadow-2xs">
                      {item.partNumber}
                    </span>
                  </td>

                  {/* Part Name (single line with character limit / truncation & tooltip) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div
                      className="font-bold text-slate-900 whitespace-nowrap truncate max-w-[170px] xl:max-w-[220px]"
                      title={item.notes ? `${item.partName} — ${item.notes}` : item.partName}
                    >
                      {item.partName}
                    </div>
                  </td>

                  {/* Model (single line with character limit / truncation & tooltip) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.model ? (
                      <span
                        className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md whitespace-nowrap truncate max-w-[120px] inline-block align-middle"
                        title={item.model}
                      >
                        {item.model}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-mono">—</span>
                    )}
                  </td>

                  {/* Category (single line with character limit / truncation & tooltip) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60 whitespace-nowrap truncate max-w-[120px]"
                      title={item.category}
                    >
                      {item.category}
                    </span>
                  </td>

                  {/* Compatible Generator (single line with character limit / truncation & tooltip) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium text-slate-800 whitespace-nowrap truncate max-w-[160px] xl:max-w-[200px]"
                      title={item.compatibleGenerator}
                    >
                      {item.compatibleGenerator}
                    </div>
                  </td>

                  {/* Qty Available (single line) */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <span
                        className={`text-sm font-bold ${
                          isOut
                            ? "text-rose-600"
                            : isLow
                            ? "text-amber-600"
                            : "text-slate-900"
                        }`}
                      >
                        {qty.toLocaleString()}
                      </span>
                      {isLow && (
                        <span
                          title={`Low Stock: below reorder level (${reorder})`}
                          className="text-amber-500 inline-block shrink-0"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Reorder Level (single line) */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                      {reorder.toLocaleString()}
                    </span>
                  </td>

                  {/* Unit Cost (₹) (single line) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formatIndianCurrency(item.unitCost)}
                    </span>
                  </td>

                  {/* Status (single line) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(item.status, qty, reorder)}
                  </td>

                  {/* Actions (single line) */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title="Edit part details"
                        aria-label={`Edit ${item.partName}`}
                      >
                        <Pencil className="w-4 h-4 stroke-[1.75]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Delete part"
                        aria-label={`Delete ${item.partName}`}
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

      {/* Table Footer */}
      <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs font-medium text-slate-500 flex items-center justify-between">
        <span>
          Showing {items.length} item{items.length === 1 ? "" : "s"}
        </span>
        <span className="text-[11px] text-slate-400">
          PTP Connect Inventory Management
        </span>
      </div>
    </div>
  );
}
