"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  CheckCircle2,
  X,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { ReturnRecord } from "@/lib/db/schema";
import {
  CreateReturnInput,
  RentalOrderOption,
  createReturn,
  deleteReturn,
} from "@/app/returns/actions";
import { AddReturnModal } from "./add-return-modal";
import { DeleteReturnModal } from "./delete-return-modal";
import { ReturnTable } from "./return-table";
import { ReturnDetailsModal } from "./return-details-modal";

interface ReturnsViewProps {
  initialReturns: ReturnRecord[];
  rentalOrders: RentalOrderOption[];
  nextReturnNumber: string;
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
  const [recordToDelete, setRecordToDelete] = useState<ReturnRecord | null>(null);
  const [selectedRecordForDetails, setSelectedRecordForDetails] =
    useState<ReturnRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Search, Filter, and Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState("return_desc");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Create Return Handler
  const handleCreateReturn = async (data: CreateReturnInput) => {
    const res = await createReturn(data);
    if (res.success && res.data) {
      const created = res.data as ReturnRecord;
      setReturnList((prev) => [created, ...prev]);
      showNotification(`Return record ${created.returnNumber} added successfully`);
      return { success: true };
    }
    return {
      success: false,
      error: res.error || "Failed to add return record",
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
      showNotification("Return record deleted successfully");
    } else {
      alert(res.error || "Failed to delete return record");
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
    setSortBy("return_desc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || siteFilter !== "All" || sortBy !== "return_desc";

  // Filtering and sorting
  const filteredAndSortedReturns = useMemo(() => {
    let result = [...returnList];

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.returnNumber?.toLowerCase().includes(q) ||
          r.orderNumber?.toLowerCase().includes(q) ||
          r.generatorCode?.toLowerCase().includes(q) ||
          r.customerName?.toLowerCase().includes(q) ||
          r.siteLocation?.toLowerCase().includes(q)
      );
    }

    // Site filter
    if (siteFilter !== "All") {
      result = result.filter(
        (r) => r.siteLocation?.toLowerCase() === siteFilter.toLowerCase()
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "return_asc") {
        return (a.returnNumber || "").localeCompare(b.returnNumber || "", undefined, {
          numeric: true,
        });
      }
      if (sortBy === "return_desc") {
        return (b.returnNumber || "").localeCompare(a.returnNumber || "", undefined, {
          numeric: true,
        });
      }
      if (sortBy === "customer_asc") {
        return (a.customerName || "").localeCompare(b.customerName || "");
      }
      if (sortBy === "date_asc") {
        return new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime();
      }
      if (sortBy === "date_desc") {
        return new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime();
      }
      if (sortBy === "hours_desc") {
        return (b.closingHours || 0) - (a.closingHours || 0);
      }
      if (sortBy === "hours_asc") {
        return (a.closingHours || 0) - (b.closingHours || 0);
      }
      return 0;
    });

    return result;
  }, [returnList, searchQuery, siteFilter, sortBy]);

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
            Returns List
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track and manage returned generator equipment
          </p>
        </div>

        {/* Full "Add Return Record" button — desktop */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Return Record</span>
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
            placeholder="Search returns (e.g. RTN-2026-0001, Acme)..."
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

      {/* MOBILE Row 2: Site Filter + Sort */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="relative flex-1">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
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
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* DESKTOP: Search + Site Filter + Sort bar — single row */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by return no., order, generator, customer, site (e.g. RTN-2026-0001)..."
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

        <div className="relative shrink-0 min-w-[160px]">
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
            <option value="return_desc">Return No. (Descending)</option>
            <option value="return_asc">Return No. (Ascending)</option>
            <option value="date_desc">Return Date (Newest)</option>
            <option value="date_asc">Return Date (Oldest)</option>
            <option value="customer_asc">Customer (A-Z)</option>
            <option value="hours_desc">Closing Hours (High to Low)</option>
            <option value="hours_asc">Closing Hours (Low to High)</option>
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
          Showing {filteredAndSortedReturns.length} of {returnList.length} records
        </span>
      </div>

      {/* Main Content: Table View or Empty State */}
      {returnList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <RotateCcw className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No return records yet
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Log return details when a generator is returned from customer site.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Return Record
          </button>
        </div>
      ) : filteredAndSortedReturns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <RotateCcw className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No returns match your search
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or site location filter.
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
        />
      )}

      {/* Add Return Modal */}
      {isAddModalOpen && (
        <AddReturnModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          rentalOrders={rentalOrders}
          nextReturnNumber={nextReturnNumber}
          onSubmit={handleCreateReturn}
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
