"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { Customer, AdditionalPerson } from "@/lib/db/schema";
import { CreateCustomerInput } from "@/app/customers/actions";

interface EditCustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    id: number,
    data: Partial<CreateCustomerInput>
  ) => Promise<{ success: boolean; error?: string }>;
}

export function EditCustomerModal({
  customer,
  isOpen,
  onClose,
  onSubmit,
}: EditCustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerInput>(() => {
    const rawPhone = customer?.phone || "";
    const splitPhones = rawPhone.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
    const primaryPhone = splitPhones[0] || "";

    return {
      customerName: customer?.customerName || "",
      companyName: customer?.companyName || "",
      gstNumber: customer?.gstNumber || "",
      contactPerson: customer?.contactPerson || "",
      primaryPersonRole: customer?.primaryPersonRole || "",
      phone: primaryPhone,
      email: customer?.email || "",
      paymentTerms: customer?.paymentTerms || "Cash",
      billingAddress: customer?.billingAddress || "",
      siteAddress: customer?.siteAddress || "",
      notes: customer?.notes || "",
    };
  });

  const [additionalPersons, setAdditionalPersons] = useState<AdditionalPerson[]>(() => {
    if (
      customer?.additionalPersons &&
      Array.isArray(customer.additionalPersons) &&
      customer.additionalPersons.length > 0
    ) {
      return customer.additionalPersons;
    }
    const rawPhone = customer?.phone || "";
    const splitPhones = rawPhone.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
    if (splitPhones.length > 1) {
      return splitPhones.slice(1).map((p) => ({ name: "", role: "", phone: p }));
    }
    return [];
  });

  const [emails, setEmails] = useState<string[]>(() => {
    if (!customer?.email) return [""];
    const split = customer.email.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
    return split.length > 0 ? split : [""];
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

  if (!isOpen || !customer) return null;

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

  const handleAddPerson = () => {
    setAdditionalPersons((prev) => [...prev, { name: "", role: "", phone: "" }]);
  };

  const handlePersonChange = (
    index: number,
    field: keyof AdditionalPerson,
    val: string
  ) => {
    setAdditionalPersons((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemovePerson = (index: number) => {
    setAdditionalPersons((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddEmail = () => {
    setEmails((prev) => [...prev, ""]);
  };

  const handleEmailChange = (index: number, val: string) => {
    setEmails((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, idx) => idx !== index));
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
      const cleanPersons = additionalPersons
        .map((p) => ({
          name: p.name?.trim() || "",
          role: p.role?.trim() || undefined,
          phone: p.phone?.trim() || undefined,
        }))
        .filter((p) => p.name || p.phone || p.role);

      const combinedEmail = emails
        .map((e) => e.trim())
        .filter(Boolean)
        .join(", ");

      const res = await onSubmit(customer.id, {
        ...formData,
        phone: formData.phone?.trim() || undefined,
        email: combinedEmail || undefined,
        primaryPersonRole: formData.primaryPersonRole?.trim() || undefined,
        additionalPersons: cleanPersons,
        customerName: formData.customerName.trim() || formData.companyName.trim(),
        companyName: formData.companyName.trim() || formData.customerName.trim(),
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to update customer");
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
      aria-labelledby="edit-customer-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <h2
            id="edit-customer-modal-title"
            className="text-xl font-bold text-slate-900 tracking-tight"
          >
            Edit Customer
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
                placeholder="e.g. Rahul Sharma"
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
                placeholder="e.g. Acme Infra Projects Pvt Ltd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 2: Contact Person & Primary Person Role */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson || ""}
                onChange={handleChange}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Primary Person Role
              </label>
              <input
                type="text"
                name="primaryPersonRole"
                value={formData.primaryPersonRole || ""}
                onChange={handleChange}
                placeholder="e.g. Site Engineer, Manager, Director"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            {/* Row 3: Primary Phone & GST Number */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Contact Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber || ""}
                onChange={handleChange}
                placeholder="e.g. 27ABCDE1234F1Z5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all uppercase"
              />
            </div>

            {/* Row 4: Multi-email input */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-900">
                  Email Address{emails.length > 1 ? "es" : ""}
                </label>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#083a60] hover:text-[#0c4a7e] bg-blue-50/70 hover:bg-blue-100/70 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another email</span>
                </button>
              </div>
              <div className="space-y-2">
                {emails.map((em, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={em}
                      onChange={(e) => handleEmailChange(idx, e.target.value)}
                      placeholder={
                        idx === 0
                          ? "e.g. contact@acmeinfra.com (Primary Email)"
                          : `Secondary Email ${idx + 1}`
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                    />
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(idx)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Remove email"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 5: Payment Terms */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">
                Payment Terms
              </label>
              <div className="relative">
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms || "Cash"}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer"
                >
                  {formData.paymentTerms &&
                    !["Cash", "Gpay", "Cheque", "Online transfer"].includes(
                      formData.paymentTerms
                    ) && (
                      <option value={formData.paymentTerms}>
                        {formData.paymentTerms}
                      </option>
                    )}
                  <option value="Cash">Cash</option>
                  <option value="Gpay">Gpay</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online transfer">Online transfer</option>
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
            </div>

            {/* Additional Persons Section */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Additional Persons
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add other contact persons with their name, role, and number
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#083a60] hover:text-[#0c4a7e] bg-blue-50/70 hover:bg-blue-100/70 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another person</span>
                </button>
              </div>

              {additionalPersons.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500">
                  No additional persons added. Click &quot;Add another person&quot; above to add more contacts.
                </div>
              ) : (
                <div className="space-y-3">
                  {additionalPersons.map((person, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          Person #{idx + 2}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePerson(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove person"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => handlePersonChange(idx, "name", e.target.value)}
                            placeholder="e.g. Amit Sharma"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Role
                          </label>
                          <input
                            type="text"
                            value={person.role || ""}
                            onChange={(e) => handlePersonChange(idx, "role", e.target.value)}
                            placeholder="e.g. Site Supervisor"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Number
                          </label>
                          <input
                            type="tel"
                            value={person.phone || ""}
                            onChange={(e) => handlePersonChange(idx, "phone", e.target.value)}
                            placeholder="e.g. +91 98765 43211"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                placeholder="e.g. Plot No. 42, Industrial Area, Phase II, Mumbai 400001"
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
                placeholder="e.g. Metro Line Construction Site, Pillar 104, Mumbai"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all resize-y"
              />
            </div>

            {/* Note input field */}
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
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
