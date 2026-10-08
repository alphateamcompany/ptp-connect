"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Package, AlertCircle } from "lucide-react";
import { InventoryItem } from "@/lib/db/schema";
import { CreateInventoryInput } from "@/app/inventory/actions";

interface EditInventoryModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: Partial<CreateInventoryInput>) => Promise<{ success: boolean; error?: string }>;
  generatorOptions: string[];
}

const CATEGORIES = [
  "Filters",
  "Belts & Pulleys",
  "Electrical",
  "Coolant & Lubes",
  "Batteries",
  "Fuel System",
  "Alternator Parts",
  "Engine Components",
  "General Hardware",
];

const COMMON_LOCATIONS = [
  "Chennai Main Warehouse",
  "OMR Site Store",
  "Guindy Central Workshop",
  "Ambattur Hub",
  "Sriperumbudur Site Store",
];

export function EditInventoryModal({
  item,
  isOpen,
  onClose,
  onSubmit,
  generatorOptions,
}: EditInventoryModalProps) {
  const [formData, setFormData] = useState<CreateInventoryInput>({
    partNumber: item.partNumber,
    partName: item.partName,
    model: item.model || "",
    category: item.category,
    compatibleGenerator: item.compatibleGenerator,
    qtyAvailable: item.qtyAvailable,
    reorderLevel: item.reorderLevel,
    unitCost: item.unitCost,
    location: item.location,
    status: item.status,
    notes: item.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevItem, setPrevItem] = useState(item);
  if (prevItem !== item) {
    setPrevItem(item);
    setFormData({
      partNumber: item.partNumber,
      partName: item.partName,
      model: item.model || "",
      category: item.category,
      compatibleGenerator: item.compatibleGenerator,
      qtyAvailable: item.qtyAvailable,
      reorderLevel: item.reorderLevel,
      unitCost: item.unitCost,
      location: item.location,
      status: item.status,
      notes: item.notes || "",
    });
  }

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const qty = Number(formData.qtyAvailable) || 0;
  const reorder = Number(formData.reorderLevel) || 0;
  let previewStatus = "In Stock";
  if (formData.status && formData.status !== "Auto") {
    previewStatus = formData.status;
  } else if (qty <= 0) {
    previewStatus = "Out of Stock";
  } else if (qty <= reorder) {
    previewStatus = "Low Stock";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.partNumber.trim()) {
      setError("Part Number is required.");
      return;
    }
    if (!formData.partName.trim()) {
      setError("Part Name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit(item.id, {
        partNumber: formData.partNumber.trim().toUpperCase(),
        partName: formData.partName.trim(),
        model: formData.model?.trim() || null,
        category: formData.category.trim(),
        compatibleGenerator: formData.compatibleGenerator.trim(),
        qtyAvailable: Number(formData.qtyAvailable) || 0,
        reorderLevel: Number(formData.reorderLevel) || 0,
        unitCost: Number(formData.unitCost) || 0,
        location: formData.location?.trim() || "Chennai Main Warehouse",
        status: formData.status,
        notes: formData.notes?.trim() || null,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to update item.");
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
      aria-labelledby="edit-inventory-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#083a60] shrink-0">
              <Package className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2
                id="edit-inventory-modal-title"
                className="text-xl font-bold text-slate-900 tracking-tight"
              >
                Edit Inventory Item
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update stock levels, reorder thresholds, or part details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4 text-slate-800"
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {/* Part Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Part Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="partNumber"
                required
                value={formData.partNumber}
                onChange={handleChange}
                placeholder="e.g. PPD-FLT-001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Part Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Part Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="partName"
                required
                value={formData.partName}
                onChange={handleChange}
                placeholder="e.g. Diesel Oil Filter, Fuel Filter"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Model / Part Spec (Optional)
              </label>
              <input
                type="text"
                name="model"
                value={formData.model || ""}
                onChange={handleChange}
                placeholder="e.g. LF9009, SX460, FS1212"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <input
                type="text"
                list="category-suggestions"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Filters, Electrical"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
              <datalist id="category-suggestions">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Compatible Generator */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Compatible Generator
              </label>
              <input
                type="text"
                list="generator-suggestions"
                name="compatibleGenerator"
                value={formData.compatibleGenerator}
                onChange={handleChange}
                placeholder="e.g. Cummins 250 kVA, Perkins 125 kVA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
              <datalist id="generator-suggestions">
                {generatorOptions.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            {/* Qty Available */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Qty Available <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                name="qtyAvailable"
                value={formData.qtyAvailable}
                onChange={handleChange}
                placeholder="e.g. 25"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Reorder Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Unit Cost (₹) */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Unit Cost (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleChange}
                  placeholder="e.g. 1250.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="location-suggestions"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Main Yard / Warehouse"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
              <datalist id="location-suggestions">
                {COMMON_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            {/* Status */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
                  Status Override
                </span>
                <span className="text-xs text-slate-500">
                  Current computed status: {previewStatus}
                </span>
              </div>
              <select
                name="status"
                value={formData.status || "Auto"}
                onChange={handleChange}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium cursor-pointer"
              >
                <option value="Auto">Auto (Calculated)</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="e.g. Shelf A-3, Rack 2, OEM specification details..."
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
              className="px-6 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Part"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
