"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { CreateCustomerInput } from "@/app/customers/actions";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomerInput) => Promise<{ success: boolean; error?: string }>;
}

export function AddCustomerModal({
  isOpen,
  onClose,
  onSubmit,
}: AddCustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerInput>({
    customerName: "",
    companyName: "",
    gstNumber: "",
    contactPerson: "",
    phone: "",
    email: "",
    paymentTerms: "Net 30",
    outstandingAmount: "0",
    billingAddress: "",
    siteAddress: "",
  });

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.customerName.trim() && !formData.companyName.trim()) {
      setError("Please provide at least a Customer Name or Company Name");
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit({
        ...formData,
        customerName: formData.customerName.trim() || formData.companyName.trim(),
        companyName: formData.companyName.trim() || formData.customerName.trim(),
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to create customer");
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
      aria-labelledby="add-customer-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <h2
            id="add-customer-modal-title"
            className="text-xl font-bold text-slate-900 tracking-tight"
          >
            Add Customer
          </h2>
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
          className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4"
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {/* Row 1: Customer Name & Company Name */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Customer Name
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 2: GST Number & Contact Person */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber || ""}
                onChange={handleChange}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson || ""}
                onChange={handleChange}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 3: Phone & Email */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 4: Payment Terms & Outstanding Amount (₹) */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Payment Terms
              </label>
              <input
                type="text"
                name="paymentTerms"
                value={formData.paymentTerms || "Net 30"}
                onChange={handleChange}
                placeholder="Net 30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Outstanding Amount (₹)
              </label>
              <input
                type="number"
                name="outstandingAmount"
                value={formData.outstandingAmount}
                onChange={handleChange}
                min="0"
                step="any"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 5: Billing Address (full width) */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Billing Address
              </label>
              <textarea
                name="billingAddress"
                rows={2}
                value={formData.billingAddress || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all resize-y"
              />
            </div>

            {/* Row 6: Site Address (full width) */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Site Address
              </label>
              <textarea
                name="siteAddress"
                rows={2}
                value={formData.siteAddress || ""}
                onChange={handleChange}
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
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
                "Add"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
