"use client";

import React from "react";
import {
  X,
  Printer,
  Pencil,
  Trash2,
  RotateCcw,
  Building2,
  Zap,
  Calendar,
  MapPin,
  Gauge,
  FileText,
  Truck,
  User,
  Hash,
} from "lucide-react";
import { ReturnRecord } from "@/lib/db/schema";

interface ReturnDetailsModalProps {
  returnRecord: ReturnRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteClick: (record: ReturnRecord) => void;
  onEditClick?: (record: ReturnRecord) => void;
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

export function ReturnDetailsModal({
  returnRecord,
  isOpen,
  onClose,
  onDeleteClick,
  onEditClick,
}: ReturnDetailsModalProps) {
  if (!isOpen || !returnRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const runHours =
    returnRecord.closingHours && returnRecord.startingHours !== undefined && returnRecord.startingHours !== null
      ? Math.max(0, returnRecord.closingHours - returnRecord.startingHours)
      : 0;

  const isReturned = Boolean(
    returnRecord.closingDate ||
    (returnRecord.closingHours && returnRecord.closingHours > 0) ||
    returnRecord.status === "Returned"
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transport-details-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto p-6 sm:p-8 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#083a60] bg-blue-50/70 border border-blue-100 px-3 py-1 rounded-lg">
              {returnRecord.orderNumber}
            </span>
            {isReturned ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Returned</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Dispatched</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEditClick && (
              <button
                onClick={() => {
                  onClose();
                  onEditClick(returnRecord);
                }}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Edit Record"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Print Transport Slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>
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
          {/* Title */}
          <div>
            <h2
              id="transport-details-title"
              className="text-xl font-bold text-slate-900 tracking-tight"
            >
              Equipment Transport &amp; Handover Record
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Logged on{" "}
              {returnRecord.createdAt
                ? new Date(returnRecord.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>

          {/* Customer & Generator Info Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer Details</span>
              </div>
              <div className="font-bold text-slate-900 text-base">
                {returnRecord.customerName}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{returnRecord.siteLocation}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Order Ref: {returnRecord.orderNumber}
              </div>
            </div>

            {/* Generator Box */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Generator Equipment</span>
              </div>
              <div className="font-bold text-slate-900 text-base">
                {returnRecord.generatorCode}
              </div>
              {returnRecord.generatorCapacity && (
                <div className="text-xs font-medium text-slate-500 mt-1">
                  Capacity: {returnRecord.generatorCapacity}
                </div>
              )}
            </div>
          </div>

          {/* Outward Journey (Dispatch / Start) */}
          <div className="border border-blue-200/70 rounded-2xl p-4.5 bg-blue-50/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#083a60] uppercase tracking-wider">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Dispatch / Outward Journey (Start)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Start Date
                </span>
                <span className="font-semibold text-slate-800 text-sm">
                  {formatDate(returnRecord.startDate)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-slate-400" /> Starting Hours
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {(returnRecord.startingHours ?? 0).toLocaleString()} hrs
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Driver Name
                </span>
                <span className="font-medium text-slate-800 text-sm">
                  {returnRecord.driverName || "—"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" /> Vehicle No.
                </span>
                <span className="font-mono font-semibold text-slate-900 text-sm">
                  {returnRecord.vehicleNumber || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Inward Journey (Return / Closing) */}
          <div className="border border-emerald-200/70 rounded-2xl p-4.5 bg-emerald-50/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Return / Inward Journey (Closing)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Closing Date
                </span>
                <span className="font-semibold text-slate-800 text-sm">
                  {formatDate(returnRecord.closingDate || returnRecord.returnDate)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-slate-400" /> Closing Hours
                </span>
                <span className="font-mono font-bold text-emerald-900 text-sm">
                  {(returnRecord.closingHours || 0).toLocaleString()} hrs
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Driver Name
                </span>
                <span className="font-medium text-slate-800 text-sm">
                  {returnRecord.returnDriverName || "—"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" /> Vehicle No.
                </span>
                <span className="font-mono font-semibold text-slate-900 text-sm">
                  {returnRecord.returnVehicleNumber || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Utilization summary */}
          {runHours > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Total Running Hours on Site:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {runHours.toLocaleString()} hrs
              </span>
            </div>
          )}

          {/* Notes Section */}
          {returnRecord.notes && (
            <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Transport &amp; Handover Remarks</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {returnRecord.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteClick(returnRecord);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200/80 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Record</span>
          </button>

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
  );
}

export const TransportDetailsModal = ReturnDetailsModal;
