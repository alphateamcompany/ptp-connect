"use client";

import React from "react";
import { Truck, Trash2 } from "lucide-react";
import { Dispatch } from "@/lib/db/schema";

interface DispatchCardProps {
  dispatch: Dispatch;
  onDeleteClick: (dispatch: Dispatch) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr)) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function DispatchCard({ dispatch, onDeleteClick }: DispatchCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 p-6 flex flex-col justify-between">
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-400 tracking-wide block mb-1">
              {dispatch.orderNumber}
            </span>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug truncate">
              {dispatch.customerName}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {dispatch.generatorName}
            </p>
          </div>

          {/* Truck Icon Badge: Navy background with amber truck icon */}
          <div className="w-11 h-11 rounded-xl bg-[#083a60] flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Details 2-Column Grid */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-8 text-sm mt-4">
          <div className="space-y-2.5">
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-slate-500 font-normal">Date:</span>
              <span className="font-bold text-slate-900">
                {formatDate(dispatch.dispatchDate)}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-slate-500 font-normal">Vehicle:</span>
              <span className="font-bold text-slate-900">
                {dispatch.vehicleNumber}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-slate-500 font-normal">Fuel filled:</span>
              <span className="font-bold text-slate-900">
                {dispatch.fuelFilled ?? 0}L
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-slate-500 font-normal">Driver:</span>
              <span className="font-bold text-slate-900">
                {dispatch.driverName}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-slate-500 font-normal">Hours:</span>
              <span className="font-bold text-slate-900">
                {dispatch.hoursBeforeDispatch ?? 0}h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Divider & Delete Action */}
      <div className="mt-5">
        <div className="border-t border-slate-100 my-3" />
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => onDeleteClick(dispatch)}
            title="Delete Dispatch"
            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            aria-label="Delete Dispatch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
