"use client";

import React from "react";
import {
  Eye,
  Trash2,
  Calendar,
  Truck,
  Fuel,
  Gauge,
  User,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { Dispatch } from "@/lib/db/schema";

interface DispatchTableProps {
  dispatches: Dispatch[];
  totalCount: number;
  onDeleteClick: (dispatch: Dispatch) => void;
  onViewDetails: (dispatch: Dispatch) => void;
  sortBy?: string;
  onSortChange?: (newSort: string) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/");
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
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  }
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

export function DispatchTable({
  dispatches,
  totalCount,
  onDeleteClick,
  onViewDetails,
  sortBy,
  onSortChange,
}: DispatchTableProps) {
  const handleHeaderSort = (field: "order" | "customer" | "date") => {
    if (!onSortChange) return;

    if (field === "order") {
      onSortChange(sortBy === "order_asc" ? "order_desc" : "order_asc");
    } else if (field === "customer") {
      onSortChange(sortBy === "customer_asc" ? "newest" : "customer_asc");
    } else if (field === "date") {
      onSortChange(sortBy === "date_desc" ? "date_asc" : "date_desc");
    }
  };

  const totalFuel = dispatches.reduce(
    (acc, d) => acc + (Number(d.fuelFilled) || 0),
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

              {/* Generator */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Generator Equipment
              </th>

              {/* Dispatch Date & Time */}
              <th
                onClick={() => handleHeaderSort("date")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Dispatch Date & Time</span>
                  {sortBy?.startsWith("date_") ? (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#083a60] transition-transform ${
                        sortBy === "date_asc" ? "rotate-180" : ""
                      }`}
                    />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-60" />
                  )}
                </div>
              </th>

              {/* Vehicle */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Vehicle
              </th>

              {/* Driver */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Driver
              </th>

              {/* Fuel Filled */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Fuel Filled
              </th>

              {/* Initial Hours */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Initial Hours
              </th>

              {/* Actions */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {dispatches.map((dispatch) => (
              <tr
                key={dispatch.id}
                onClick={() => onViewDetails(dispatch)}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                {/* Order # */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-mono font-semibold text-xs text-[#083a60] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap group-hover:border-blue-200 transition-colors">
                    {dispatch.orderNumber}
                  </span>
                </td>

                {/* Customer */}
                <td className="py-3.5 px-4">
                  <div
                    className="font-semibold text-slate-900 text-sm max-w-[200px] truncate"
                    title={dispatch.customerName}
                  >
                    {dispatch.customerName}
                  </div>
                </td>

                {/* Generator */}
                <td className="py-3.5 px-4">
                  <div
                    className="font-medium text-slate-800 text-sm max-w-[200px] truncate"
                    title={dispatch.generatorName}
                  >
                    {dispatch.generatorName}
                  </div>
                </td>

                {/* Dispatch Date & Time */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(dispatch.dispatchDate)}</span>
                    </div>
                    {dispatch.dispatchTime && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 ml-5">
                        <span>{dispatch.dispatchTime}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Vehicle */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900">
                    <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{dispatch.vehicleNumber}</span>
                  </div>
                </td>

                {/* Driver */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{dispatch.driverName}</span>
                  </div>
                </td>

                {/* Fuel Filled */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
                    <Fuel className="w-3.5 h-3.5 text-amber-600" />
                    <span>{dispatch.fuelFilled ?? 0} L</span>
                  </div>
                </td>

                {/* Initial Hours */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dispatch.hoursBeforeDispatch ?? 0} hrs</span>
                  </div>
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
                      onClick={() => onViewDetails(dispatch)}
                      title="View Dispatch Gate Pass"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      aria-label={`View dispatch for ${dispatch.orderNumber}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteClick(dispatch)}
                      title="Delete Dispatch Record"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      aria-label={`Delete dispatch for ${dispatch.orderNumber}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs font-medium text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-700">{dispatches.length}</strong> of{" "}
            <strong className="text-slate-700">{totalCount}</strong> records
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Total Dispatched Fuel:{" "}
            <strong className="text-amber-800 font-bold">
              {totalFuel} Litres
            </strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          PTP Connect • Warehouse Fleet Dispatch
        </span>
      </div>
    </div>
  );
}
