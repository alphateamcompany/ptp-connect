"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, ChevronDown, Loader2, Sparkles, Building, MapPin, Cpu, Hash } from "lucide-react";
import { CreateReturnInput, RentalOrderOption } from "@/app/returns/actions";

interface AddReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalOrders: RentalOrderOption[];
  nextReturnNumber: string;
  onSubmit: (data: CreateReturnInput) => Promise<{ success: boolean; error?: string }>;
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

export function AddReturnModal({
  isOpen,
  onClose,
  rentalOrders,
  nextReturnNumber,
  onSubmit,
}: AddReturnModalProps) {
  const [returnNumber, setReturnNumber] = useState(
    nextReturnNumber || `RTN-${new Date().getFullYear()}-0001`
  );
  const [prevNextReturnNumber, setPrevNextReturnNumber] = useState(nextReturnNumber);
  if (prevNextReturnNumber !== nextReturnNumber) {
    setPrevNextReturnNumber(nextReturnNumber);
    if (nextReturnNumber) {
      setReturnNumber(nextReturnNumber);
    }
  }
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [generatorCode, setGeneratorCode] = useState("");
  const [generatorCapacity, setGeneratorCapacity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [returnDateIso, setReturnDateIso] = useState(formatDateToIso(new Date()));
  const [returnDateDisplay, setReturnDateDisplay] = useState(formatDateToDisplay(new Date()));
  const [closingHours, setClosingHours] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleOrderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedOrderId(null);
      setOrderNumber("");
      return;
    }

    if (val === "CUSTOM") {
      setSelectedOrderId(null);
      setOrderNumber("");
      return;
    }

    const orderId = Number(val);
    const order = rentalOrders.find((o) => o.id === orderId);
    if (order) {
      setSelectedOrderId(order.id);
      setOrderNumber(order.orderNumber);
      setCustomerName(order.customerName || "");
      setGeneratorCode(order.generatorName || "");
      if (order.capacity) {
        setGeneratorCapacity(order.capacity);
      } else {
        // Try to extract capacity if present in generatorName, e.g. "Cummins 125kVA #1"
        const match = order.generatorName.match(/(\d+\s*kVA)/i);
        if (match) {
          setGeneratorCapacity(match[1]);
        }
      }
      setSiteLocation(order.siteLocation || "");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    setReturnDateIso(isoVal);
    if (isoVal) {
      const parts = isoVal.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        setReturnDateDisplay(formatDateToDisplay(d));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!returnNumber.trim()) {
      setError("Please provide a Return Number");
      return;
    }
    if (!orderNumber.trim()) {
      setError("Please select or enter a Rental Order");
      return;
    }
    if (!generatorCode.trim()) {
      setError("Please enter the Generator code or name");
      return;
    }
    if (!customerName.trim()) {
      setError("Please enter the Customer name");
      return;
    }
    if (!siteLocation.trim()) {
      setError("Please enter the Site location");
      return;
    }
    if (!returnDateDisplay.trim()) {
      setError("Please specify the Return Date");
      return;
    }
    if (!closingHours.trim()) {
      setError("Please enter the Closing Hours reading");
      return;
    }

    const closingHoursNum = parseInt(closingHours.replace(/,/g, ""), 10);
    if (isNaN(closingHoursNum) || closingHoursNum < 0) {
      setError("Closing hours must be a valid positive number");
      return;
    }

    setLoading(true);

    try {
      const selectedOrder = selectedOrderId
        ? rentalOrders.find((o) => o.id === selectedOrderId)
        : null;

      const res = await onSubmit({
        returnNumber: returnNumber.trim(),
        orderId: selectedOrderId,
        orderNumber: orderNumber.trim(),
        generatorId: selectedOrder?.generatorId || null,
        generatorCode: generatorCode.trim(),
        generatorCapacity: generatorCapacity.trim() || undefined,
        customerName: customerName.trim(),
        siteLocation: siteLocation.trim(),
        returnDate: returnDateDisplay.trim(),
        closingHours: closingHoursNum,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to create return record");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Add Return Records
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record generator return details and closing meter hours
            </p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select Rental Order */}
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#083a60] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Select Rental Order (Auto-fills Details)
              </label>
              <span className="text-[11px] text-blue-600/80 font-medium">
                {rentalOrders.length} active orders
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedOrderId ?? (orderNumber ? "CUSTOM" : "")}
                onChange={handleOrderSelect}
                className="w-full h-10 px-3 pr-8 rounded-lg bg-white border border-blue-200 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#083a60] transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Choose a rental order or enter manually below --</option>
                {rentalOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} • {order.customerName} ({order.generatorName})
                  </option>
                ))}
                <option value="CUSTOM">+ Custom / Other Rental Order Number</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Return No. */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Return No. <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={returnNumber}
                  onChange={(e) => setReturnNumber(e.target.value)}
                  placeholder="e.g. RTN-2026-0001"
                  required
                  className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all font-mono"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Rental Order */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rental Order <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value);
                  setSelectedOrderId(null);
                }}
                placeholder="e.g. RO-0001"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Generator Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Generator Code / Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={generatorCode}
                  onChange={(e) => setGeneratorCode(e.target.value)}
                  placeholder="e.g. GEN-0001"
                  required
                  className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                />
                <Cpu className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Generator Capacity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Generator Capacity
              </label>
              <input
                type="text"
                value={generatorCapacity}
                onChange={(e) => setGeneratorCapacity(e.target.value)}
                placeholder="e.g. 250 kVA"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Raghav Constructions Pvt Ltd"
                  required
                  className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Site */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Site Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  placeholder="e.g. Chennai Central Project"
                  required
                  className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Return Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Return Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={returnDateIso}
                  onChange={handleDateChange}
                  placeholder="YYYY-MM-DD"
                  required
                  className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Formatted as: <span className="font-semibold text-slate-700">{returnDateDisplay}</span>
              </p>
            </div>

            {/* Closing Hours */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Closing Hours (Meter) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={closingHours}
                  onChange={(e) => setClosingHours(e.target.value)}
                  placeholder="e.g. 1245"
                  required
                  className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total engine running hours at return point
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Return Notes / Handover Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Returned with half tank diesel, accessories intact..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Return Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
