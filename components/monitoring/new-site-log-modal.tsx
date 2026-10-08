"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, ChevronDown, Loader2 } from "lucide-react";
import { RentalOrder } from "@/lib/db/schema";
import { CreateSiteLogInput } from "@/app/monitoring/actions";

interface NewSiteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalOrders: RentalOrder[];
  onSubmit: (
    data: CreateSiteLogInput
  ) => Promise<{ success: boolean; error?: string }>;
}

function getTodayFormatted(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function NewSiteLogModal({
  isOpen,
  onClose,
  rentalOrders,
  onSubmit,
}: NewSiteLogModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [generatorName, setGeneratorName] = useState("");
  const [logDate, setLogDate] = useState(getTodayFormatted());
  const [location, setLocation] = useState("");
  const [runningHours, setRunningHours] = useState("0");
  const [dieselFilled, setDieselFilled] = useState("0");
  const [dieselBalance, setDieselBalance] = useState("0");
  const [operatorRemarks, setOperatorRemarks] = useState("");
  const [breakdownReport, setBreakdownReport] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hiddenDateRef = useRef<HTMLInputElement>(null);

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

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split("-");
      setLogDate(`${d}/${m}/${y}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderNumber.trim()) {
      setError("Please select a rental order");
      return;
    }
    if (!logDate.trim()) {
      setError("Please enter a log date");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit({
        orderId: selectedOrderId,
        orderNumber,
        customerName,
        generatorName,
        logDate,
        location: location.trim() || undefined,
        runningHours: parseInt(runningHours, 10) || 0,
        dieselFilled: parseInt(dieselFilled, 10) || 0,
        dieselBalance: parseInt(dieselBalance, 10) || 0,
        operatorRemarks: operatorRemarks.trim() || undefined,
        breakdownReport: breakdownReport.trim() || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to save site log");
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-site-log-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 my-auto p-6 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-3">
          <h2
            id="new-site-log-title"
            className="text-xl font-bold text-slate-900 tracking-tight"
          >
            New Site Log
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
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Rental Order Select */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Rental Order
            </label>
            <div className="relative">
              <select
                value={selectedOrderId || ""}
                onChange={handleOrderChange}
                className="w-full appearance-none px-3.5 py-2 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="">Select rental</option>
                {rentalOrders.map((ro) => (
                  <option key={ro.id} value={ro.id}>
                    {ro.orderNumber} &mdash; {ro.customerName} ({ro.generatorName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  placeholder="e.g. 15/10/2026"
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => hiddenDateRef.current?.showPicker?.()}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-900 cursor-pointer"
                  aria-label="Pick date"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <input
                  ref={hiddenDateRef}
                  type="date"
                  onChange={handleNativeDateChange}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Metro Construction Site, Phase 2"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Running Hours & Diesel Filled (L) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Running Hours
              </label>
              <input
                type="number"
                min="0"
                value={runningHours}
                onChange={(e) => setRunningHours(e.target.value)}
                placeholder="e.g. 8.5"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Diesel Filled (L)
              </label>
              <input
                type="number"
                min="0"
                value={dieselFilled}
                onChange={(e) => setDieselFilled(e.target.value)}
                placeholder="e.g. 60"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Diesel Balance (L) */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Diesel Balance (L)
            </label>
            <input
              type="number"
              min="0"
              value={dieselBalance}
              onChange={(e) => setDieselBalance(e.target.value)}
              placeholder="e.g. 120"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          {/* Operator Remarks */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Operator Remarks
            </label>
            <textarea
              rows={2}
              value={operatorRemarks}
              onChange={(e) => setOperatorRemarks(e.target.value)}
              placeholder="e.g. Generator ran smoothly under normal load for 8 hours"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs resize-y"
            />
          </div>

          {/* Breakdown Report (leave blank if none) */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Breakdown Report (leave blank if none)
            </label>
            <textarea
              rows={2}
              value={breakdownReport}
              onChange={(e) => setBreakdownReport(e.target.value)}
              placeholder="e.g. Minor oil leakage observed around filter seal (leave blank if none)"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs resize-y"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Log</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
