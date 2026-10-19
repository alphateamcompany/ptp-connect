"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  CheckCircle2,
  X,
  ChevronDown,
  ArrowUpDown,
  Truck,
  RotateCcw,
} from "lucide-react";
import { ReturnRecord } from "@/lib/db/schema";
import {
  CreateReturnInput,
  RentalOrderOption,
  createReturn,
  updateReturn,
  deleteReturn,
} from "@/app/returns/actions";
import { AddReturnModal } from "./add-return-modal";
import { EditReturnModal } from "./edit-return-modal";
import { DeleteReturnModal } from "./delete-return-modal";
import { ReturnTable } from "./return-table";
import { ReturnDetailsModal } from "./return-details-modal";

interface ReturnsViewProps {
  initialReturns: ReturnRecord[];
  rentalOrders: RentalOrderOption[];
  nextReturnNumber?: string;
}

export function ReturnsView({
  initialReturns,
  rentalOrders,
  nextReturnNumber,
}: ReturnsViewProps) {
  const [returnList, setReturnList] = useState<ReturnRecord[]>(initialReturns);
  const [prevInitial, setPrevInitial] = useState(initialReturns);
  if (prevInitial !== initialReturns) {
    setPrevInitial(initialReturns);
    setReturnList(initialReturns);
  }

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<ReturnRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<ReturnRecord | null>(null);
  const [selectedRecordForDetails, setSelectedRecordForDetails] =
    useState<ReturnRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Search, Filter, and Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState("order_desc");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Create Transport Record Handler
  const handleCreateReturn = async (data: CreateReturnInput) => {
    const res = await createReturn(data);
    if (res.success && res.data) {
      const created = res.data as ReturnRecord;
      setReturnList((prev) => [created, ...prev]);
      showNotification(`Transport record for ${created.orderNumber} added successfully`);
      return { success: true };
    }
    return {
      success: false,
      error: res.error || "Failed to add transport record",
    };
  };

  // Update Transport Record Handler
  const handleUpdateReturn = async (id: number, data: Partial<CreateReturnInput>) => {
    const res = await updateReturn(id, data);
    if (res.success && res.data) {
      const updated = res.data as ReturnRecord;
      setReturnList((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRecordForDetails?.id === id) {
        setSelectedRecordForDetails(updated);
      }
      showNotification(`Transport record for ${updated.orderNumber} updated successfully`);
      return { success: true };
    }
    return {
      success: false,
      error: res.error || "Failed to update transport record",
    };
  };

  // Delete Handler
  const handleDeleteConfirm = async (id: number) => {
    const res = await deleteReturn(id);
    if (res.success) {
      setReturnList((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecordForDetails?.id === id) {
        setSelectedRecordForDetails(null);
      }
      showNotification("Transport record deleted successfully");
    } else {
      alert(res.error || "Failed to delete transport record");
    }
  };

  // Available unique sites for filter dropdown
  const uniqueSites = useMemo(() => {
    const sites = Array.from(
      new Set(returnList.map((r) => r.siteLocation).filter(Boolean))
    );
    return ["All", ...sites];
  }, [returnList]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSiteFilter("All");
    setStatusFilter("All");
    setSortBy("order_desc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    siteFilter !== "All" ||
    statusFilter !== "All" ||
    sortBy !== "order_desc";

  // Filtering and sorting
  const filteredAndSortedReturns = useMemo(() => {
    let result = [...returnList];

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.orderNumber?.toLowerCase().includes(q) ||
          r.generatorCode?.toLowerCase().includes(q) ||
          r.customerName?.toLowerCase().includes(q) ||
          r.siteLocation?.toLowerCase().includes(q) ||
          r.driverName?.toLowerCase().includes(q) ||
          r.vehicleNumber?.toLowerCase().includes(q) ||
          r.returnDriverName?.toLowerCase().includes(q) ||
          r.returnVehicleNumber?.toLowerCase().includes(q) ||
          r.returnNumber?.toLowerCase().includes(q)
      );
    }

    // Site filter
    if (siteFilter !== "All") {
      result = result.filter(
        (r) => r.siteLocation?.toLowerCase() === siteFilter.toLowerCase()
      );
    }

    // Status filter
    if (statusFilter === "Returned") {
      result = result.filter(
        (r) =>
          r.status === "Returned" ||
          Boolean(r.closingDate) ||
          (r.closingHours && r.closingHours > 0)
      );
    } else if (statusFilter === "In Transit") {
      result = result.filter(
        (r) =>
          r.status !== "Returned" &&
          !r.closingDate &&
          (!r.closingHours || r.closingHours === 0)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "order_asc") {
        return (a.orderNumber || "").localeCompare(b.orderNumber || "", undefined, {
          numeric: true,
        });
      }
      if (sortBy === "order_desc") {
        return (b.orderNumber || "").localeCompare(a.orderNumber || "", undefined, {
          numeric: true,
        });
      }
      if (sortBy === "customer_asc") {
        return (a.customerName || "").localeCompare(b.customerName || "");
      }
      if (sortBy === "date_desc") {
        return new Date(b.returnDate || b.closingDate || 0).getTime() -
          new Date(a.returnDate || a.closingDate || 0).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.returnDate || a.closingDate || 0).getTime() -
          new Date(b.returnDate || b.closingDate || 0).getTime();
      }
      if (sortBy === "start_desc") {
        return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
      }
      if (sortBy === "start_asc") {
        return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
      }
      return 0;
    });

    return result;
  }, [returnList, searchQuery, siteFilter, statusFilter, sortBy]);

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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-[#083a60]" />
            Transport
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track and manage generator dispatch and return logistics
          </p>
        </div>

        {/* Full "Add Transport Record" button — desktop */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Transport Record</span>
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
            placeholder="Search transport (RO-0001, Acme, driver)..."
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

      {/* MOBILE Row 2: Filters */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="In Transit">In Transit</option>
            <option value="Returned">Returned</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Sites</option>
            {uniqueSites
              .filter((s) => s !== "All")
              .map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* DESKTOP: Search + Site Filter + Status Filter + Sort bar — single row */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order no., generator, customer, driver, vehicle no..."
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

        <div className="relative shrink-0 min-w-[140px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="In Transit">In Transit</option>
            <option value="Returned">Returned</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative shrink-0 min-w-[150px]">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Sites</option>
            {uniqueSites
              .filter((s) => s !== "All")
              .map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative shrink-0 min-w-[190px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="order_desc">Rental Order (Descending)</option>
            <option value="order_asc">Rental Order (Ascending)</option>
            <option value="date_desc">Return Date (Newest)</option>
            <option value="date_asc">Return Date (Oldest)</option>
            <option value="start_desc">Dispatch Date (Newest)</option>
            <option value="start_asc">Dispatch Date (Oldest)</option>
            <option value="customer_asc">Customer (A-Z)</option>
          </select>
          <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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

      {/* Sub-bar: Results summary */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
        <span>
          Showing {filteredAndSortedReturns.length} of {returnList.length} transport records
        </span>
      </div>

      {/* Main Content: Table View or Empty State */}
      {returnList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Truck className="w-7 h-7 text-[#083a60]" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No transport records yet
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Log dispatch and return transport details for your generator rental fleet.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Transport Record
          </button>
        </div>
      ) : filteredAndSortedReturns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <RotateCcw className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No transport records match your search
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, status, or site filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <ReturnTable
          returns={filteredAndSortedReturns}
          totalCount={returnList.length}
          onDeleteClick={(r) => setRecordToDelete(r)}
          onViewDetails={(r) => setSelectedRecordForDetails(r)}
          onEditClick={(r) => setRecordToEdit(r)}
          sortBy={sortBy}
          onSortChange={(newSort) => setSortBy(newSort)}
        />
      )}

      {/* Return Details Modal */}
      {selectedRecordForDetails && (
        <ReturnDetailsModal
          returnRecord={selectedRecordForDetails}
          isOpen={Boolean(selectedRecordForDetails)}
          onClose={() => setSelectedRecordForDetails(null)}
          onDeleteClick={(r) => {
            setSelectedRecordForDetails(null);
            setRecordToDelete(r);
          }}
          onEditClick={(r) => {
            setSelectedRecordForDetails(null);
            setRecordToEdit(r);
          }}
        />
      )}

      {/* Add Transport Modal */}
      {isAddModalOpen && (
        <AddReturnModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          rentalOrders={rentalOrders}
          nextReturnNumber={nextReturnNumber}
          onSubmit={handleCreateReturn}
        />
      )}

      {/* Edit Transport Modal */}
      {recordToEdit && (
        <EditReturnModal
          isOpen={Boolean(recordToEdit)}
          onClose={() => setRecordToEdit(null)}
          record={recordToEdit}
          onSubmit={handleUpdateReturn}
        />
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <DeleteReturnModal
          returnRecord={recordToDelete}
          isOpen={Boolean(recordToDelete)}
          onClose={() => setRecordToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

export const TransportView = ReturnsView;
