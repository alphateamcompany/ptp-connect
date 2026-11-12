"use client";

import React, { useEffect } from "react";
import {
  X,
  Trash2,
  Wrench,
  Calendar,
  User,
  Gauge,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { MaintenanceRecord, Generator } from "@/lib/db/schema";

interface MaintenanceDetailsModalProps {
  record: MaintenanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteClick?: (record: MaintenanceRecord) => void;
  generator?: Generator | null;
}

function formatRupee(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatServiceDate(dateStr: string): string {
  if (!dateStr) return "-";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      const monthName = date.toLocaleDateString("en-GB", { month: "short" });
      return `${day} ${monthName} ${year}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      const monthName = date.toLocaleDateString("en-GB", { month: "short" });
      return `${day} ${monthName} ${year}`;
    }
  }
  return dateStr;
}

export function MaintenanceDetailsModal({
  record,
  isOpen,
  onClose,
  onDeleteClick,
  generator,
}: MaintenanceDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const serviceTypes = record.serviceType
    ? record.serviceType
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const pdfUrl = record.pdfLink
    ? record.pdfLink.startsWith("http://") || record.pdfLink.startsWith("https://")
      ? record.pdfLink
      : `https://${record.pdfLink}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-details-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-7 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#e3ecf5] flex items-center justify-center text-[#083a60] shrink-0 border border-[#d2dfed]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="maintenance-details-title"
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                >
                  {record.generatorName}
                </h2>
                {generator?.capacityKva && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {parseFloat(String(generator.capacityKva))} kVA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Service Date: {formatServiceDate(record.serviceDate)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onDeleteClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteClick(record);
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Delete Record"
                aria-label="Delete Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 sm:px-7 py-5 overflow-y-auto space-y-5 text-sm">
          {/* Service Types */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Service Types Performed
            </h3>
            <div className="flex flex-wrap gap-2">
              {serviceTypes.length > 0 ? (
                serviceTypes.map((type, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#083a60]/5 text-[#083a60] border border-[#083a60]/20 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#083a60]" />
                    {type}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs">No service type specified</span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Total Cost */}
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Cost
              </span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {formatRupee(record.cost)}
              </span>
            </div>

            {/* Technician */}
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Technician
              </span>
              <span className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5 truncate">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                {record.technician || "—"}
              </span>
            </div>

            {/* Hours at Service */}
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Hours at Service
              </span>
              <span className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
                {record.hoursAtService ? `${record.hoursAtService} hrs` : "0 hrs"}
              </span>
            </div>

            {/* Next Service Due */}
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Next Service Due
              </span>
              <span className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                {record.nextServiceHours ? `${record.nextServiceHours} hrs` : "—"}
              </span>
            </div>
          </div>

          {/* Generator Fleet Status */}
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Generator Status Update:</span>
            {record.markAvailable ? (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Marked as Available
              </span>
            ) : (
              <span className="font-medium text-slate-500">
                Status unchanged
              </span>
            )}
          </div>

          {/* Attached Document (PDF Link) */}
          {pdfUrl && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Attached Document
              </h3>
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      Service Report / Invoice PDF
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {record.pdfLink}
                    </p>
                  </div>
                </div>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#083a60] hover:bg-[#0c4a7e] text-white text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <span>Open PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Service Notes
              </h3>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {record.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 sm:px-7 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
