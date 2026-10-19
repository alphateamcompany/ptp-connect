"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Loader2,
  Building,
  MapPin,
  Cpu,
  Truck,
  RotateCcw,
  User,
  Hash,
} from "lucide-react";
import { ReturnRecord } from "@/lib/db/schema";
import { CreateReturnInput } from "@/app/returns/actions";

interface EditReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ReturnRecord | null;
  onSubmit: (id: number, data: Partial<CreateReturnInput>) => Promise<{ success: boolean; error?: string }>;
}

function formatDateToDisplay(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateToDisplay(isoStr: string): string {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (!isNaN(d.getTime())) return formatDateToDisplay(d);
  }
  return isoStr;
}

export function EditReturnModal({
  isOpen,
  onClose,
  record,
  onSubmit,
}: EditReturnModalProps) {
  const [orderNumber, setOrderNumber] = useState(record?.orderNumber || "");
  const [generatorCode, setGeneratorCode] = useState(record?.generatorCode || "");
  const [generatorCapacity, setGeneratorCapacity] = useState(record?.generatorCapacity || "");
  const [customerName, setCustomerName] = useState(record?.customerName || "");
  const [siteLocation, setSiteLocation] = useState(record?.siteLocation || "");

  // Start Details
  const [startDateDisplay, setStartDateDisplay] = useState(record?.startDate || "");
  const [startingHours, setStartingHours] = useState(
    record?.startingHours !== undefined && record?.startingHours !== null ? String(record.startingHours) : ""
  );
  const [driverName, setDriverName] = useState(record?.driverName || "");
  const [vehicleNumber, setVehicleNumber] = useState(record?.vehicleNumber || "");

  // Closing Details
  const [closingDateDisplay, setClosingDateDisplay] = useState(
    record?.closingDate || (record?.returnDate !== record?.startDate ? record?.returnDate : "") || ""
  );
  const [closingHours, setClosingHours] = useState(
    record?.closingHours ? String(record.closingHours) : ""
  );
  const [returnDriverName, setReturnDriverName] = useState(record?.returnDriverName || "");
  const [returnVehicleNumber, setReturnVehicleNumber] = useState(record?.returnVehicleNumber || "");

  const [notes, setNotes] = useState(record?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setOrderNumber(record.orderNumber || "");
      setGeneratorCode(record.generatorCode || "");
      setGeneratorCapacity(record.generatorCapacity || "");
      setCustomerName(record.customerName || "");
      setSiteLocation(record.siteLocation || "");

      setStartDateDisplay(record.startDate || "");
      setStartingHours(
        record.startingHours !== undefined && record.startingHours !== null ? String(record.startingHours) : ""
      );
      setDriverName(record.driverName || "");
      setVehicleNumber(record.vehicleNumber || "");

      setClosingDateDisplay(
        record.closingDate || (record.returnDate && record.returnDate !== record.startDate ? record.returnDate : "") || ""
      );
      setClosingHours(record.closingHours ? String(record.closingHours) : "");
      setReturnDriverName(record.returnDriverName || "");
      setReturnVehicleNumber(record.returnVehicleNumber || "");
      setNotes(record.notes || "");
    }
  }, [record]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let startingHoursNum = 0;
    if (startingHours.trim()) {
      startingHoursNum = parseInt(startingHours.replace(/,/g, ""), 10);
      if (isNaN(startingHoursNum) || startingHoursNum < 0) {
        setError("Starting hours must be a valid positive number");
        return;
      }
    }

    let closingHoursNum = 0;
    if (closingHours.trim()) {
      closingHoursNum = parseInt(closingHours.replace(/,/g, ""), 10);
      if (isNaN(closingHoursNum) || closingHoursNum < 0) {
        setError("Closing hours must be a valid positive number");
        return;
      }
    }

    if (closingHoursNum > 0 && startingHoursNum > 0 && closingHoursNum < startingHoursNum) {
      setError("Closing hours cannot be less than Starting hours");
      return;
    }

    setLoading(true);

    try {
      const res = await onSubmit(record.id, {
        orderNumber: orderNumber.trim(),
        generatorCode: generatorCode.trim(),
        generatorCapacity: generatorCapacity.trim() || undefined,
        customerName: customerName.trim(),
        siteLocation: siteLocation.trim(),
        startDate: startDateDisplay.trim() || undefined,
        startingHours: startingHoursNum,
        driverName: driverName.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        closingDate: closingDateDisplay.trim() || undefined,
        returnDate: closingDateDisplay.trim() || startDateDisplay.trim() || record.returnDate,
        closingHours: closingHoursNum,
        returnDriverName: returnDriverName.trim() || undefined,
        returnVehicleNumber: returnVehicleNumber.trim() || undefined,
        status: closingDateDisplay.trim() || closingHoursNum > 0 ? "Returned" : "Dispatched",
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to update transport record");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#083a60] text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Edit Transport Record
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update dispatch and return details for {record.orderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Equipment & Order Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              Equipment &amp; Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rental Order No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-900"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Generator Code / Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={generatorCode}
                  onChange={(e) => setGeneratorCode(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Capacity (kVA)
                </label>
                <input
                  type="text"
                  value={generatorCapacity}
                  onChange={(e) => setGeneratorCapacity(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Site Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section: Dispatch (Start) Details */}
          <div className="p-4.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span>Dispatch / Outward Journey (Start)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="text"
                  value={startDateDisplay}
                  onChange={(e) => setStartDateDisplay(e.target.value)}
                  placeholder="e.g. 15 Oct 2026"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Starting Hours (Meter)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={startingHours}
                  onChange={(e) => setStartingHours(e.target.value)}
                  placeholder="e.g. 1050"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Driver Name (Dispatch)
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vehicle Number (Dispatch)
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. TN-09-AB-1234"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Return (Closing) Details */}
          <div className="p-4.5 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
              <span>Return / Inward Journey (Closing)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Closing Date
                </label>
                <input
                  type="text"
                  value={closingDateDisplay}
                  onChange={(e) => setClosingDateDisplay(e.target.value)}
                  placeholder="e.g. 20 Oct 2026"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Closing Hours (Meter)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={closingHours}
                  onChange={(e) => setClosingHours(e.target.value)}
                  placeholder="e.g. 1280"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Driver Name (Return)
                </label>
                <input
                  type="text"
                  value={returnDriverName}
                  onChange={(e) => setReturnDriverName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vehicle Number (Return)
                </label>
                <input
                  type="text"
                  value={returnVehicleNumber}
                  onChange={(e) => setReturnVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. TN-09-CD-5678"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transport &amp; Handover Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Returned in good condition, fuel topped up..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
