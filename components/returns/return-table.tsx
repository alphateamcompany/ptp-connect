"use client";

import React from "react";
import {
  Eye,
  Trash2,
  Calendar,
  MapPin,
  Gauge,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { ReturnRecord } from "@/lib/db/schema";

interface ReturnTableProps {
  returns: ReturnRecord[];
  totalCount: number;
  onDeleteClick: (record: ReturnRecord) => void;
  onViewDetails: (record: ReturnRecord) => void;
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

export function ReturnTable({
  returns,
  totalCount,
  onDeleteClick,
  onViewDetails,
  sortBy,
  onSortChange,
}: ReturnTableProps) {
  const handleHeaderSort = (
    field: "returnNumber" | "customer" | "date" | "hours"
  ) => {
    if (!onSortChange) return;

    if (field === "returnNumber") {
      onSortChange(sortBy === "return_desc" ? "return_asc" : "return_desc");
    } else if (field === "customer") {
      onSortChange(sortBy === "customer_asc" ? "newest" : "customer_asc");
    } else if (field === "date") {
      onSortChange(sortBy === "date_desc" ? "date_asc" : "date_desc");
    } else if (field === "hours") {
      onSortChange(sortBy === "hours_desc" ? "hours_asc" : "hours_desc");
    }
  };

  const avgHours =
    returns.length > 0
      ? Math.round(
          returns.reduce((acc, r) => acc + (r.closingHours || 0), 0) /
            returns.length
        )
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              {/* Return No. */}
              <th
                onClick={() => handleHeaderSort("returnNumber")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Return No.</span>
                  {sortBy?.startsWith("return_") ? (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#083a60] transition-transform ${
                        sortBy === "return_asc" ? "rotate-180" : ""
                      }`}
                    />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-60" />
                  )}
                </div>
              </th>

              {/* Rental Order */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Rental Order
              </th>

              {/* Generator */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Generator Equipment
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

              {/* Site Location */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">
                Site Location
              </th>

              {/* Return Date */}
              <th
                onClick={() => handleHeaderSort("date")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Return Date</span>
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

              {/* Closing Hours */}
              <th
                onClick={() => handleHeaderSort("hours")}
                className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Closing Hours</span>
                  {sortBy?.startsWith("hours_") ? (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#083a60] transition-transform ${
                        sortBy === "hours_asc" ? "rotate-180" : ""
                      }`}
                    />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-60" />
                  )}
                </div>
              </th>

              {/* Actions */}
              <th className="py-3.5 px-4 font-bold whitespace-nowrap text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {returns.map((item) => (
              <tr
                key={item.id}
                onClick={() => onViewDetails(item)}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                {/* Return No. */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-mono font-semibold text-xs text-[#083a60] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap group-hover:border-blue-200 transition-colors">
                    {item.returnNumber}
                  </span>
                </td>

                {/* Rental Order */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                    {item.orderNumber}
                  </span>
                </td>

                {/* Generator */}
                <td className="py-3.5 px-4">
                  <div
                    className="font-medium text-slate-800 text-sm max-w-[180px] truncate"
                    title={item.generatorCode}
                  >
                    {item.generatorCode}
                  </div>
                  {item.generatorCapacity && (
                    <div className="text-xs text-slate-500 font-normal mt-0.5">
                      {item.generatorCapacity}
                    </div>
                  )}
                </td>

                {/* Customer */}
                <td className="py-3.5 px-4">
                  <div
                    className="font-semibold text-slate-900 text-sm max-w-[200px] truncate"
                    title={item.customerName}
                  >
                    {item.customerName}
                  </div>
                </td>

                {/* Site Location */}
                <td className="py-3.5 px-4">
                  <div
                    className="flex items-center gap-1.5 text-xs text-slate-700 max-w-[180px] truncate"
                    title={item.siteLocation}
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.siteLocation || "—"}</span>
                  </div>
                </td>

                {/* Return Date */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(item.returnDate)}</span>
                  </div>
                </td>

                {/* Closing Hours */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>{(item.closingHours || 0).toLocaleString()} hrs</span>
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
                      onClick={() => onViewDetails(item)}
                      title="View Return Details"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      aria-label={`View return ${item.returnNumber}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteClick(item)}
                      title="Delete Return Record"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      aria-label={`Delete return ${item.returnNumber}`}
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
            Showing <strong className="text-slate-700">{returns.length}</strong> of{" "}
            <strong className="text-slate-700">{totalCount}</strong> records
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Avg Closing Hours:{" "}
            <strong className="text-slate-700 font-bold">
              {avgHours.toLocaleString()} hrs
            </strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          PTP Connect • Generator Fleet Returns
        </span>
      </div>
    </div>
  );
}
