"use client";

import React, { useState } from "react";
import { X, Calendar, Loader2, CreditCard, ChevronDown } from "lucide-react";
import { Customer, Invoice } from "@/lib/db/schema";
import { RecordPaymentInput } from "@/app/finance/actions";
import { formatINR } from "./invoices-table";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecordPaymentInput) => Promise<{ success: boolean; error?: string }>;
  invoices: Invoice[];
  customers: Customer[];
  preselectedInvoice?: Invoice | null;
  preselectedCustomer?: Customer | null;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  invoices,
  customers,
  preselectedInvoice,
  preselectedCustomer,
}: RecordPaymentModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString);
  const [paymentMethod, setPaymentMethod] = useState<string>("NEFT / RTGS");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevSelection, setPrevSelection] = useState<{
    inv?: Invoice | null;
    cust?: Customer | null;
  }>({
    inv: preselectedInvoice,
    cust: preselectedCustomer,
  });

  if (
    prevSelection.inv !== preselectedInvoice ||
    prevSelection.cust !== preselectedCustomer
  ) {
    setPrevSelection({ inv: preselectedInvoice, cust: preselectedCustomer });
    if (preselectedInvoice) {
      setSelectedInvoiceId(String(preselectedInvoice.id));
      setCustomerName(preselectedInvoice.customerName);
      if (preselectedInvoice.customerId) {
        setSelectedCustomerId(String(preselectedInvoice.customerId));
      }
      setAmount(String(parseFloat(preselectedInvoice.balanceAmount) || 0));
      setNotes(`Payment for ${preselectedInvoice.invoiceNumber}`);
    } else if (preselectedCustomer) {
      setSelectedCustomerId(String(preselectedCustomer.id));
      setCustomerName(preselectedCustomer.companyName || preselectedCustomer.customerName);
      const balance = parseFloat(preselectedCustomer.outstandingAmount || "0") || 0;
      setAmount(balance > 0 ? String(balance) : "");
      setNotes(`Payment from ${preselectedCustomer.companyName}`);
    }
  }

  const handleInvoiceChange = (invIdStr: string) => {
    setSelectedInvoiceId(invIdStr);
    if (!invIdStr) return;

    const inv = invoices.find((i) => String(i.id) === invIdStr);
    if (inv) {
      setCustomerName(inv.customerName);
      if (inv.customerId) {
        setSelectedCustomerId(String(inv.customerId));
      }
      const balance = parseFloat(inv.balanceAmount) || 0;
      setAmount(String(balance));
      setNotes(`Settlement for ${inv.invoiceNumber}`);
    }
  };

  const handleCustomerChange = (custIdStr: string) => {
    setSelectedCustomerId(custIdStr);
    const cust = customers.find((c) => String(c.id) === custIdStr);
    if (cust) {
      setCustomerName(cust.companyName || cust.customerName);
      const balance = parseFloat(cust.outstandingAmount || "0") || 0;
      if (balance > 0 && !amount) {
        setAmount(String(balance));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }
    if (!customerName.trim()) {
      setError("Please select or enter the customer name.");
      return;
    }

    setLoading(true);
    setError(null);

    const inv = selectedInvoiceId
      ? invoices.find((i) => String(i.id) === selectedInvoiceId)
      : null;

    const res = await onSubmit({
      invoiceId: inv ? inv.id : null,
      invoiceNumber: inv ? inv.invoiceNumber : undefined,
      customerId: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
      customerName: customerName.trim(),
      amount: String(numAmount),
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || null,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to record payment");
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Record Payment / Collection
              </h2>
              <p className="text-xs text-slate-500">
                Log receipt against an invoice or customer balance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Link to Invoice */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Select Invoice (Optional)
            </label>
            <div className="relative">
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 appearance-none"
              >
                <option value="">-- General / Direct Customer Payment --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} • {inv.customerName} (Bal: {formatINR(inv.balanceAmount)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Customer *
              </label>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 appearance-none"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.customerName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Custom Customer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. BuildPro Constructions"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payment Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payment Mode *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="NEFT / RTGS">NEFT / RTGS Bank Transfer</option>
                <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                <option value="Bank Transfer">Direct IMPS / Bank Transfer</option>
                <option value="Cheque">Cheque Deposit</option>
                <option value="Cash">Cash Receipt</option>
              </select>
            </div>

            {/* Reference Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Ref / UTR / Cheque #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. HDFC928172901"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Part payment received via NEFT"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Payment...
                </>
              ) : (
                "Save Payment Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
