"use client";

import React from "react";
import { X, Printer, CreditCard, Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Invoice } from "@/lib/db/schema";
import { formatINR, formatDate } from "./invoices-table";

interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export function InvoiceDetailsModal({
  invoice,
  isOpen,
  onClose,
  onRecordPayment,
}: InvoiceDetailsModalProps) {
  if (!isOpen || !invoice) return null;

  const total = parseFloat(invoice.totalAmount) || 0;
  const paid = parseFloat(invoice.paidAmount) || 0;
  const balance = parseFloat(invoice.balanceAmount) || 0;
  const subtotal = parseFloat(invoice.subtotal) || 0;
  const gst = parseFloat(invoice.gstAmount) || 0;
  const transport = parseFloat(invoice.transportCharges) || 0;
  const additional = parseFloat(invoice.additionalCharges) || 0;

  const cgst = (gst / 2).toFixed(2);
  const sgst = (gst / 2).toFixed(2);

  const today = new Date().toISOString().split("T")[0];
  const isOverdue = balance > 0 && invoice.dueDate && invoice.dueDate < today;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto p-6 sm:p-10 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none">
        {/* Top Action Bar (hidden in print) */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tax Invoice Document
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 font-mono">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download</span>
            </button>
            {balance > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="overflow-y-auto pr-1 pt-6 space-y-6 flex-1 print:overflow-visible">
          {/* Company & Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-400 text-slate-950 shadow-xs shrink-0">
                  <Zap className="w-5 h-5 fill-slate-950 stroke-slate-950" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                    PTP CONNECT
                  </h1>
                  <span className="text-[11px] font-medium text-slate-500">
                    Power To Power Generator Solutions
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-3 space-y-0.5">
                <p>No. 42, Industrial Estate, Guindy</p>
                <p>Chennai, Tamil Nadu 600032, India</p>
                <p className="font-semibold text-slate-700">GSTIN: 33AAACP1234F1Z1</p>
                <p>Email: accounts@ptpconnect.in | Tel: +91 98400 12345</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-md bg-[#083a60] text-white text-xs font-bold uppercase tracking-wider">
                ORIGINAL TAX INVOICE
              </span>
              <div className="pt-2">
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500">
                  Date: <span className="font-medium text-slate-800">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Due:{" "}
                  <span
                    className={
                      isOverdue
                        ? "font-semibold text-rose-600"
                        : "font-medium text-slate-800"
                    }
                  >
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
                {invoice.orderNumber && (
                  <div className="text-xs text-slate-500">
                    Ref Order: <span className="font-mono text-slate-800 font-semibold">{invoice.orderNumber}</span>
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  Terms: <span className="font-medium text-slate-800">{invoice.paymentTerms || "Net 30"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Billed To:
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {invoice.customerName}
              </h3>
              {invoice.customerGst && (
                <div className="text-xs text-slate-600 font-mono mt-1">
                  GSTIN: <span className="font-semibold text-slate-800">{invoice.customerGst}</span>
                </div>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Status:
              </span>
              <div className="mt-1 flex items-center gap-2">
                {balance <= 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Paid in Full
                  </span>
                ) : isOverdue ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Overdue Payment
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Payment
                  </span>
                )}
              </div>
              {invoice.notes && (
                <p className="text-xs text-slate-500 italic mt-2">
                  &ldquo;{invoice.notes}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Description / Particulars</th>
                  <th className="py-2.5 px-4 text-center">SAC Code</th>
                  <th className="py-2.5 px-4 text-right">Taxable Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">1</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">
                      Diesel Generator Rental Services
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {invoice.notes || `DG Set deployment under order ${invoice.orderNumber || "hire contract"}`}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                    997312
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatINR(subtotal)}
                  </td>
                </tr>

                {transport > 0 && (
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">2</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        Heavy Transport &amp; Crane Mobilization
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Site delivery and loading charges
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                      996511
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatINR(transport)}
                    </td>
                  </tr>
                )}

                {additional > 0 && (
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">3</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        Additional Operations &amp; Site Accessories
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                      997312
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatINR(additional)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Bank Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Wire Transfer Details */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                Bank Remittance Details:
              </span>
              <p><span className="font-medium text-slate-700">Account Name:</span> Power To Power Generator Solutions Pvt Ltd</p>
              <p><span className="font-medium text-slate-700">Bank:</span> HDFC Bank Ltd</p>
              <p><span className="font-medium text-slate-700">Account No:</span> 50200084920194</p>
              <p><span className="font-medium text-slate-700">IFSC Code:</span> HDFC0001234</p>
              <p><span className="font-medium text-slate-700">Branch:</span> Guindy Industrial Estate, Chennai</p>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Taxable Value:</span>
                <span className="font-medium">{formatINR(subtotal + transport + additional)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-xs">
                <span className="text-slate-500">CGST (9%):</span>
                <span>{formatINR(cgst)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-xs">
                <span className="text-slate-500">SGST (9%):</span>
                <span>{formatINR(sgst)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b-2 border-slate-300 font-bold text-base text-slate-900">
                <span>Invoice Total:</span>
                <span className="text-[#083a60]">{formatINR(total)}</span>
              </div>
              <div className="flex justify-between py-1 text-xs text-emerald-700 font-semibold">
                <span>Amount Paid:</span>
                <span>{formatINR(paid)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-sm">
                <span className="text-slate-800">Balance Due:</span>
                <span className={balance > 0 ? "text-rose-600" : "text-slate-600"}>
                  {formatINR(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            Thank you for your business. This is a computer-generated tax invoice and requires no physical signature.
          </div>
        </div>
      </div>
    </div>
  );
}
