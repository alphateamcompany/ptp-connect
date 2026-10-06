"use client";

import React, { useState } from "react";
import { X, Calendar, Loader2, FileText, ChevronDown } from "lucide-react";
import { Customer, RentalOrder } from "@/lib/db/schema";
import { CreateInvoiceInput } from "@/app/finance/actions";
import { formatINR } from "./invoices-table";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvoiceInput) => Promise<{ success: boolean; error?: string }>;
  rentalOrders: RentalOrder[];
  customers: Customer[];
  preselectedCustomer?: Customer | null;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDefaultDueDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  rentalOrders,
  customers,
  preselectedCustomer,
}: CreateInvoiceModalProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerGst, setCustomerGst] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>(getTodayDateString);
  const [dueDate, setDueDate] = useState<string>(getDefaultDueDateString);
  const [paymentTerms, setPaymentTerms] = useState<string>("Net 30");
  const [subtotal, setSubtotal] = useState<string>("0");
  const [gstAmount, setGstAmount] = useState<string>("0");
  const [transportCharges, setTransportCharges] = useState<string>("0");
  const [additionalCharges, setAdditionalCharges] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When opened with preselected customer, adjust state during render
  const [prevCustomer, setPrevCustomer] = useState(preselectedCustomer);
  if (prevCustomer !== preselectedCustomer) {
    setPrevCustomer(preselectedCustomer);
    if (preselectedCustomer) {
      setSelectedCustomerId(String(preselectedCustomer.id));
      setCustomerName(preselectedCustomer.companyName || preselectedCustomer.customerName);
      setCustomerGst(preselectedCustomer.gstNumber || "");
      if (preselectedCustomer.paymentTerms) {
        setPaymentTerms(preselectedCustomer.paymentTerms);
      }
    }
  }

  // When order is selected, auto-fill all financial breakdown!
  const handleOrderChange = (orderIdStr: string) => {
    setSelectedOrderId(orderIdStr);
    if (!orderIdStr) return;

    const order = rentalOrders.find((o) => String(o.id) === orderIdStr);
    if (order) {
      setCustomerName(order.customerName);
      if (order.customerId) {
        setSelectedCustomerId(String(order.customerId));
      }
      // Look up customer GST
      const matchingCust = customers.find(
        (c) =>
          c.id === order.customerId ||
          c.companyName?.toLowerCase() === order.customerName.toLowerCase()
      );
      if (matchingCust) {
        setCustomerGst(matchingCust.gstNumber || "");
        if (matchingCust.paymentTerms) setPaymentTerms(matchingCust.paymentTerms);
      }

      const rentalCharge = parseFloat(order.rentalCharge) || 0;
      const gst = parseFloat(order.gstAmount) || Math.round(rentalCharge * 0.18);
      const transport = parseFloat(order.transportCharges || "0") || 0;

      setSubtotal(String(rentalCharge));
      setGstAmount(String(gst));
      setTransportCharges(String(transport));
      setNotes(`Rental Order ${order.orderNumber} - ${order.generatorName} (${order.startDate} to ${order.endDate})`);
    }
  };

  const handleCustomerChange = (custIdStr: string) => {
    setSelectedCustomerId(custIdStr);
    const cust = customers.find((c) => String(c.id) === custIdStr);
    if (cust) {
      setCustomerName(cust.companyName || cust.customerName);
      setCustomerGst(cust.gstNumber || "");
      if (cust.paymentTerms) setPaymentTerms(cust.paymentTerms);
    }
  };

  // Auto calculate GST if subtotal changes manually
  const handleSubtotalChange = (val: string) => {
    setSubtotal(val);
    const num = parseFloat(val) || 0;
    const calcGst = Math.round(num * 0.18);
    setGstAmount(String(calcGst));
  };

  const totalCalculated =
    (parseFloat(subtotal) || 0) +
    (parseFloat(gstAmount) || 0) +
    (parseFloat(transportCharges) || 0) +
    (parseFloat(additionalCharges) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Please select or enter a customer name.");
      return;
    }
    if (totalCalculated <= 0) {
      setError("Invoice total must be greater than zero.");
      return;
    }

    setLoading(true);
    setError(null);

    const order = selectedOrderId
      ? rentalOrders.find((o) => String(o.id) === selectedOrderId)
      : null;

    const res = await onSubmit({
      orderId: order ? order.id : null,
      orderNumber: order ? order.orderNumber : undefined,
      customerId: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
      customerName: customerName.trim(),
      customerGst: customerGst.trim() || undefined,
      issueDate,
      dueDate,
      subtotal,
      gstAmount,
      transportCharges,
      additionalCharges,
      totalAmount: String(totalCalculated),
      paymentTerms,
      notes,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to create invoice");
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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto p-6 sm:p-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#083a60] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Generate Tax Invoice
              </h2>
              <p className="text-xs text-slate-500">
                Link to a rental order or issue a custom invoice
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

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto pr-1 flex-1">
          {/* Link to Rental Order */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Link Rental Order (Optional)
            </label>
            <div className="relative">
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60] appearance-none"
              >
                <option value="">-- No Rental Order (Custom Invoice) --</option>
                {rentalOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNumber} • {ord.customerName} ({ord.generatorName})
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
                Customer / Client *
              </label>
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60] appearance-none"
                >
                  <option value="">-- Select Registered Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.customerName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Custom Customer Name if not selected */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Billed Company Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. BuildPro Constructions"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* GST Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Customer GSTIN
              </label>
              <input
                type="text"
                value={customerGst}
                onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                placeholder="27ABCDE1234F1Z5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
              />
            </div>

            {/* Issue Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Invoice Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payment Due Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Subtotal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Base Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={subtotal}
                onChange={(e) => handleSubtotalChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
              />
            </div>

            {/* GST (18%) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                GST 18% (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
              />
            </div>

            {/* Transport */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Transport (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={transportCharges}
                onChange={(e) => setTransportCharges(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
              />
            </div>

            {/* Additional */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Other (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={additionalCharges}
                onChange={(e) => setAdditionalCharges(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
              />
            </div>
          </div>

          {/* Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
              >
                <option value="Cash">Cash on Delivery</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Immediate">Immediate / Advance</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Invoice Notes / Particulars
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. DG Set hire for July cycle"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#083a60]/20 focus:border-[#083a60]"
              />
            </div>
          </div>

          {/* Total Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Gross Total (Inc. Taxes & Transport):</span>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Calculated automatically based on line charges
              </div>
            </div>
            <div className="text-xl font-bold text-[#083a60]">
              {formatINR(totalCalculated)}
            </div>
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
              className="px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Invoice...
                </>
              ) : (
                "Create Tax Invoice"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
