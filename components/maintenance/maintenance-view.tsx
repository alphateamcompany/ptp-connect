"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench,
  AlertTriangle,
  Cpu,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { MaintenanceRecord, Generator } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  CreateMaintenanceRecordInput,
  MaintenanceStats,
} from "@/app/maintenance/actions";
import { LogMaintenanceModal } from "./log-maintenance-modal";
import { DeleteMaintenanceModal } from "./delete-maintenance-modal";

interface MaintenanceViewProps {
  initialRecords: MaintenanceRecord[];
  generators: Generator[];
  stats: MaintenanceStats;
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
  stats: initialStats,
}: MaintenanceViewProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>(initialRecords);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Dynamically calculate total services and total cost from records state
  const totalServices = records.length;
  const totalCost = useMemo(() => {
    return records.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
  }, [records]);

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

      {/* Metric Cards (4 cards in a row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* TOTAL SERVICES */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-xs rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0284c7]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                TOTAL SERVICES
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {totalServices}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                All time
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#083a60] text-white shadow-xs shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* TOTAL COST */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-xs rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#eab308]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                TOTAL COST
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {formatRupee(totalCost)}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Maintenance spend
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#eab308] text-slate-950 font-bold text-xl shadow-xs shrink-0">
              ₹
            </div>
          </div>
        </Card>

        {/* DUE FOR SERVICE */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-xs rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#dc2626]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                DUE FOR SERVICE
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {initialStats.dueForService}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                &gt;3000 hrs
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#dc2626] text-white shadow-xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* UNDER MAINTENANCE */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-xs rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#083a60]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                UNDER MAINTENANCE
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {initialStats.underMaintenance}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Right now
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#083a60] text-white shadow-xs shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </Card>
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
                  COST
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
                    <td className="px-6 py-4.5 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {rec.generatorName}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="inline-block px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white shadow-2xs">
                        {rec.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-sm text-slate-700 whitespace-nowrap">
                      {rec.technician || "-"}
                    </td>
                    <td className="px-6 py-4.5 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {formatRupee(rec.cost)}
                    </td>
                    <td className="px-6 py-4.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setRecordToDelete(rec)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete service log"
                        aria-label="Delete service log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
