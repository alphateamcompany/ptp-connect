"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, ChevronDown, Loader2 } from "lucide-react";
import { Customer, Generator } from "@/lib/db/schema";
import { CreateRentalOrderInput } from "@/app/rentals/actions";

interface NewRentalOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  generators: Generator[];
  onSubmit: (data: CreateRentalOrderInput) => Promise<{ success: boolean; error?: string }>;
}

export function NewRentalOrderModal({
  isOpen,
  onClose,
  customers,
  generators,
  onSubmit,
}: NewRentalOrderModalProps) {
  const [formData, setFormData] = useState<CreateRentalOrderInput>({
    customerId: null,
    customerName: "",
    generatorId: null,
    generatorName: "",
    startDate: "",
    endDate: "",
    rentalType: "Daily",
    dailyRate: "",
    transportCharges: "0",
    securityDeposit: "0",
    dieselIncluded: false,
    operatorIncluded: false,
    status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

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

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value ? Number(e.target.value) : null;
    const selected = customers.find((c) => c.id === custId);
    setFormData((prev) => ({
      ...prev,
      customerId: custId,
      customerName: selected ? (selected.companyName || selected.customerName) : "",
    }));
  };

  const handleGeneratorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genId = e.target.value ? Number(e.target.value) : null;
    const selected = generators.find((g) => g.id === genId);
    setFormData((prev) => ({
      ...prev,
      generatorId: genId,
      generatorName: selected ? `${selected.name} (${selected.model})` : "",
      dailyRate: selected?.dailyRate ? String(selected.dailyRate) : prev.dailyRate,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.customerName.trim()) {
      setError("Please select a customer.");
      return;
    }
    if (!formData.generatorName.trim()) {
      setError("Please select a generator.");
      return;
    }
    if (!formData.startDate) {
      setError("Please select a start date.");
      return;
    }
    if (!formData.endDate) {
      setError("Please select an end date.");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }
    if (!formData.dailyRate || Number(formData.dailyRate) <= 0) {
      setError("Please enter a valid daily rate.");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit(formData);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to create rental order.");
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
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
      aria-labelledby="new-rental-order-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2
              id="new-rental-order-title"
              className="text-xl font-bold text-slate-900 tracking-tight"
            >
              New Rental Order
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Create a new rental agreement
            </p>
          </div>
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

            {/* Customer */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Customer
              </label>
              <div className="relative">
                <select
                  value={formData.customerId || ""}
                  onChange={handleCustomerChange}
                  required
                  className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.customerName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Generator */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Generator
              </label>
              <div className="relative">
                <select
                  value={formData.generatorId || ""}
                  onChange={handleGeneratorChange}
                  required
                  className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="">Select generator</option>
                  {generators.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.model}) - {g.capacityKva} kVA ({g.status})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Start Date
                </label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    try {
                      startDateRef.current?.showPicker();
                    } catch {
                      startDateRef.current?.focus();
                    }
                  }}
                >
                  <input
                    ref={startDateRef}
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  End Date
                </label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    try {
                      endDateRef.current?.showPicker();
                    } catch {
                      endDateRef.current?.focus();
                    }
                  }}
                >
                  <input
                    ref={endDateRef}
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Rental Type & Daily Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Rental Type
                </label>
                <div className="relative">
                  <select
                    name="rentalType"
                    value={formData.rentalType}
                    onChange={handleChange}
                    className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Daily Rate (₹)
                </label>
                <input
                  type="number"
                  name="dailyRate"
                  value={formData.dailyRate}
                  onChange={handleChange}
                  placeholder="4500"
                  min="0"
                  step="any"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Transport Charges & Security Deposit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Transport Charges (₹)
                </label>
                <input
                  type="number"
                  name="transportCharges"
                  value={formData.transportCharges}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="any"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  name="securityDeposit"
                  value={formData.securityDeposit}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="any"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Diesel Included & Operator Included Switch Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Diesel Included */}
              <label
                htmlFor="dieselIncluded"
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-800">
                  Diesel Included
                </span>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    id="dieselIncluded"
                    name="dieselIncluded"
                    checked={Boolean(formData.dieselIncluded)}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083a60]"></div>
                </div>
              </label>

              {/* Operator Included */}
              <label
                htmlFor="operatorIncluded"
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-800">
                  Operator Included
                </span>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    id="operatorIncluded"
                    name="operatorIncluded"
                    checked={Boolean(formData.operatorIncluded)}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083a60]"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Order</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
