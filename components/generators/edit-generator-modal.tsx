"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { Generator } from "@/lib/db/schema";
import { CreateGeneratorInput } from "@/app/generators/actions";

interface EditGeneratorModalProps {
  generator: Generator | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    id: number,
    data: Partial<CreateGeneratorInput>
  ) => Promise<{ success: boolean; error?: string; data?: Generator }>;
}

export function EditGeneratorModal({
  generator,
  isOpen,
  onClose,
  onSubmit,
}: EditGeneratorModalProps) {
  const [formData, setFormData] = useState<Partial<CreateGeneratorInput>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (generator && isOpen) {
      setFormData({
        generatorId: generator.generatorId,
        assetId: generator.assetId || "",
        name: generator.name,
        brand: generator.brand || generator.name || "",
        model: generator.model,
        capacityKva: generator.capacityKva,
        manufacturingYear: generator.manufacturingYear || "",
        engineMake: generator.engineMake || "",
        engineNumber: generator.engineNumber || "",
        alternatorMake: generator.alternatorMake || "",
        alternatorNumber: generator.alternatorNumber || "",
        controllerType: generator.controllerType || "",
        serialNumber: generator.serialNumber || "",
        fuelTankLiters: generator.fuelTankLiters ?? undefined,
        purchaseDate: generator.purchaseDate || "",
        purchaseCost: generator.purchaseCost || "",
        currentHours: generator.currentHours ?? 0,
        location: generator.location || "",
        driveLink: generator.driveLink || "",
        status: generator.status || "Available",
        buyingPersonName: generator.buyingPersonName || "",
        buyingPersonPhone: generator.buyingPersonPhone || "",
        sellingPersonName: generator.sellingPersonName || "",
        sellingPersonPhone: generator.sellingPersonPhone || "",
        notes: generator.notes || "",
      });
      setError(null);
    }
  }, [generator, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !generator) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "capacityKva" || name === "fuelTankLiters" || name === "currentHours"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name?.trim()) {
      setError("Generator Name is required");
      return;
    }
    if (!formData.model?.trim()) {
      setError("Model is required");
      return;
    }
    if (!formData.capacityKva || Number(formData.capacityKva) <= 0) {
      setError("Please enter a valid capacity in kVA");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit(generator.id, {
        ...formData,
        brand: formData.name,
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to update generator");
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
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Edit Generator
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {generator.generatorId}
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-5"
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {/* Row 1: Generator ID & Assert ID */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Generator ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="generatorId"
                value={formData.generatorId || ""}
                onChange={handleChange}
                placeholder="e.g. GEN-001"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Assert ID <span className="text-xs text-slate-400 font-normal">(Unique)</span>
              </label>
              <input
                type="text"
                name="assetId"
                value={formData.assetId || ""}
                onChange={handleChange}
                placeholder="e.g. AST-001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 2: Generator Name & Capacity (kVA) */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Generator Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="e.g. Cummins, Perkins, Kirloskar"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Capacity (kVA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capacityKva"
                value={formData.capacityKva || ""}
                onChange={handleChange}
                placeholder="e.g. 250"
                required
                min="0.1"
                step="any"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 3: Model & Year of Manufacture */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model || ""}
                onChange={handleChange}
                placeholder="e.g. C250D5"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Year of Manufacture
              </label>
              <input
                type="text"
                name="manufacturingYear"
                value={formData.manufacturingYear || ""}
                onChange={handleChange}
                placeholder="e.g. 2023"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 4: Engine Make & Engine Number */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Engine Make
              </label>
              <input
                type="text"
                name="engineMake"
                value={formData.engineMake || ""}
                onChange={handleChange}
                placeholder="e.g. Cummins, Perkins"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Engine Number
              </label>
              <input
                type="text"
                name="engineNumber"
                value={formData.engineNumber || ""}
                onChange={handleChange}
                placeholder="e.g. ENG-8742910"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 5: Alternator Make & Alternator Number */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Alternator Make
              </label>
              <input
                type="text"
                name="alternatorMake"
                value={formData.alternatorMake || ""}
                onChange={handleChange}
                placeholder="e.g. Stamford, Leroy Somer"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Alternator Number
              </label>
              <input
                type="text"
                name="alternatorNumber"
                value={formData.alternatorNumber || ""}
                onChange={handleChange}
                placeholder="e.g. ALT-562134"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 6: Controller Type & Fuel Tank (L) */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Controller Type
              </label>
              <input
                type="text"
                name="controllerType"
                value={formData.controllerType || ""}
                onChange={handleChange}
                placeholder="e.g. Deep Sea 7320, PowerCommand 1.1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Fuel Tank (L)
              </label>
              <input
                type="number"
                name="fuelTankLiters"
                value={formData.fuelTankLiters || ""}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 7: Serial Number & Drive Link */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Serial Number
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber || ""}
                onChange={handleChange}
                placeholder="e.g. SN-2023-8941"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-900">
                  Drive Link
                </label>
                {formData.driveLink && (
                  <a
                    href={formData.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Open Link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                name="driveLink"
                value={formData.driveLink || ""}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 8: Purchase Date & Purchase Cost (₹) */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate || ""}
                onChange={handleChange}
                placeholder="YYYY-MM-DD"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Purchase Cost (₹)
              </label>
              <input
                type="number"
                name="purchaseCost"
                value={formData.purchaseCost || ""}
                onChange={handleChange}
                placeholder="e.g. 450000"
                min="0"
                step="0.01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 7: Purchased Running Hours & Purchased Location */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Purchased Running Hours
              </label>
              <input
                type="number"
                name="currentHours"
                value={formData.currentHours !== undefined ? formData.currentHours : 0}
                onChange={handleChange}
                placeholder="e.g. 1250"
                min="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Purchased Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                placeholder="e.g. Main Yard / Warehouse"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 8: Status */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status || "Available"}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="Available">Available</option>
                  <option value="On Rent">On Rent</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Breakdown">Breakdown</option>
                  <option value="Sales">Sales</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {generator.status === "On Rent" && (
                <p className="text-[11px] text-blue-600 font-medium mt-1">
                  Auto-updated from active rental orders.
                </p>
              )}
            </div>

            {/* Buying Person Details */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Buying Person Details
              </h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Buying Person Name
              </label>
              <input
                type="text"
                name="buyingPersonName"
                value={formData.buyingPersonName || ""}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Buying Person Mobile Number
              </label>
              <input
                type="tel"
                name="buyingPersonPhone"
                value={formData.buyingPersonPhone || ""}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Selling Person Details */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Selling Person Details
              </h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Selling Person Name
              </label>
              <input
                type="text"
                name="sellingPersonName"
                value={formData.sellingPersonName || ""}
                onChange={handleChange}
                placeholder="e.g. Suresh Patel"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Selling Person Mobile Number
              </label>
              <input
                type="tel"
                name="sellingPersonPhone"
                value={formData.sellingPersonPhone || ""}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Note
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="Add any internal notes, remarks, or special instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all resize-y"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
