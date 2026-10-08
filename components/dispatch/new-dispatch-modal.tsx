"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, Clock, ChevronDown, Loader2 } from "lucide-react";
import { RentalOrder } from "@/lib/db/schema";
import { CreateDispatchInput } from "@/app/dispatch/actions";

interface NewDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalOrders: RentalOrder[];
  onSubmit: (
    data: CreateDispatchInput
  ) => Promise<{ success: boolean; error?: string }>;
}

function getTodayFormatted(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getCurrentTimeFormatted(): string {
  const d = new Date();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, "0");
  return `${hoursStr}:${minutes} ${ampm}`;
}

export function NewDispatchModal({
  isOpen,
  onClose,
  rentalOrders,
  onSubmit,
}: NewDispatchModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [generatorName, setGeneratorName] = useState("");
  const [dispatchDate, setDispatchDate] = useState(getTodayFormatted());
  const [dispatchTime, setDispatchTime] = useState(getCurrentTimeFormatted());
  const [driverName, setDriverName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [hoursBeforeDispatch, setHoursBeforeDispatch] = useState("0");
  const [fuelFilled, setFuelFilled] = useState("0");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

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

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderId = Number(e.target.value);
    if (!orderId) {
      setSelectedOrderId(null);
      setOrderNumber("");
      setCustomerName("");
      setGeneratorName("");
      return;
    }

    const order = rentalOrders.find((o) => o.id === orderId);
    if (order) {
      setSelectedOrderId(order.id);
      setOrderNumber(order.orderNumber);
      setCustomerName(order.customerName);
      setGeneratorName(order.generatorName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderNumber.trim()) {
      setError("Please select a rental order");
      return;
    }
    if (!dispatchDate.trim()) {
      setError("Please enter a dispatch date");
      return;
    }
    if (!driverName.trim()) {
      setError("Please enter driver name");
      return;
    }
    if (!vehicleNumber.trim()) {
      setError("Please enter vehicle number");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit({
        orderId: selectedOrderId,
        orderNumber,
        customerName,
        generatorName,
        dispatchDate,
        dispatchTime,
        driverName,
        vehicleNumber,
        hoursBeforeDispatch: parseInt(hoursBeforeDispatch, 10) || 0,
        fuelFilled: parseInt(fuelFilled, 10) || 0,
        notes,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to record dispatch");
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-dispatch-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <h2
            id="new-dispatch-title"
            className="text-xl font-bold text-slate-900 tracking-tight"
          >
            New Dispatch
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Rental Order Select */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Rental Order
              </label>
              <div className="relative">
                <select
                  value={selectedOrderId || ""}
                  onChange={handleOrderChange}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
                >
                  <option value="">Select rental order</option>
                  {rentalOrders.map((ro) => (
                    <option key={ro.id} value={ro.id}>
                      {ro.orderNumber} - {ro.customerName} ({ro.generatorName})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Dispatch Date & Dispatch Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Dispatch Date
                </label>
                <div className="relative">
                  <input
                    ref={dateInputRef}
                    type="text"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    placeholder="e.g. 15/10/2026"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                  />
                  <Calendar className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Dispatch Time
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={dispatchTime}
                    onChange={(e) => setDispatchTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                  />
                  <Clock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Driver Name & Vehicle Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. MH 12 AB 1234"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Hours Before Dispatch & Fuel Filled */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Hours Before Dispatch
                </label>
                <input
                  type="number"
                  min="0"
                  value={hoursBeforeDispatch}
                  onChange={(e) => setHoursBeforeDispatch(e.target.value)}
                  placeholder="e.g. 1250"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Fuel Filled (L)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fuelFilled}
                  onChange={(e) => setFuelFilled(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Delivered with cables, test run successful on site"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs resize-y"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Record Dispatch</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
