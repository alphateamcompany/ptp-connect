"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  ChevronDown,
  RotateCcw,
  Check,
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
  const [notification, setNotification] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [siteFilter, setSiteFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<"returnNumber" | "returnDate" | "closingHours">("returnNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected row for highlight (defaults to first row)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setSelectedRowId(created.id);
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

  // Active filters count
  const activeFiltersCount = siteFilter !== "All" ? 1 : 0;

  // Sorting toggle
  const handleSort = (field: "returnNumber" | "returnDate" | "closingHours") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

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
      let comp = 0;
      if (sortField === "closingHours") {
        comp = (a.closingHours || 0) - (b.closingHours || 0);
      } else if (sortField === "returnDate") {
        const da = new Date(a.returnDate).getTime() || 0;
        const db = new Date(b.returnDate).getTime() || 0;
        comp = da - db;
      } else {
        comp = (a.returnNumber || "").localeCompare(b.returnNumber || "");
      }
      return sortOrder === "asc" ? comp : -comp;
    });

    return result;
  }, [returnList, searchQuery, siteFilter, sortField, sortOrder]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 lg:top-6 left-4 right-4 lg:left-auto lg:right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Returns List
          </h1>
          <p className="text-sm font-normal text-slate-500 mt-1">
            Track and manage all generator returns.
          </p>
        </div>

        {/* Controls: Search, Filter, Export, Add Return Record */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative min-w-[280px] sm:min-w-[340px] md:min-w-[400px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by return no., rental order, customer or site..."
              className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#083a60]/10 focus:border-[#083a60] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Popover Button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                activeFiltersCount > 0
                  ? "bg-blue-50 border-blue-200 text-[#083a60] font-semibold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-4 h-4 text-slate-600" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#083a60] text-white text-[11px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filter Menu Dropdown */}
            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-40 space-y-4 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Filter by Site
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => setSiteFilter("All")}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {uniqueSites.map((site) => (
                    <button
                      key={site}
                      onClick={() => {
                        setSiteFilter(site);
                        setFilterMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                        siteFilter === site
                          ? "bg-blue-50 text-[#083a60] font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{site}</span>
                      {siteFilter === site && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Return Record Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Return Record</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredAndSortedReturns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              No return records found
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              No returns match your search or filter criteria. Try adjusting filters or create a new return record.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#083a60] text-white text-xs font-semibold hover:bg-[#0c4a7e] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Return Record</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                  <th
                    onClick={() => handleSort("returnNumber")}
                    className="py-3.5 px-4 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Return No.</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          sortField === "returnNumber" && sortOrder === "asc"
                            ? "rotate-180 text-blue-600"
                            : ""
                        }`}
                      />
                    </div>
                  </th>
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap">
                    Rental Order
                  </th>
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap">
                    Generator
                  </th>
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap">
                    Customer
                  </th>
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap">
                    Site
                  </th>
                  <th
                    onClick={() => handleSort("returnDate")}
                    className="py-3.5 px-3 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Return Date</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          sortField === "returnDate" && sortOrder === "asc"
                            ? "rotate-180 text-blue-600"
                            : ""
                        }`}
                      />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("closingHours")}
                    className="py-3.5 px-3 font-bold whitespace-nowrap cursor-pointer hover:text-slate-900 group"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Closing Hours</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          sortField === "closingHours" && sortOrder === "asc"
                            ? "rotate-180 text-blue-600"
                            : ""
                        }`}
                      />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAndSortedReturns.map((item, index) => {
                  const isHighlighted =
                    selectedRowId ? selectedRowId === item.id : index === 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRowId(item.id)}
                      className={`transition-colors cursor-pointer ${
                        isHighlighted
                          ? "bg-cyan-50/20 hover:bg-cyan-50/40"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Return No. with turquoise/cyan highlight bar on selected/first row */}
                      <td className="py-3.5 px-4 whitespace-nowrap relative">
                        {isHighlighted && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#00a3bf] rounded-r-xs" />
                        )}
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {item.returnNumber}
                        </span>
                      </td>

                      {/* Rental Order (blue link style) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-[#2563eb] hover:underline font-mono text-sm">
                          {item.orderNumber}
                        </span>
                      </td>

                      {/* Generator with capacity subtext */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.generatorCode}
                        </div>
                        {item.generatorCapacity && (
                          <div className="text-xs text-slate-500 font-normal mt-0.5">
                            {item.generatorCapacity}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3">
                        <div
                          className="font-semibold text-slate-900 text-sm max-w-[220px] truncate"
                          title={item.customerName}
                        >
                          {item.customerName}
                        </div>
                      </td>

                      {/* Site */}
                      <td className="py-3.5 px-3">
                        <div
                          className="text-slate-600 text-sm max-w-[200px] truncate"
                          title={item.siteLocation}
                        >
                          {item.siteLocation}
                        </div>
                      </td>

                      {/* Return Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-slate-700 text-sm">
                          {item.returnDate}
                        </div>
                      </td>

                      {/* Closing Hours */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-slate-800 text-sm font-semibold">
                          {(item.closingHours || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setRecordToDelete(item)}
                            title="Delete Return Record"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs font-medium text-slate-500 flex items-center justify-between">
          <span>
            Showing {filteredAndSortedReturns.length} of {returnList.length} return records
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            PTP Connect • Generator Fleet Returns
          </span>
        </div>
      </div>

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
