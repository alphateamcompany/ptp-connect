"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, ChevronDown, Loader2 } from "lucide-react";
import { Generator } from "@/lib/db/schema";
import { CreateMaintenanceRecordInput } from "@/app/maintenance/actions";

interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  generators: Generator[];
  onSubmit: (
    data: CreateMaintenanceRecordInput
  ) => Promise<{ success: boolean; error?: string }>;
}

function getTodayFormatted(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const SERVICE_TYPES = [
  "Oil Change",
  "Filter Replacement",
  "General Service",
  "Major Overhaul",
  "Electrical Repair",
  "Battery Replacement",
  "Coolant Flush",
  "Inspection",
  "Other",
];

export function LogMaintenanceModal({
  isOpen,
  onClose,
  generators,
  onSubmit,
}: LogMaintenanceModalProps) {
  const [selectedGeneratorId, setSelectedGeneratorId] = useState<number | null>(null);
  const [generatorName, setGeneratorName] = useState("");
  const [serviceType, setServiceType] = useState("Oil Change");
  const [serviceDate, setServiceDate] = useState(getTodayFormatted());
  const [technician, setTechnician] = useState("");
  const [cost, setCost] = useState("0");
  const [hoursAtService, setHoursAtService] = useState("0");
  const [nextServiceHours, setNextServiceHours] = useState("0");
  const [notes, setNotes] = useState("");
  const [markAvailable, setMarkAvailable] = useState(false);

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

  const handleGeneratorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genId = Number(e.target.value);
    if (!genId) {
      setSelectedGeneratorId(null);
      setGeneratorName("");
      return;
    }

    const gen = generators.find((g) => g.id === genId);
    if (gen) {
      setSelectedGeneratorId(gen.id);
      setGeneratorName(gen.name);
      if (gen.currentHours && (!hoursAtService || hoursAtService === "0")) {
        setHoursAtService(String(gen.currentHours));
        setNextServiceHours(String(gen.currentHours + 250));
      }
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split("-");
      setServiceDate(`${d}/${m}/${y}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!generatorName.trim()) {
      setError("Please select a generator");
      return;
    }
    if (!serviceType.trim()) {
      setError("Please select a service type");
      return;
    }
    if (!serviceDate.trim()) {
      setError("Please select a service date");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit({
        generatorId: selectedGeneratorId,
        generatorName: generatorName.trim(),
        serviceType: serviceType.trim(),
        serviceDate: serviceDate.trim(),
        technician: technician.trim() || undefined,
        cost: Math.max(0, parseFloat(cost) || 0),
        hoursAtService: Math.max(0, parseInt(hoursAtService, 10) || 0),
        nextServiceHours: Math.max(0, parseInt(nextServiceHours, 10) || 0),
        notes: notes.trim() || undefined,
        markAvailable,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to save maintenance record");
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
      aria-labelledby="log-maintenance-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 my-auto p-6 sm:p-7 flex flex-col max-h-[94vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-3.5">
          <h2
            id="log-maintenance-title"
            className="text-xl font-bold text-slate-900 tracking-tight"
          >
            Log Maintenance
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
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Generator Select */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">
              Generator
            </label>
            <div className="relative">
              <select
                value={selectedGeneratorId || ""}
                onChange={handleGeneratorChange}
                className="w-full appearance-none px-3.5 py-2 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="">Select generator</option>
                {generators.map((gen) => (
                  <option key={gen.id} value={gen.id}>
                    {gen.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Service Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Service Type
              </label>
              <div className="relative">
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
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
          </div>

          {/* Technician & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Technician
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="e.g. Suresh Maintenance Works"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Hours at Service & Next Service (hrs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Hours at Service
              </label>
              <input
                type="number"
                min="0"
                value={hoursAtService}
                onChange={(e) => setHoursAtService(e.target.value)}
                placeholder="e.g. 1250"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Next Service (hrs)
              </label>
              <input
                type="number"
                min="0"
                value={nextServiceHours}
                onChange={(e) => setNextServiceHours(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mobil Delvac engine oil and filter replaced, load tested ok"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs resize-y"
            />
          </div>

          {/* Mark generator as Available Toggle */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex flex-col pr-4">
              <span className="text-sm font-bold text-slate-900">
                Mark generator as Available
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                If service completed and back in fleet
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={markAvailable}
              onClick={() => setMarkAvailable(!markAvailable)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:ring-offset-2 ${
                markAvailable ? "bg-[#083a60]" : "bg-slate-300"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  markAvailable ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Record</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
