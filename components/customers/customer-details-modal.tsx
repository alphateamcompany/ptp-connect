"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Pencil,
  Trash2,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  CreditCard,
  Calendar,
  IndianRupee,
  Copy,
  Check,
} from "lucide-react";
import { Customer } from "@/lib/db/schema";
import { formatIndianCurrency } from "./customer-table";

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomerDetailsModal({
  customer,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: CustomerDetailsModalProps) {
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !customer) return null;

  const phoneNumbers = customer.phone
    ? customer.phone
        .split(/[,;\n]+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const emailList = customer.email
    ? customer.email
        .split(/[,;\n]+/)
        .map((e) => e.trim())
        .filter(Boolean)
    : [];

  const handleCopyPhone = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedPhone(num);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleCopyEmail = (em: string) => {
    navigator.clipboard.writeText(em);
    setCopiedEmail(em);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-details-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#e3ecf5] flex items-center justify-center text-[#255b88] shrink-0 border border-[#d2dfed]">
              <Building2 className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <h2
                id="customer-details-modal-title"
                className="text-xl font-bold text-slate-900 tracking-tight"
              >
                {customer.companyName || customer.customerName}
              </h2>
              {customer.customerName && (
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Customer: {customer.customerName}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Payment Terms
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 inline-flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-slate-500" />
                {customer.paymentTerms || "Cash"}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Outstanding Due
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 inline-flex items-center gap-1">
                <IndianRupee className="w-4 h-4 text-slate-500" />
                {formatIndianCurrency(customer.outstandingAmount)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Customer Since
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Contact Information
            </h3>
            <div className="bg-white border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {/* Contact Person */}
              <div className="p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 block">Primary Contact Person</span>
                    {customer.primaryPersonRole && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                        {customer.primaryPersonRole}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                    {customer.contactPerson || "Not specified"}
                  </span>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 block mb-1">
                    Phone Number{phoneNumbers.length > 1 ? "s" : ""}
                  </span>
                  {phoneNumbers.length === 0 ? (
                    <span className="text-sm text-slate-400">Not specified</span>
                  ) : (
                    <div className="space-y-1.5">
                      {phoneNumbers.map((phone, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 bg-slate-50/70 hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 transition-colors"
                        >
                          <a
                            href={`tel:${phone}`}
                            className="text-sm font-medium text-slate-800 hover:text-[#083a60] transition-colors"
                          >
                            {phone}
                            {index === 0 && phoneNumbers.length > 1 && (
                              <span className="ml-2 text-[10px] font-semibold text-[#083a60] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(phone)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                            title="Copy phone number"
                          >
                            {copiedPhone === phone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 block mb-1">
                    Email Address{emailList.length > 1 ? "es" : ""}
                  </span>
                  {emailList.length === 0 ? (
                    <span className="text-sm text-slate-400">Not specified</span>
                  ) : (
                    <div className="space-y-1.5">
                      {emailList.map((email, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 bg-slate-50/70 hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 transition-colors"
                        >
                          <a
                            href={`mailto:${email}`}
                            className="text-sm font-medium text-slate-800 hover:text-[#083a60] hover:underline transition-colors truncate"
                          >
                            {email}
                            {index === 0 && emailList.length > 1 && (
                              <span className="ml-2 text-[10px] font-semibold text-[#083a60] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(email)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer shrink-0"
                            title="Copy email address"
                          >
                            {copiedEmail === email ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Persons */}
          {customer.additionalPersons &&
            Array.isArray(customer.additionalPersons) &&
            customer.additionalPersons.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Additional Persons ({customer.additionalPersons.length})
                </h3>
                <div className="bg-white border border-slate-200/80 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {customer.additionalPersons.map((person, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {person.name || `Person #${idx + 2}`}
                            </span>
                            {person.role && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                {person.role}
                              </span>
                            )}
                          </div>
                          {person.phone ? (
                            <div className="mt-1 flex items-center gap-2">
                              <a
                                href={`tel:${person.phone}`}
                                className="text-xs sm:text-sm font-medium text-slate-700 hover:text-[#083a60] inline-flex items-center gap-1.5 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{person.phone}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(person.phone!)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                title="Copy phone number"
                              >
                                {copiedPhone === person.phone ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 mt-1 block">
                              No phone number
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Tax & GST Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tax &amp; Identification
            </h3>
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">GST Number</span>
                <span className="text-sm font-semibold text-slate-900 tracking-wide font-mono">
                  {customer.gstNumber || "Not registered / None"}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Addresses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Billing Address */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 block mb-0.5">Billing Address</span>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {customer.billingAddress || "No billing address provided"}
                  </p>
                </div>
              </div>

              {/* Site Address */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 block mb-0.5">Site Address</span>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {customer.siteAddress || "No site address provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Note
              </h4>
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-[#f8fafc]/60 text-sm text-slate-700 whitespace-pre-wrap">
                {customer.notes}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => onDelete(customer)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Customer</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onEdit(customer)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
