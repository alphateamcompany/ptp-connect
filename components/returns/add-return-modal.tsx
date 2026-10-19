"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  ChevronDown,
  Loader2,
  Sparkles,
  Building,
  MapPin,
  Cpu,
  Truck,
  RotateCcw,
  User,
  Hash,
} from "lucide-react";
import { CreateReturnInput, RentalOrderOption } from "@/app/returns/actions";

interface AddReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalOrders: RentalOrderOption[];
  nextReturnNumber?: string;
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

function parseDateToDisplay(isoStr: string): string {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (!isNaN(d.getTime())) return formatDateToDisplay(d);
  }
  return isoStr;
}

export function AddReturnModal({
  isOpen,
  onClose,
  rentalOrders,
  onSubmit,
}: AddReturnModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [generatorCode, setGeneratorCode] = useState("");
  const [generatorCapacity, setGeneratorCapacity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");

  // Dispatch / Start Details
  const [startDateIso, setStartDateIso] = useState(formatDateToIso(new Date()));
  const [startDateDisplay, setStartDateDisplay] = useState(formatDateToDisplay(new Date()));
  const [startingHours, setStartingHours] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  // Return / Closing Details
  const [closingDateIso, setClosingDateIso] = useState("");
  const [closingDateDisplay, setClosingDateDisplay] = useState("");
  const [closingHours, setClosingHours] = useState("");
  const [returnDriverName, setReturnDriverName] = useState("");
  const [returnVehicleNumber, setReturnVehicleNumber] = useState("");

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
        const match = order.generatorName?.match(/(\d+\s*kVA)/i);
        if (match) {
          setGeneratorCapacity(match[1]);
        }
      }

      setSiteLocation(order.siteLocation || "");

      // Pre-fill Start / Dispatch information
      if (order.dispatchDate) {
        setStartDateDisplay(order.dispatchDate);
      } else if (order.orderStartDate) {
        setStartDateDisplay(order.orderStartDate);
      }

      if (order.dispatchHours !== undefined && order.dispatchHours !== null) {
        setStartingHours(String(order.dispatchHours));
      } else if (order.currentHours !== undefined && order.currentHours !== null) {
        setStartingHours(String(order.currentHours));
      }

      if (order.dispatchDriverName) {
        setDriverName(order.dispatchDriverName);
      }
      if (order.dispatchVehicleNumber) {
        setVehicleNumber(order.dispatchVehicleNumber);
      }
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    setStartDateIso(isoVal);
    setStartDateDisplay(parseDateToDisplay(isoVal));
  };

  const handleClosingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    setClosingDateIso(isoVal);
    setClosingDateDisplay(parseDateToDisplay(isoVal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    // Validation of numeric hours if provided
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
      const selectedOrder = selectedOrderId
        ? rentalOrders.find((o) => o.id === selectedOrderId)
        : null;

      const res = await onSubmit({
        orderId: selectedOrderId,
        orderNumber: orderNumber.trim(),
        generatorId: selectedOrder?.generatorId || null,
        generatorCode: generatorCode.trim(),
        generatorCapacity: generatorCapacity.trim() || undefined,
        customerName: customerName.trim(),
        siteLocation: siteLocation.trim(),
        // Start / Dispatch
        startDate: startDateDisplay.trim() || undefined,
        startingHours: startingHoursNum,
        driverName: driverName.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        // Return / Closing
        closingDate: closingDateDisplay.trim() || undefined,
        returnDate: closingDateDisplay.trim() || startDateDisplay.trim() || formatDateToDisplay(new Date()),
        closingHours: closingHoursNum,
        returnDriverName: returnDriverName.trim() || undefined,
        returnVehicleNumber: returnVehicleNumber.trim() || undefined,
        status: closingDateDisplay.trim() || closingHoursNum > 0 ? "Returned" : "Dispatched",
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to create transport record");
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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#083a60] text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Add Transport Record
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Log equipment dispatch (start) and return (closing) movement
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select Rental Order */}
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#083a60] flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Select Rental Order (Auto-fills Details)
              </label>
              <span className="text-[11px] text-blue-600 font-semibold bg-blue-100/60 px-2 py-0.5 rounded-full">
                {rentalOrders.length} active orders
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedOrderId ?? (orderNumber ? "CUSTOM" : "")}
                onChange={handleOrderSelect}
                className="w-full h-10 px-3 pr-8 rounded-xl bg-white border border-blue-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#083a60] transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Choose a rental order or enter details below --</option>
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

          {/* Section: Equipment & Order Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              Equipment &amp; Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rental Order */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rental Order No. <span className="text-red-500">*</span>
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
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all font-mono"
                />
              </div>

              {/* Customer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Raghav Constructions Pvt Ltd"
                    required
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Generator Code */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Generator Code / Model <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={generatorCode}
                    onChange={(e) => setGeneratorCode(e.target.value)}
                    placeholder="e.g. GEN-0001"
                    required
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                  />
                  <Cpu className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Generator Capacity */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Capacity (kVA)
                </label>
                <input
                  type="text"
                  value={generatorCapacity}
                  onChange={(e) => setGeneratorCapacity(e.target.value)}
                  placeholder="e.g. 125 kVA"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                />
              </div>

              {/* Site Location */}
              <div className="sm:col-span-1">
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
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
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
              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDateIso}
                    onChange={handleStartDateChange}
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {startDateDisplay && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Display: <span className="font-semibold text-slate-700">{startDateDisplay}</span>
                  </p>
                )}
              </div>

              {/* Starting Hours */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Starting Hours (Meter)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={startingHours}
                    onChange={(e) => setStartingHours(e.target.value)}
                    placeholder="e.g. 1050"
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all font-mono"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Engine meter reading at start of rental
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Driver Name (Start) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Driver Name (Dispatch)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Vehicle Number (Start) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vehicle Number (Dispatch)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. TN-09-AB-1234"
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all font-mono"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Return (Closing) Details */}
          <div className="p-4.5 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <span>Return / Inward Journey (Closing)</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                (Optional if logging initial dispatch)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Closing Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Closing Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={closingDateIso}
                    onChange={handleClosingDateChange}
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {closingDateDisplay && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Display: <span className="font-semibold text-emerald-800">{closingDateDisplay}</span>
                  </p>
                )}
              </div>

              {/* Closing Hours */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Closing Hours (Meter)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={closingHours}
                    onChange={(e) => setClosingHours(e.target.value)}
                    placeholder="e.g. 1280"
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all font-mono"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Engine meter reading at equipment return
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Driver Name (Return) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Driver Name (Return)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={returnDriverName}
                    onChange={(e) => setReturnDriverName(e.target.value)}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Vehicle Number (Return) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vehicle Number (Return)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={returnVehicleNumber}
                    onChange={(e) => setReturnVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. TN-09-CD-5678"
                    className="w-full h-10 px-3 pl-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all font-mono"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
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
              placeholder="e.g. Accessories dispatched, cables included, fuel level at handover..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#083a60] focus:ring-2 focus:ring-[#083a60]/10 transition-all resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Transport Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const AddTransportModal = AddReturnModal;
