"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  CheckCircle2,
  Truck,
  Search,
  X,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import { Dispatch, RentalOrder } from "@/lib/db/schema";
import { DispatchCard } from "./dispatch-card";
import { DispatchTable } from "./dispatch-table";
import { DispatchDetailsModal } from "./dispatch-details-modal";
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
  const [selectedDispatchForDetails, setSelectedDispatchForDetails] =
    useState<Dispatch | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Search, Sort, and View states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

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
      if (selectedDispatchForDetails?.id === id) {
        setSelectedDispatchForDetails(null);
      }
      showNotification("Dispatch record deleted successfully");
    } else {
      alert(res.error || "Failed to delete dispatch record");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSortBy("date_desc");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || sortBy !== "date_desc";

  // Filtered and Sorted Dispatches
  const filteredAndSortedDispatches = useMemo(() => {
    let result = [...dispatches];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.orderNumber.toLowerCase().includes(q) ||
          d.customerName.toLowerCase().includes(q) ||
          d.generatorName.toLowerCase().includes(q) ||
          d.driverName.toLowerCase().includes(q) ||
          d.vehicleNumber.toLowerCase().includes(q)
      );
    }

    // 2. Sorting
    result.sort((a, b) => {
      if (sortBy === "order_asc") {
        return a.orderNumber.localeCompare(b.orderNumber, undefined, {
          numeric: true,
        });
      }
      if (sortBy === "order_desc") {
        return b.orderNumber.localeCompare(a.orderNumber, undefined, {
          numeric: true,
        });
      }
      if (sortBy === "customer_asc") {
        return a.customerName.localeCompare(b.customerName);
      }
      if (sortBy === "date_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // "date_desc" (default: newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [dispatches, searchQuery, sortBy]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 lg:top-6 left-4 right-4 lg:left-auto lg:right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Generator Dispatch
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Record dispatch details before generator leaves warehouse
          </p>
        </div>

        {/* Full "New Dispatch" button — desktop */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Dispatch</span>
        </button>
      </div>

      {/* MOBILE Row 1: Search + compact "+ Add" button */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dispatches..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </div>

      {/* DESKTOP: Search + sort bar + view toggle — single row */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer, generator, driver, vehicle..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative shrink-0 min-w-[190px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="order_asc">Order ID (Ascending)</option>
            <option value="order_desc">Order ID (Descending)</option>
            <option value="customer_asc">Customer (A-Z)</option>
          </select>
          <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* View Mode Toggle: Table (default) vs Cards */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-[#083a60] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Table View"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "card"
                ? "bg-white text-[#083a60] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Cards View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors cursor-pointer shrink-0"
            title="Reset filters and sorting"
          >
            Reset
          </button>
        )}
      </div>

      {/* Sub-bar: Results summary and Mobile view switcher */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
        <span>
          Showing {filteredAndSortedDispatches.length} of {dispatches.length} records
        </span>

        {/* Mobile View Toggle */}
        <div className="flex sm:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-[#083a60] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Table View"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "card"
                ? "bg-white text-[#083a60] shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Cards View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: Table View (default), Card Grid, or Empty State */}
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
      ) : filteredAndSortedDispatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Filter className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No dispatches match your search
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords for order ID, customer, driver, or vehicle.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "table" ? (
        <DispatchTable
          dispatches={filteredAndSortedDispatches}
          totalCount={dispatches.length}
          onDeleteClick={(d) => setDispatchToDelete(d)}
          onViewDetails={(d) => setSelectedDispatchForDetails(d)}
          sortBy={sortBy}
          onSortChange={(newSort) => setSortBy(newSort)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAndSortedDispatches.map((dispatch) => (
            <DispatchCard
              key={dispatch.id}
              dispatch={dispatch}
              onDeleteClick={(d) => setDispatchToDelete(d)}
            />
          ))}
        </div>
      )}

      {/* Dispatch Details Modal */}
      {selectedDispatchForDetails && (
        <DispatchDetailsModal
          dispatch={selectedDispatchForDetails}
          isOpen={Boolean(selectedDispatchForDetails)}
          onClose={() => setSelectedDispatchForDetails(null)}
          onDeleteClick={(d) => {
            setSelectedDispatchForDetails(null);
            setDispatchToDelete(d);
          }}
        />
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
