"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ReturnRecord } from "@/lib/db/schema";

interface DeleteReturnModalProps {
  returnRecord: ReturnRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteReturnModal({
  returnRecord,
  isOpen,
  onClose,
  onConfirm,
}: DeleteReturnModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !returnRecord) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm(returnRecord.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Delete Return Record
            </h3>
            <p className="text-xs text-slate-500">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Are you sure you want to delete return record{" "}
          <span className="font-semibold text-slate-900 font-mono">
            {returnRecord.returnNumber}
          </span>{" "}
          for rental order{" "}
          <span className="font-semibold text-slate-900">
            {returnRecord.orderNumber}
          </span>{" "}
          ({returnRecord.customerName})?
        </p>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Delete Record</span>
          </button>
        </div>
      </div>
    </div>
  );
}
