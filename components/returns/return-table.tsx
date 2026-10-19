"use client";

import React from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  Gauge,
  Truck,
  RotateCcw,
  ArrowUpDown,
  ChevronDown,
  User,
  Hash,
} from "lucide-react";
import { ReturnRecord } from "@/lib/db/schema";

interface ReturnTableProps {
  returns: ReturnRecord[];
  totalCount: number;
  onDeleteClick: (record: ReturnRecord) => void;
  onViewDetails: (record: ReturnRecord) => void;
  onEditClick: (record: ReturnRecord) => void;
  sortBy?: string;
  onSortChange?: (newSort: string) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function ReturnTable({
  returns,
  totalCount,
  onDeleteClick,
  onViewDetails,
  onEditClick,
  sortBy,
  onSortChange,
}: ReturnTableProps) {
  const handleHeaderSort = (field: "order" | "customer" | "startDate" | "closeDate") => {
    if (!onSortChange) return;
    if (field === "order") {
      onSortChange(sortBy === "order_desc" ? "order_asc" : "order_desc");
    } else if (field === "customer") {
      onSortChange(sortBy === "customer_asc" ? "order_desc" : "customer_asc");
    } else if (field === "startDate") {
      onSortChange(sortBy === "start_desc" ? "start_asc" : "start_desc");
    } else if (field === "closeDate") {
      onSortChange(sortBy === "date_desc" ? "date_asc" : "date_desc");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              {/* Order & Equipment */}
              <th
                onClick={() => handleHeaderSort("order")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Rental Order &amp; Generator</span>
                  {sortBy?.startsWith("order_") ? (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#083a60] transition-transform ${
                        sortBy === "order_asc" ? "rotate-180" : ""
                      }`}
                    />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-60" />
                  )}
                </div>
              </th>

              {/* Customer & Site */}
              <th
                onClick={() => handleHeaderSort("customer")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Customer &amp; Site</span>
                  {sortBy === "customer_asc" ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#083a60]" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-60" />
                  )}
                </div>
              </th>

              {/* Dispatch (Start) */}
              <th
                onClick={() => handleHeaderSort("startDate")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dispatch (Start)</span>
                </div>
              </th>

              {/* Return (Closing) */}
              <th
                onClick={() => handleHeaderSort("closeDate")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Return (Closing)</span>
                </div>
              </th>

              {/* Running Hours */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Run Hours
              </th>

              {/* Status */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Status
              </th>

              {/* Actions */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {returns.map((item) => {
              const runHours =
                item.closingHours && item.startingHours !== undefined && item.startingHours !== null
                  ? Math.max(0, item.closingHours - item.startingHours)
                  : 0;

              const isReturned = Boolean(
                item.closingDate ||
                (item.closingHours && item.closingHours > 0) ||
                item.status === "Returned"
              );

              return (
                <tr
                  key={item.id}
                  onClick={() => onViewDetails(item)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  {/* Order & Generator */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#083a60] border border-blue-100">
                        {item.orderNumber}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 text-sm mt-1">
                      {item.generatorCode}
                    </div>
                    {item.generatorCapacity && (
                      <div className="text-xs text-slate-500 font-normal">
                        {item.generatorCapacity}
                      </div>
                    )}
                  </td>

                  {/* Customer & Site */}
                  <td className="py-3.5 px-4">
                    <div
                      className="font-semibold text-slate-900 text-sm max-w-[200px] truncate"
                      title={item.customerName}
                    >
                      {item.customerName}
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-xs text-slate-500 max-w-[180px] truncate mt-0.5"
                      title={item.siteLocation}
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.siteLocation || "—"}</span>
                    </div>
                  </td>

                  {/* Dispatch (Start): Start Date, Starting Hours, Driver Name, Vehicle Number */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{formatDate(item.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                        <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{(item.startingHours ?? 0).toLocaleString()} hrs</span>
                      </div>
                      {(item.driverName || item.vehicleNumber) && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          {item.driverName && (
                            <span className="flex items-center gap-1" title="Dispatch Driver">
                              <User className="w-3 h-3 text-slate-400" />
                              {item.driverName}
                            </span>
                          )}
                          {item.driverName && item.vehicleNumber && <span>•</span>}
                          {item.vehicleNumber && (
                            <span className="font-mono text-slate-700 font-semibold" title="Dispatch Vehicle">
                              {item.vehicleNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Return (Closing): Closing Date, Closing Hours, Driver Name, Vehicle Number */}
                  <td className="py-3.5 px-4">
                    {isReturned ? (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatDate(item.closingDate || item.returnDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-semibold">
                          <Gauge className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{(item.closingHours || 0).toLocaleString()} hrs</span>
                        </div>
                        {(item.returnDriverName || item.returnVehicleNumber) && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            {item.returnDriverName && (
                              <span className="flex items-center gap-1" title="Return Driver">
                                <User className="w-3 h-3 text-slate-400" />
                                {item.returnDriverName}
                              </span>
                            )}
                            {item.returnDriverName && item.returnVehicleNumber && <span>•</span>}
                            {item.returnVehicleNumber && (
                              <span className="font-mono text-slate-700 font-semibold" title="Return Vehicle">
                                {item.returnVehicleNumber}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg font-medium inline-block">
                        Pending Return
                      </span>
                    )}
                  </td>

                  {/* Run Hours */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isReturned && runHours > 0 ? (
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span>{runHours.toLocaleString()} hrs</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isReturned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <RotateCcw className="w-3 h-3" />
                        Returned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                        <Truck className="w-3 h-3" />
                        In Transit
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(item)}
                        title="View Transport Details"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        aria-label={`View transport ${item.orderNumber}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEditClick(item)}
                        title="Edit Transport Record"
                        className="p-1.5 text-slate-400 hover:text-[#083a60] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        aria-label={`Edit transport ${item.orderNumber}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteClick(item)}
                        title="Delete Record"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        aria-label={`Delete transport ${item.orderNumber}`}
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
            Showing <strong className="text-slate-700">{returns.length}</strong> of{" "}
            <strong className="text-slate-700">{totalCount}</strong> transport records
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          PTP Connect • Generator Transport Logistics
        </span>
      </div>
    </div>
  );
}

export const TransportTable = ReturnTable;
