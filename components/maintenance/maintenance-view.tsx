"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Eye,
} from "lucide-react";
import { MaintenanceRecord, Generator } from "@/lib/db/schema";
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  CreateMaintenanceRecordInput,
  MaintenanceStats,
} from "@/app/maintenance/actions";
import { LogMaintenanceModal } from "./log-maintenance-modal";
import { DeleteMaintenanceModal } from "./delete-maintenance-modal";
import { MaintenanceDetailsModal } from "./maintenance-details-modal";

interface MaintenanceViewProps {
  initialRecords: MaintenanceRecord[];
  generators: Generator[];
  stats?: MaintenanceStats;
}

function formatRupee(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatServiceDate(dateStr: string): string {
  if (!dateStr) return "-";
  // If DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      const monthName = date.toLocaleDateString("en-GB", { month: "short" });
      return `${day} ${monthName} ${year}`;
    }
  }
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      const monthName = date.toLocaleDateString("en-GB", { month: "short" });
      return `${day} ${monthName} ${year}`;
    }
  }
  return dateStr;
}

export function MaintenanceView({
  initialRecords,
  generators,
}: MaintenanceViewProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>(initialRecords);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);
  const [recordToView, setRecordToView] = useState<MaintenanceRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleCreateRecord = async (data: CreateMaintenanceRecordInput) => {
    const res = await createMaintenanceRecord(data);
    if (res.success && res.data) {
      setRecords((prev) => [res.data as MaintenanceRecord, ...prev]);
      showNotification(`Service recorded for ${data.generatorName}`);
      return { success: true };
    }
    return {
      success: false,
      error: res.error || "Failed to create maintenance record",
    };
  };

  const handleDeleteRecord = async (id: number) => {
    const res = await deleteMaintenanceRecord(id);
    if (res.success) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showNotification("Maintenance record deleted");
    } else {
      alert("Error deleting record: " + (res.error || "Unknown error"));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#083a60] text-white px-4 py-2.5 rounded-xl shadow-lg border border-white/10 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Maintenance
          </h1>
          <p className="text-sm font-normal text-slate-500 mt-1">
            Log service, track costs &amp; service reminders
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Service</span>
        </button>
      </div>

      {/* Service History Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Service History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-6 py-4">
                  DATE
                </th>
                <th className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-6 py-4">
                  GENERATOR
                </th>
                <th className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-6 py-4">
                  TYPE
                </th>
                <th className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-6 py-4">
                  TECHNICIAN
                </th>
                <th className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-6 py-4">
                  TOTAL COST
                </th>
                <th className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-6 py-4 text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No maintenance records found. Click &quot;+ Log Service&quot; to add one.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4.5 text-sm text-slate-700 whitespace-nowrap font-normal">
                      {formatServiceDate(rec.serviceDate)}
                    </td>
                    <td
                      onClick={() => setRecordToView(rec)}
                      className="px-6 py-4.5 text-sm font-bold text-slate-900 whitespace-nowrap cursor-pointer hover:text-[#083a60] transition-colors"
                      title="Click to view details"
                    >
                      {rec.generatorName}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {rec.serviceType ? (
                          rec.serviceType
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((type, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2.5 py-0.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white shadow-2xs whitespace-nowrap"
                              >
                                {type}
                              </span>
                            ))
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-sm text-slate-700 whitespace-nowrap">
                      {rec.technician || "-"}
                    </td>
                    <td className="px-6 py-4.5 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formatRupee(rec.cost)}
                    </td>
                    <td className="px-6 py-4.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setRecordToView(rec)}
                          className="p-1.5 text-slate-500 hover:text-[#083a60] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View service details"
                          aria-label="View service details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {rec.pdfLink && (
                          <a
                            href={
                              rec.pdfLink.startsWith("http://") ||
                              rec.pdfLink.startsWith("https://")
                                ? rec.pdfLink
                                : `https://${rec.pdfLink}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#083a60] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            title="Open PDF Document"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        )}
                        <button
                          onClick={() => setRecordToDelete(rec)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete service log"
                          aria-label="Delete service log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Maintenance Modal */}
      <LogMaintenanceModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        generators={generators}
        onSubmit={handleCreateRecord}
      />

      {/* Maintenance Details Modal */}
      {recordToView && (
        <MaintenanceDetailsModal
          record={recordToView}
          isOpen={!!recordToView}
          onClose={() => setRecordToView(null)}
          onDeleteClick={(rec) => {
            setRecordToView(null);
            setRecordToDelete(rec);
          }}
          generator={
            recordToView.generatorId
              ? generators.find((g) => g.id === recordToView.generatorId)
              : null
          }
        />
      )}

      {/* Delete Maintenance Modal */}
      {recordToDelete && (
        <DeleteMaintenanceModal
          record={recordToDelete}
          isOpen={!!recordToDelete}
          onClose={() => setRecordToDelete(null)}
          onConfirm={handleDeleteRecord}
        />
      )}
    </div>
  );
}
