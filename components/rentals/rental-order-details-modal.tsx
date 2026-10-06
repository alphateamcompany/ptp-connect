"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Pencil,
  CheckCircle2,
  Trash2,
  Fuel,
  UserCheck,
  Zap,
  Building2,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { RentalOrder } from "@/lib/db/schema";

interface RentalOrderDetailsModalProps {
  order: RentalOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkCompleted: (id: number) => Promise<void>;
  onDeleteClick: (order: RentalOrder) => void;
  onEditClick?: (order: RentalOrder) => void;
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

function getRateLabel(rentalType?: string | null): string {
  const type = rentalType?.trim().toLowerCase();
  if (type === "monthly") return "Monthly Rate";
  if (type === "weekly") return "Weekly Rate";
  return "Daily Rate";
}

function getRateUnit(rentalType?: string | null): string {
  const type = rentalType?.trim().toLowerCase();
  if (type === "monthly") return "month";
  if (type === "weekly") return "week";
  return "day";
}

export function RentalOrderDetailsModal({
  order,
  isOpen,
  onClose,
  onMarkCompleted,
  onDeleteClick,
  onEditClick,
}: RentalOrderDetailsModalProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  if (!isOpen || !order) return null;

  const isActive = order.status?.toLowerCase() === "active";
  const isCompleted = order.status?.toLowerCase() === "completed";

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await onMarkCompleted(order.id);
      onClose();
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCompleting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rental-details-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto p-6 sm:p-8 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#083a60] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg">
              {order.orderNumber}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                  : "bg-sky-50 text-sky-700 border-sky-200/70"
              }`}
            >
              {isCompleted ? "Completed" : "Active"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Print Order Details"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            {onEditClick && (
              <button
                onClick={() => {
                  onClose();
                  onEditClick(order);
                }}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Edit Order"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-5 space-y-6">
          {/* Order Title */}
          <div>
            <h2
              id="rental-details-title"
              className="text-xl font-bold text-slate-900 tracking-tight"
            >
              Rental Agreement Details
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Created on {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </p>
          </div>

          {/* Primary Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer</span>
              </div>
              <div className="font-bold text-slate-900 text-base">
                {order.customerName}
              </div>
              {order.customerId && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Customer ID: #{order.customerId}
                </div>
              )}
            </div>

            {/* Generator Box */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Generator</span>
              </div>
              <div className="font-bold text-slate-900 text-base">
                {order.generatorName}
              </div>
              {order.generatorId && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Generator ID: #{order.generatorId}
                </div>
              )}
            </div>
          </div>

          {/* Rental Details Grid */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Terms & Schedule
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Start Date</span>
                <span className="font-bold text-slate-800 text-sm">
                  {formatDate(order.startDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">End Date</span>
                <span className="font-bold text-slate-800 text-sm">
                  {formatDate(order.endDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Billing Type</span>
                <span className="inline-block px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  {order.rentalType || "Monthly"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">
                  {getRateLabel(order.rentalType)}
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatINR(order.dailyRate)}/{getRateUnit(order.rentalType)}
                </span>
              </div>
            </div>

            {/* Inclusions */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium mr-1">
                Inclusions:
              </span>
              {order.dieselIncluded ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  Diesel Included
                </span>
              ) : null}
              {order.operatorIncluded ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  Operator Included
                </span>
              ) : null}
              {!order.dieselIncluded && !order.operatorIncluded && (
                <span className="text-xs text-slate-400 italic">
                  Standard rental (no additional inclusions)
                </span>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Financial Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Rental Charge</span>
                <span className="font-semibold text-slate-900">
                  {formatINR(order.rentalCharge)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>GST (18%)</span>
                <span className="font-semibold text-slate-900">
                  {formatINR(order.gstAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Transport Charges</span>
                <span className="font-semibold text-slate-900">
                  {formatINR(order.transportCharges)}
                </span>
              </div>
              {Number(order.securityDeposit) > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Security Deposit
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(order.securityDeposit)}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">
                  Grand Total
                </span>
                <span className="font-extrabold text-[#083a60] text-xl">
                  {formatINR(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteClick(order);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/80 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Order</span>
          </button>

          <div className="flex items-center gap-2">
            {isActive && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isCompleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Completed</span>
                  </>
                )}
              </button>
            )}
            {onEditClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditClick(order);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Order</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
