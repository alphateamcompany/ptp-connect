"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2, Truck } from "lucide-react";
import { Dispatch, RentalOrder } from "@/lib/db/schema";
import { DispatchCard } from "./dispatch-card";
import { NewDispatchModal } from "./new-dispatch-modal";
import { DeleteDispatchModal } from "./delete-dispatch-modal";
import {
  createDispatch,
  deleteDispatch,
  CreateDispatchInput,
} from "@/app/dispatch/actions";

interface DispatchViewProps {
  initialDispatches: Dispatch[];
  rentalOrders: RentalOrder[];
}

export function DispatchView({
  initialDispatches,
  rentalOrders,
}: DispatchViewProps) {
  const [dispatches, setDispatches] = useState<Dispatch[]>(initialDispatches);
  const [prevInitial, setPrevInitial] = useState(initialDispatches);
  if (prevInitial !== initialDispatches) {
    setPrevInitial(initialDispatches);
    setDispatches(initialDispatches);
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dispatchToDelete, setDispatchToDelete] = useState<Dispatch | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleCreateDispatch = async (data: CreateDispatchInput) => {
    const res = await createDispatch(data);
    if (res.success && res.data) {
      const created = res.data as Dispatch;
      setDispatches((prev) => [created, ...prev]);
      showNotification(
        `Dispatch record for ${created.orderNumber} recorded successfully`
      );
      return { success: true };
    }
    return {
      success: false,
      error: res.error || "Failed to record dispatch",
    };
  };

  const handleDeleteConfirm = async (id: number) => {
    const res = await deleteDispatch(id);
    if (res.success) {
      setDispatches((prev) => prev.filter((d) => d.id !== id));
      showNotification("Dispatch record deleted successfully");
    } else {
      alert(res.error || "Failed to delete dispatch record");
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

      {/* Page Header matching screenshot 1 */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Generator Dispatch
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Record dispatch details before generator leaves warehouse
          </p>
        </div>

        {/* "+ New Dispatch" button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Dispatch</span>
        </button>
      </div>

      {/* Main Content: Dispatch Card Grid or Empty State */}
      {dispatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No dispatch records yet
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Log dispatch details when a generator is transported from the warehouse.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Dispatch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {dispatches.map((dispatch) => (
            <DispatchCard
              key={dispatch.id}
              dispatch={dispatch}
              onDeleteClick={(d) => setDispatchToDelete(d)}
            />
          ))}
        </div>
      )}

      {/* New Dispatch Modal */}
      {isAddModalOpen && (
        <NewDispatchModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          rentalOrders={rentalOrders}
          onSubmit={handleCreateDispatch}
        />
      )}

      {/* Delete Confirmation Modal */}
      {dispatchToDelete && (
        <DeleteDispatchModal
          dispatch={dispatchToDelete}
          isOpen={Boolean(dispatchToDelete)}
          onClose={() => setDispatchToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
