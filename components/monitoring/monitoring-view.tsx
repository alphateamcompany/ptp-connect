"use client";

import React, { useState } from "react";
import {
  Plus,
  Clock,
  Fuel,
  AlertTriangle,
  FileText,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { SiteLog, RentalOrder } from "@/lib/db/schema";
import { NewSiteLogModal } from "./new-site-log-modal";
import { DeleteSiteLogModal } from "./delete-site-log-modal";
import {
  createSiteLog,
  deleteSiteLog,
  CreateSiteLogInput,
} from "@/app/monitoring/actions";

interface MonitoringViewProps {
  initialLogs: SiteLog[];
  rentalOrders: RentalOrder[];
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  if (/[a-zA-Z]/.test(dateStr)) return dateStr;

  // DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  // YYYY-MM-DD
  const isoParts = dateStr.split("-");
  if (isoParts.length === 3) {
    const year = parseInt(isoParts[0], 10);
    const month = parseInt(isoParts[1], 10) - 1;
    const day = parseInt(isoParts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  return dateStr;
}

export function MonitoringView({
  initialLogs,
  rentalOrders,
}: MonitoringViewProps) {
  const [logs, setLogs] = useState<SiteLog[]>(initialLogs);
  const [prevInitial, setPrevInitial] = useState(initialLogs);
  if (prevInitial !== initialLogs) {
    setPrevInitial(initialLogs);
    setLogs(initialLogs);
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<SiteLog | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Metrics calculations
  const totalRuntime = logs.reduce((sum, log) => sum + (Number(log.runningHours) || 0), 0);
  const totalDieselFilled = logs.reduce((sum, log) => sum + (Number(log.dieselFilled) || 0), 0);
  const breakdownsCount = logs.filter(
    (log) => log.breakdownReport && log.breakdownReport.trim().length > 0
  ).length;
  const totalLogsCount = logs.length;

  const handleCreateLog = async (data: CreateSiteLogInput) => {
    const res = await createSiteLog(data);
    if (res.success && res.data) {
      const created = res.data as SiteLog;
      setLogs((prev) => [created, ...prev]);
      showNotification(`Site log for ${created.orderNumber} saved successfully`);
      return { success: true };
    }
    return {
      success: false,
      error: res.error || "Failed to save site log",
    };
  };

  const handleDeleteConfirm = async (id: number) => {
    const res = await deleteSiteLog(id);
    if (res.success) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
      showNotification("Site log deleted successfully");
    } else {
      alert(res.error || "Failed to delete site log");
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 lg:top-6 left-4 right-4 lg:left-auto lg:right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Site Monitoring
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Daily logs from field operators
          </p>
        </div>

        {/* "+ Add Log" button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Log</span>
        </button>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Total Runtime */}
        <div className="relative overflow-hidden bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 border-l-4 border-l-[#0284c7]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                TOTAL RUNTIME
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-1">
                {totalRuntime}h
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Across sites
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#083a60] text-white flex items-center justify-center shadow-xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Diesel Filled */}
        <div className="relative overflow-hidden bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                DIESEL FILLED
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-1">
                {totalDieselFilled}L
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Cumulative
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
              <Fuel className="w-5 h-5 stroke-[2.25]" />
            </div>
          </div>
        </div>

        {/* Breakdowns */}
        <div className="relative overflow-hidden bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                BREAKDOWNS
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-1">
                {breakdownsCount}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Reported
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Logs */}
        <div className="relative overflow-hidden bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 border-l-4 border-l-[#083a60]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                TOTAL LOGS
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-1">
                {totalLogsCount}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Recorded
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#083a60] text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Site Logs Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Recent Site Logs
          </h2>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              No site logs yet
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Record daily runtime, fuel usage, and operator logs from field operations.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Log
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    DATE
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    RENTAL / SITE
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    HOURS
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    FUEL +/-
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    REMARKS
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4.5 text-sm font-medium text-slate-700 whitespace-nowrap">
                      {formatDisplayDate(log.logDate)}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-sm text-slate-900">
                        {log.orderNumber} &mdash; {log.customerName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {log.generatorName}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 font-bold text-sm text-slate-900 whitespace-nowrap">
                      {log.runningHours}h
                    </td>
                    <td className="px-6 py-4.5 text-sm whitespace-nowrap">
                      <span className="font-semibold text-emerald-600">
                        +{log.dieselFilled}L
                      </span>{" "}
                      <span className="text-slate-500 font-medium">
                        / {log.dieselBalance}L
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-sm text-slate-500 max-w-xs">
                      {log.operatorRemarks ? (
                        <span>{log.operatorRemarks}</span>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                      {log.breakdownReport && (
                        <div className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{log.breakdownReport}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setLogToDelete(log)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.75]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Site Log Modal */}
      {isAddModalOpen && (
        <NewSiteLogModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          rentalOrders={rentalOrders}
          onSubmit={handleCreateLog}
        />
      )}

      {/* Delete Confirmation Modal */}
      {logToDelete && (
        <DeleteSiteLogModal
          log={logToDelete}
          isOpen={Boolean(logToDelete)}
          onClose={() => setLogToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
