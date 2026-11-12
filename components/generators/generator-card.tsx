"use client";

import React from "react";
import { Generator } from "@/lib/db/schema";
import { Cpu, ExternalLink } from "lucide-react";

interface GeneratorCardProps {
  generator: Generator;
  onClick: () => void;
}

export function GeneratorCard({ generator, onClick }: GeneratorCardProps) {
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "available") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
          Available
        </span>
      );
    }
    if (s === "breakdown") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200/80">
          Breakdown
        </span>
      );
    }
    if (s === "maintenance" || s === "under maintenance") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          Maintenance
        </span>
      );
    }
    if (s === "on rent") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
          On Rent
        </span>
      );
    }
    if (s === "sales" || s === "sold") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
          Sales
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Header: Icon + ID/Brand + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Blue Icon box with yellow CPU */}
            <div className="w-11 h-11 rounded-xl bg-[#0c4a7e] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-amber-400 stroke-[2.3]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 text-sm tracking-tight leading-tight truncate">
                  {generator.generatorId}
                </span>
                {generator.assetId && (
                  <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {generator.assetId}
                  </span>
                )}
              </div>
              {generator.model && (
                <span className="text-xs text-slate-500 font-medium truncate mt-0.5">
                  {generator.model}
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">{getStatusBadge(generator.status)}</div>
        </div>

        {/* Generator Name */}
        <h3 className="font-bold text-base text-slate-900 mt-4 leading-snug line-clamp-1 group-hover:text-[#083a60] transition-colors">
          {generator.name}
        </h3>
      </div>

      {/* Info specs rows matching Screenshot */}
      <div className="mt-5 pt-3 border-t border-slate-100/80 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Capacity: </span>
            <span className="font-bold text-slate-800">
              {parseFloat(String(generator.capacityKva))} kVA
            </span>
          </div>
          <div>
            <span className="text-slate-500">Purchased Hours: </span>
            <span className="font-bold text-slate-800">
              {(generator.currentHours ?? 0)}h
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="truncate">
            <span className="text-slate-500">Current Location: </span>
            <span className="font-bold text-slate-800">
              {generator.currentLocation || (generator.status?.toLowerCase() === "sales" ? "—" : "Main Yard")}
            </span>
          </div>
          {generator.driveLink && (
            <a
              href={generator.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:text-blue-800 shrink-0 p-0.5"
              title="Open Drive Link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
