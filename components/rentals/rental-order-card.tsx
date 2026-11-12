"use client";

import React, { useState } from "react";
import { Trash2, Loader2, Pencil, MapPin, Zap } from "lucide-react";
import { RentalOrder } from "@/lib/db/schema";

interface RentalOrderCardProps {
  order: RentalOrder;
  onMarkCompleted: (id: number) => Promise<void>;
  onDeleteClick: (order: RentalOrder) => void;
  onEditClick: (order: RentalOrder) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Check if already formatted as "DD Mon YYYY"
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

function getRateUnit(rentalType?: string | null): string {
  const type = rentalType?.trim().toLowerCase();
  if (type === "monthly") return "month";
  if (type === "weekly") return "week";
  return "day";
}

export function RentalOrderCard({
  order,
  onMarkCompleted,
  onDeleteClick,
  onEditClick,
}: RentalOrderCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const isActive = order.status?.toLowerCase() === "active";
  const isCompleted = order.status?.toLowerCase() === "completed";

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await onMarkCompleted(order.id);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 p-6 flex flex-col justify-between">
      <div>
        {/* Top Header Row: Order Number & Status Badge */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 tracking-wide">
              {order.orderNumber}
            </span>
            {order.dcNumber && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200" title={`DC: ${order.dcNumber}`}>
                DC: {order.dcNumber}
              </span>
            )}
            {order.ewayBill && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200" title={`E-Way: ${order.ewayBill}`}>
                EWB: {order.ewayBill}
              </span>
            )}
          </div>
          <span
            className={`px-3 py-0.5 rounded-full text-xs font-semibold tracking-tight border ${
              isCompleted
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                : "bg-sky-50 text-sky-700 border-sky-200/70"
            }`}
          >
            {isCompleted ? "Completed" : "Active"}
          </span>
        </div>

        {/* Customer & Generator Info */}
        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
          {order.customerName}
        </h3>
        {order.billingCompany && (
          <p className="text-xs text-slate-500 font-medium mt-0.5 truncate" title={`Billed by ${order.billingCompany}`}>
            Billed by: <span className="font-semibold text-slate-700">{order.billingCompany}</span>
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 mb-3">
          <p className="text-sm font-medium text-slate-600 truncate">
            {order.generatorName}
          </p>
          {order.generatorKva && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
              <Zap className="w-3 h-3 text-amber-600" />
              {order.generatorKva} kVA
            </span>
          )}
        </div>

        {order.siteLocation && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-4 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{order.siteLocation}</span>
          </div>
        )}

        {/* Details 2x2 Grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">Start:</span>
            <span className="font-bold text-slate-900">
              {formatDate(order.startDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">End:</span>
            <span className="font-bold text-slate-900">
              {formatDate(order.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">Type:</span>
            <span className="font-bold text-slate-900">
              {order.rentalType || "Monthly"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">Rate:</span>
            <span className="font-bold text-slate-900">
              {formatINR(order.dailyRate)}/{getRateUnit(order.rentalType)}
            </span>
          </div>
        </div>

        {/* Start / Close Hours */}
        {(order.startHours !== null && order.startHours !== undefined || order.closeHours !== null && order.closeHours !== undefined) && (
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 mb-4 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-sans">Hours:</span>
            <span className="font-semibold text-slate-800">
              {order.startHours ?? "—"} hrs → {order.closeHours ?? "—"} hrs
            </span>
          </div>
        )}

        {/* Inclusions Badges */}
        {(order.dieselIncluded || order.operatorIncluded) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {order.dieselIncluded && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400 text-slate-950">
                Diesel Incl.{order.dieselValue ? ` (${order.dieselValue})` : ""}
              </span>
            )}
            {order.operatorIncluded && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400 text-slate-950">
                Operator Incl.
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100 my-4" />

        {/* Financial Breakdown */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span>Rental Charge</span>
            <span className="font-medium text-slate-900">
              {formatINR(order.rentalCharge)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>GST ({order.gstRate ? `${order.gstRate}%` : "18%"})</span>
            <span className="font-medium text-slate-900">
              {formatINR(order.gstAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Transport</span>
            <span className="font-medium text-slate-900">
              {formatINR(order.transportCharges)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-slate-900 text-base">Total</span>
            <span className="font-bold text-[#083a60] text-lg">
              {formatINR(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Actions / Footer */}
      <div className="mt-6 pt-2">
        {isActive ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Mark Completed</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onEditClick(order)}
              title="Edit Rental Order"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer shrink-0"
              aria-label="Edit Order"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteClick(order)}
              title="Delete Rental Order"
              className="p-2.5 rounded-xl border border-rose-200/80 text-rose-500 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer shrink-0"
              aria-label="Delete Order"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onEditClick(order)}
              title="Edit Rental Order"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              aria-label="Edit Order"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteClick(order)}
              title="Delete Rental Order"
              className="p-2.5 rounded-xl border border-rose-200/80 text-rose-500 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
              aria-label="Delete Order"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
