"use client";

import React, { useState } from "react";
import { Generator } from "@/lib/db/schema";
import {
  MapPin,
  Clock,
  Trash2,
  AlertCircle,
  Zap,
  Plus,
  Pencil,
  ExternalLink,
} from "lucide-react";

interface GeneratorTableProps {
  generators: Generator[];
  onEdit: (generator: Generator) => void;
  onDelete: (id: number) => Promise<void>;
  onOpenAddModal: () => void;
  onRowClick?: (generator: Generator) => void;
}

export function GeneratorTable({
  generators,
  onEdit,
  onDelete,
  onOpenAddModal,
  onRowClick,
}: GeneratorTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatCurrency = (val: string | number | null) => {
    if (!val) return "-";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return String(val);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getPurchasedYear = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const match = dateStr.match(/\b(19\d\d|20\d\d)\b/);
    if (match) return match[1];
    return dateStr;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        );
      case "on rent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            On Rent
          </span>
        );
      case "maintenance":
      case "under maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const handleDeleteClick = async (gen: Generator) => {
    if (confirm(`Are you sure you want to delete ${gen.generatorId} (${gen.name})?`)) {
      setDeletingId(gen.id);
      try {
        await onDelete(gen.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (generators.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
          <Zap className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          No generators found
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No generators match your search criteria. Try adjusting your search or add a new generator to your fleet.
        </p>
        <button
          onClick={onOpenAddModal}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Generator
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5">ID</th>
              <th className="py-3.5 px-4">Assert ID</th>
              <th className="py-3.5 px-4">Generator</th>
              <th className="py-3.5 px-4 hidden sm:table-cell">Capacity</th>
              <th className="py-3.5 px-4 hidden sm:table-cell">Location</th>
              <th className="py-3.5 px-4 hidden sm:table-cell">Purchased Year</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {generators.map((gen) => (
              <tr
                key={gen.id}
                onClick={() => onRowClick?.(gen)}
                className={`hover:bg-slate-50/70 transition-colors group ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {/* ID */}
                <td className="py-4 px-5 whitespace-nowrap">
                  <span className="font-mono font-semibold text-xs text-[#083a60] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap">
                    {gen.generatorId}
                  </span>
                </td>

                {/* Assert ID */}
                <td className="py-4 px-4 whitespace-nowrap">
                  {gen.assetId ? (
                    <span className="font-mono font-medium text-xs text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg inline-block">
                      {gen.assetId}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">—</span>
                  )}
                </td>

                {/* Generator Name & Model */}
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-900 leading-tight">
                    {gen.name}
                  </div>
                  {gen.model && (
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {gen.model}
                    </div>
                  )}
                </td>

                {/* Capacity */}
                <td className="py-4 px-4 hidden sm:table-cell">
                  <span className="font-bold text-slate-800">
                    {gen.capacityKva}
                  </span>
                  <span className="text-xs text-slate-500 ml-1 font-medium">
                    kVA
                  </span>
                </td>

                {/* Location */}
                <td className="py-4 px-4 hidden sm:table-cell">
                  {gen.location ? (
                    <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[160px]">
                        {gen.location}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>

                {/* Purchased Year */}
                <td className="py-4 px-4 hidden sm:table-cell whitespace-nowrap">
                  <div className="text-xs font-semibold text-slate-800">
                    {getPurchasedYear(gen.purchaseDate)}
                  </div>
                  {gen.purchaseCost && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatCurrency(gen.purchaseCost)}
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="py-4 px-4">{getStatusBadge(gen.status)}</td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    {gen.driveLink && (
                      <a
                        href={gen.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open Drive Link"
                        aria-label={`Open Drive link for ${gen.name}`}
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(gen);
                      }}
                      title="Edit generator"
                      aria-label={`Edit ${gen.name}`}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(gen);
                      }}
                      disabled={deletingId === gen.id}
                      title="Delete generator"
                      aria-label={`Delete ${gen.name}`}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table footer with count */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs font-medium text-slate-500 flex items-center justify-between">
        <span>Showing {generators.length} generator{generators.length === 1 ? "" : "s"}</span>
        <span className="text-[11px] text-slate-400">PowerOps Fleet Manager</span>
      </div>
    </div>
  );
}
