"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Sparkles, Package, AlertCircle } from "lucide-react";
import { CreateInventoryInput, getNextPartNumber } from "@/app/inventory/actions";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventoryInput) => Promise<{ success: boolean; error?: string }>;
  generatorOptions: string[];
}

const CATEGORIES = [
  { label: "Filters", prefix: "FLT" },
  { label: "Belts & Pulleys", prefix: "BLT" },
  { label: "Electrical", prefix: "ELC" },
  { label: "Coolant & Lubes", prefix: "LUB" },
  { label: "Batteries", prefix: "BAT" },
  { label: "Fuel System", prefix: "FUL" },
  { label: "Alternator Parts", prefix: "ALT" },
  { label: "Engine Components", prefix: "ENG" },
  { label: "General Hardware", prefix: "GEN" },
];

const COMMON_LOCATIONS = [
  "Chennai Main Warehouse",
  "OMR Site Store",
  "Guindy Central Workshop",
  "Ambattur Hub",
  "Sriperumbudur Site Store",
];

export function AddInventoryModal({
  isOpen,
  onClose,
  onSubmit,
  generatorOptions,
}: AddInventoryModalProps) {
  const [formData, setFormData] = useState<CreateInventoryInput>({
    partNumber: "",
    partName: "",
    model: "",
    category: "Filters",
    compatibleGenerator: "",
    qtyAvailable: 10,
    reorderLevel: 5,
    unitCost: 0,
    location: "Chennai Main Warehouse",
    status: "Auto",
    notes: "",
  });

  const [customGenerator, setCustomGenerator] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate next part number on category change or mount
  useEffect(() => {
    if (!isOpen) return;

    async function fetchNextCode() {
      const catObj = CATEGORIES.find((c) => c.label === formData.category);
      const prefix = catObj ? catObj.prefix : "PRT";
      const nextCode = await getNextPartNumber(prefix);
      setFormData((prev) => {
        // Only set if partNumber is empty or was previously auto-formatted
        if (!prev.partNumber || prev.partNumber.startsWith("PPD-")) {
          return { ...prev, partNumber: nextCode };
        }
        return prev;
      });
    }

    fetchNextCode();
  }, [isOpen, formData.category]);

  // Keyboard shortcut ESC
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

  const handleCategorySelect = (catLabel: string) => {
    setFormData((prev) => ({ ...prev, category: catLabel }));
  };

  // Preview computed status
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

    const finalCategory =
      formData.category === "Other" && customCategory.trim()
        ? customCategory.trim()
        : formData.category;

    const finalGenerator =
      formData.compatibleGenerator === "Other" && customGenerator.trim()
        ? customGenerator.trim()
        : formData.compatibleGenerator;

    const finalLocation =
      formData.location === "Other" && customLocation.trim()
        ? customLocation.trim()
        : formData.location;

    if (!formData.partNumber.trim()) {
      setError("Please provide a Part Number.");
      return;
    }
    if (!formData.partName.trim()) {
      setError("Please provide a Part Name.");
      return;
    }
    if (!finalGenerator || !finalGenerator.trim()) {
      setError("Please specify the Compatible Generator.");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit({
        ...formData,
        partNumber: formData.partNumber.trim().toUpperCase(),
        partName: formData.partName.trim(),
        model: formData.model?.trim() || null,
        category: finalCategory,
        compatibleGenerator: finalGenerator.trim(),
        location: finalLocation?.trim() || "Chennai Main Warehouse",
        qtyAvailable: Number(formData.qtyAvailable) || 0,
        reorderLevel: Number(formData.reorderLevel) || 0,
        unitCost: Number(formData.unitCost) || 0,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to add inventory item.");
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
      aria-labelledby="add-inventory-modal-title"
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
                id="add-inventory-modal-title"
                className="text-xl font-bold text-slate-900 tracking-tight"
              >
                Add New Inventory Item
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register a new spare part or consumable into warehouse stock
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Part Number <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const catObj = CATEGORIES.find((c) => c.label === formData.category);
                    const prefix = catObj ? catObj.prefix : "PRT";
                    const next = await getNextPartNumber(prefix);
                    setFormData((prev) => ({ ...prev, partNumber: next }));
                  }}
                  className="text-[11px] font-medium text-[#083a60] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Generate next sequence number"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Auto-generate
                </button>
              </div>
              <input
                type="text"
                name="partNumber"
                required
                value={formData.partNumber}
                onChange={handleChange}
                placeholder="e.g. PPD-FLT-001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all placeholder:text-slate-400"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all placeholder:text-slate-400"
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
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.label} value={cat.label}>
                      {cat.label}
                    </option>
                  ))}
                  <option value="Other">Other / Custom</option>
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
              {formData.category === "Other" && (
                <input
                  type="text"
                  placeholder="e.g. Electrical Components"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60]"
                />
              )}
            </div>

            {/* Compatible Generator */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Compatible Generator <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="compatibleGenerator"
                  value={formData.compatibleGenerator}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="">Select compatible generator...</option>
                  {generatorOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="Other">Other / Custom</option>
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
              {formData.compatibleGenerator === "Other" && (
                <input
                  type="text"
                  placeholder="e.g. Cummins 250 kVA, Perkins 125 kVA"
                  value={customGenerator}
                  onChange={(e) => setCustomGenerator(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60]"
                />
              )}
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
              <span className="text-[11px] text-slate-400 mt-1 block">
                Triggers &quot;Low Stock&quot; when qty falls to or below this
              </span>
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

            {/* Warehouse Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
                >
                  {COMMON_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="Other">Other / Custom</option>
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
              {formData.location === "Other" && (
                <input
                  type="text"
                  placeholder="e.g. Warehouse Bay 3, Shelf B"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60]"
                />
              )}
            </div>

            {/* Stock Status Selection & Preview */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
                  Stock Status
                </span>
                <span className="text-xs text-slate-500">
                  Auto-calculated from Qty Available ({qty}) vs Reorder Level ({reorder})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  name="status"
                  value={formData.status || "Auto"}
                  onChange={handleChange}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium cursor-pointer"
                >
                  <option value="Auto">Auto ({previewStatus})</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>

                {previewStatus === "In Stock" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    In Stock
                  </span>
                )}
                {previewStatus === "Low Stock" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Low Stock
                  </span>
                )}
                {previewStatus === "Out of Stock" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Notes / Shelf Location (full width) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-1.5">
                Notes &amp; Storage Details (Optional)
              </label>
              <textarea
                name="notes"
                rows={2}
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="e.g. Shelf A-3, Rack 2, OEM specification details..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all resize-y placeholder:text-slate-400"
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
                "Add Inventory Item"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
