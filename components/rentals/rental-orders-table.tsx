"use client";

import React, { useState } from "react";
import {
  Eye,
  Pencil,
  CheckCircle2,
  Trash2,
  Loader2,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  Fuel,
  UserCheck,
  MapPin,
  Zap,
} from "lucide-react";
import { RentalOrder } from "@/lib/db/schema";

function extractKva(name?: string | null): string | null {
  if (!name) return null;
  const match = name.match(/(\d+(?:\.\d+)?)\s*kVA/i);
  return match ? match[1] : null;
}

interface RentalOrdersTableProps {
  orders: RentalOrder[];
  totalCount: number;
  onMarkCompleted: (id: number) => Promise<void>;
  onDeleteClick: (order: RentalOrder) => void;
  onViewDetails: (order: RentalOrder) => void;
  onEditClick: (order: RentalOrder) => void;
  sortBy?: string;
  onSortChange?: (newSort: string) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  if (/^\d{2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr)) return dateStr;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatINR(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function getRateUnitShort(rentalType?: string | null): string {
  const type = rentalType?.trim().toLowerCase();
  if (type === "monthly") return "mo";
  if (type === "weekly") return "wk";
  return "day";
}

export function RentalOrdersTable({
  orders,
  totalCount,
  onMarkCompleted,
  onDeleteClick,
  onViewDetails,
  onEditClick,
  sortBy,
  onSortChange,
}: RentalOrdersTableProps) {
  const [completingId, setCompletingId] = useState<number | null>(null);

  const handleComplete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (completingId !== null) return;
    setCompletingId(id);
    try {
      await onMarkCompleted(id);
    } finally {
      setCompletingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, order: RentalOrder) => {
    e.stopPropagation();
    onDeleteClick(order);
  };

  const handleHeaderSort = (field: "order" | "customer" | "total") => {
    if (!onSortChange) return;

    if (field === "order") {
      onSortChange(sortBy === "order_asc" ? "order_desc" : "order_asc");
    } else if (field === "customer") {
      onSortChange(sortBy === "customer_asc" ? "newest" : "customer_asc");
    } else if (field === "total") {
      onSortChange(sortBy === "total_desc" ? "total_asc" : "total_desc");
    }
  };

  const totalValue = orders.reduce(
    (acc, order) => acc + (Number(order.totalAmount) || 0),
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              {/* Order # */}
              <th
                onClick={() => handleHeaderSort("order")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Order #</span>
                  {sortBy?.startsWith("order_") ? (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#083a60] transition-transform ${
                        sortBy === "order_desc" ? "rotate-180" : ""
                      }`}
                    />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-60" />
                  )}
                </div>
              </th>

              {/* Customer */}
              <th
                onClick={() => handleHeaderSort("customer")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Customer</span>
                  {sortBy === "customer_asc" ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#083a60]" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-60" />
                  )}
                </div>
              </th>

              {/* Site */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Site
              </th>

              {/* Generator */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Generator
              </th>

              {/* Rental Period */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Rental Period
              </th>

              {/* Type & Rate */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Type & Rate
              </th>

              {/* Inclusions */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Inclusions
              </th>

              {/* Total Amount */}
              <th
                onClick={() => handleHeaderSort("total")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 text-right group"
              >
                <div className="inline-flex items-center justify-end gap-1.5 w-full">
                  <span>Total Amount</span>
                  {sortBy?.startsWith("total_") ? (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#083a60] transition-transform ${
                        sortBy === "total_asc" ? "rotate-180" : ""
                      }`}
                    />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-60" />
                  )}
                </div>
              </th>

              {/* Status */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap text-center">
                Status
              </th>

              {/* Actions */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const isActive = order.status?.toLowerCase() === "active";
              const isCompleted = order.status?.toLowerCase() === "completed";
              const isThisCompleting = completingId === order.id;

              return (
                <tr
                  key={order.id}
                  onClick={() => onViewDetails(order)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  {/* Order Number */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-xs text-[#083a60] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap group-hover:border-blue-200 transition-colors">
                      {order.orderNumber}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 text-sm max-w-[200px] truncate" title={order.customerName}>
                      {order.customerName}
                    </div>
                    {order.billingCompany && (
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={order.billingCompany}>
                        Billing: {order.billingCompany}
                      </div>
                    )}
                  </td>

                  {/* Site */}
                  <td className="py-3.5 px-4">
                    {order.siteLocation ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 max-w-[180px] truncate" title={order.siteLocation}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{order.siteLocation}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Generator */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800 text-sm max-w-[200px] truncate" title={order.generatorName}>
                      {order.generatorName}
                    </div>
                    {(order.generatorKva || extractKva(order.generatorName)) && (
                      <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                        <Zap className="w-2.5 h-2.5 text-amber-600" />
                        <span>{order.generatorKva || extractKva(order.generatorName)} kVA</span>
                      </div>
                    )}
                  </td>

                  {/* Rental Period */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">
                        {formatDate(order.startDate)} – {formatDate(order.endDate)}
                      </span>
                    </div>
                  </td>

                  {/* Type & Rate */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {order.rentalType || "Monthly"}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {formatINR(order.dailyRate)}/{getRateUnitShort(order.rentalType)}
                      </span>
                    </div>
                  </td>

                  {/* Inclusions */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {order.dieselIncluded || order.operatorIncluded ? (
                      <div className="flex items-center gap-1.5">
                        {order.dieselIncluded && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80"
                            title="Diesel Included"
                          >
                            <Fuel className="w-3 h-3 text-amber-600" />
                            <span>Diesel</span>
                          </span>
                        )}
                        {order.operatorIncluded && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80"
                            title="Operator Included"
                          >
                            <UserCheck className="w-3 h-3 text-amber-600" />
                            <span>Operator</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="font-bold text-[#083a60] text-sm">
                      {formatINR(order.totalAmount)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Rent: {formatINR(order.rentalCharge)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight border ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                          : "bg-sky-50 text-sky-700 border-sky-200/70"
                      }`}
                    >
                      {isCompleted ? "Completed" : "Active"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Mark Completed (only if Active) */}
                      {isActive && (
                        <button
                          type="button"
                          onClick={(e) => handleComplete(e, order.id)}
                          disabled={isThisCompleting}
                          title="Mark Order as Completed"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isThisCompleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span className="hidden sm:inline">Complete</span>
                        </button>
                      )}

                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(order)}
                        title="View Order Details"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        aria-label={`View ${order.orderNumber}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Order */}
                      <button
                        type="button"
                        onClick={() => onEditClick(order)}
                        title="Edit Rental Order"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        aria-label={`Edit ${order.orderNumber}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, order)}
                        title="Delete Order"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        aria-label={`Delete ${order.orderNumber}`}
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

      {/* Table Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs font-medium text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-700">{orders.length}</strong> of{" "}
            <strong className="text-slate-700">{totalCount}</strong> orders
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Total Value:{" "}
            <strong className="text-[#083a60] font-bold">
              {formatINR(totalValue)}
            </strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          PTP Connect • Rental Fleet Management
        </span>
      </div>
    </div>
  );
}
