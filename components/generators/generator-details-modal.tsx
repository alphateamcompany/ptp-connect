"use client";

import React, { useEffect } from "react";
import { Generator } from "@/lib/db/schema";
import {
  X,
  Edit,
  Trash2,
  Cpu,
  MapPin,
  Clock,
  Zap,
  Calendar,
  IndianRupee,
  Gauge,
  Fuel,
  Hash,
} from "lucide-react";

interface GeneratorDetailsModalProps {
  generator: Generator | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (generator: Generator) => void;
  onDelete: (id: number) => Promise<void>;
}

export function GeneratorDetailsModal({
  generator,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: GeneratorDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !generator) return null;

  const formatCurrency = (val: string | number | null) => {
    if (!val) return "Not specified";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return String(val);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "available") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
          Available
        </span>
      );
    }
    if (s === "breakdown") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
          Breakdown
        </span>
      );
    }
    if (s === "maintenance" || s === "under maintenance") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Maintenance
        </span>
      );
    }
    if (s === "on rent") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          On Rent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${generator.generatorId} (${generator.name})?`)) {
      await onDelete(generator.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c4a7e] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-amber-400 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg">
                  {generator.generatorId}
                </span>
                {getStatusBadge(generator.status)}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {generator.brand || "Generic"} • {generator.model}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          {/* Main Title & Key Metrics Banner */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
            <h3 className="font-bold text-lg text-slate-900">
              {generator.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200/60">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Capacity
                </span>
                <span className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  {parseFloat(String(generator.capacityKva))} kVA
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Running Hours
                </span>
                <span className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  {(generator.currentHours ?? 0)} hrs
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Fuel Tank
                </span>
                <span className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                  <Fuel className="w-4 h-4 text-emerald-500" />
                  {generator.fuelTankLiters ? `${generator.fuelTankLiters} L` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Location
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1 truncate">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{generator.location || "Unassigned"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Technical Details Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Machinery & Identification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm bg-white rounded-xl">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc]/60">
                <span className="text-xs text-slate-500 block">Engine Number</span>
                <span className="font-semibold text-slate-800 mt-0.5 block font-mono text-xs">
                  {generator.engineNumber || "-"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc]/60">
                <span className="text-xs text-slate-500 block">Alternator Number</span>
                <span className="font-semibold text-slate-800 mt-0.5 block font-mono text-xs">
                  {generator.alternatorNumber || "-"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc]/60">
                <span className="text-xs text-slate-500 block">Controller Type</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {generator.controllerType || "-"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc]/60">
                <span className="text-xs text-slate-500 block">Serial Number</span>
                <span className="font-semibold text-slate-800 mt-0.5 block font-mono text-xs">
                  {generator.serialNumber || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Commercial & Financial Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Purchase & Commercial Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Purchase Date</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {generator.purchaseDate || "Not recorded"}
                  </span>
                </div>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Purchase Cost</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {formatCurrency(generator.purchaseCost)}
                  </span>
                </div>
                <IndianRupee className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions: Close, Delete, and EDIT */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="sm:hidden">Delete</span>
            <span className="hidden sm:inline">Delete Generator</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onEdit(generator);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span className="sm:hidden">Edit</span>
              <span className="hidden sm:inline">Edit Generator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
