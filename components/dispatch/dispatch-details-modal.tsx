"use client";

import React from "react";
import {
  X,
  Printer,
  Trash2,
  Truck,
  Building2,
  Zap,
  Calendar,
  Clock,
  User,
  Fuel,
  Gauge,
  FileText,
} from "lucide-react";
import { Dispatch } from "@/lib/db/schema";

interface DispatchDetailsModalProps {
  dispatch: Dispatch | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteClick: (dispatch: Dispatch) => void;
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

export function DispatchDetailsModal({
  dispatch,
  isOpen,
  onClose,
  onDeleteClick,
}: DispatchDetailsModalProps) {
  if (!isOpen || !dispatch) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispatch-details-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto p-6 sm:p-8 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#083a60] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg">
              {dispatch.orderNumber}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>Dispatched</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Print Dispatch Pass"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Pass</span>
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
              id="dispatch-details-title"
              className="text-xl font-bold text-slate-900 tracking-tight"
            >
              Dispatch Gate Pass Details
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Logged on{" "}
              {dispatch.createdAt
                ? new Date(dispatch.createdAt).toLocaleDateString("en-IN", {
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
                <span>Customer</span>
              </div>
              <div className="font-bold text-slate-900 text-base">
                {dispatch.customerName}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Rental Order: {dispatch.orderNumber}
              </div>
            </div>

            {/* Generator Box */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Generator Equipment</span>
              </div>
              <div className="font-bold text-slate-900 text-base">
                {dispatch.generatorName}
              </div>
            </div>
          </div>

          {/* Logistics & Transit Details Grid */}
          <div className="border border-slate-200/80 rounded-xl p-4 bg-white space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Transit & Logistics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Dispatch Date
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {formatDate(dispatch.dispatchDate)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Dispatch Time
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {dispatch.dispatchTime || "—"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-slate-400" /> Vehicle Number
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {dispatch.vehicleNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Driver Name
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {dispatch.driverName}
                </span>
              </div>
            </div>

            {/* Equipment Readings */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50/60 border border-amber-200/60">
                <Fuel className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-slate-500 text-[11px]">Fuel Filled</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {dispatch.fuelFilled ?? 0} Litres
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50/60 border border-blue-200/60">
                <Gauge className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-slate-500 text-[11px]">Engine Hours</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {dispatch.hoursBeforeDispatch ?? 0} Hours
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {dispatch.notes && (
            <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Dispatch Notes / Remarks</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {dispatch.notes}
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
              onDeleteClick(dispatch);
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
