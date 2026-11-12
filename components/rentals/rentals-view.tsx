"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  CheckCircle2,
  FileText,
  Search,
  X,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Table as TableIcon,
  LayoutGrid,
  Building2,
  Calendar,
} from "lucide-react";
import { RentalOrder, Customer, Generator } from "@/lib/db/schema";
import { RentalOrderCard } from "./rental-order-card";
import { RentalOrdersTable } from "./rental-orders-table";
import { RentalOrderDetailsModal } from "./rental-order-details-modal";
import { NewRentalOrderModal } from "./new-rental-order-modal";
import { EditRentalOrderModal } from "./edit-rental-order-modal";
import { DeleteRentalOrderModal } from "./delete-rental-order-modal";
import {
  createRentalOrder,
  updateRentalOrder,
  markRentalOrderCompleted,
  deleteRentalOrder,
  CreateRentalOrderInput,
} from "@/app/rentals/actions";

function parseOrderDate(dateStr?: string | null): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(s)) {
    const parts = s.split(/[-/]/).map(Number);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function toYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (preset === "Today") {
    const todayStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return { from: todayStr, to: todayStr };
  }
  if (preset === "ThisMonth") {
    const fromStr = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const toStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from: fromStr, to: toStr };
  }
  if (preset === "LastMonth") {
    const prevMonthDate = new Date(y, m - 1, 1);
    const py = prevMonthDate.getFullYear();
    const pm = prevMonthDate.getMonth();
    const fromStr = `${py}-${String(pm + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(py, pm + 1, 0).getDate();
    const toStr = `${py}-${String(pm + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from: fromStr, to: toStr };
  }
  if (preset === "ThisYear") {
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
  return null;
}

interface RentalsViewProps {
  initialOrders: RentalOrder[];
  customers: Customer[];
  generators: Generator[];
}

export function RentalsView({
  initialOrders,
  customers: initialCustomers,
  generators: initialGenerators,
}: RentalsViewProps) {
  const [orders, setOrders] = useState<RentalOrder[]>(initialOrders);
  const [prevInitialOrders, setPrevInitialOrders] = useState(initialOrders);
  if (prevInitialOrders !== initialOrders) {
    setPrevInitialOrders(initialOrders);
    setOrders(initialOrders);
  }

  const [extraCustomers, setExtraCustomers] = useState<Customer[]>([]);
  const customers = useMemo(() => {
    const existingIds = new Set(initialCustomers.map((c) => c.id));
    return [...extraCustomers.filter((c) => !existingIds.has(c.id)), ...initialCustomers];
  }, [extraCustomers, initialCustomers]);

  const [extraGenerators, setExtraGenerators] = useState<Generator[]>([]);
  const generators = useMemo(() => {
    const existingIds = new Set(initialGenerators.map((g) => g.id));
    return [...extraGenerators.filter((g) => !existingIds.has(g.id)), ...initialGenerators];
  }, [extraGenerators, initialGenerators]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<RentalOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<RentalOrder | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<RentalOrder | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Search, Filter, Sort, and View states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [billingCompanyFilter, setBillingCompanyFilter] = useState("All");
  const [dateFilterPreset, setDateFilterPreset] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [dateFilterMode, setDateFilterMode] = useState<"active" | "start">("active");
  const [sortBy, setSortBy] = useState("order_asc");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const billingCompanyOptions = useMemo(() => {
    const list = ["PTPDS", "PTPS", "RG"];
    const extra = new Set<string>();
    orders.forEach((o) => {
      const trimmed = o.billingCompany?.trim();
      if (trimmed && !list.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        extra.add(trimmed);
      }
    });
    return [...list, ...Array.from(extra)];
  }, [orders]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleCreateOrder = async (data: CreateRentalOrderInput) => {
    const res = await createRentalOrder(data);
    if (res.success && res.data) {
      const created = res.data as RentalOrder;
      setOrders((prev) => [...prev, created]);
      showNotification(`Rental order ${created.orderNumber} created successfully`);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to create rental order" };
  };

  const handleUpdateOrder = async (id: number, data: CreateRentalOrderInput) => {
    const res = await updateRentalOrder(id, data);
    if (res.success && res.data) {
      const updated = res.data as RentalOrder;
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? updated : o))
      );
      if (selectedOrderForDetails?.id === id) {
        setSelectedOrderForDetails(updated);
      }
      showNotification(`Rental order ${updated.orderNumber} updated successfully`);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to update rental order" };
  };

  const handleMarkCompleted = async (id: number) => {
    const res = await markRentalOrderCompleted(id);
    if (res.success && res.data) {
      const updated = res.data as RentalOrder;
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "Completed" } : o))
      );
      if (selectedOrderForDetails?.id === id) {
        setSelectedOrderForDetails((prev) =>
          prev ? { ...prev, status: "Completed" } : null
        );
      }
      showNotification(`Rental order ${updated.orderNumber} marked as completed`);
    } else {
      alert(res.error || "Failed to mark order completed");
    }
  };

  const handleDeleteConfirm = async (id: number) => {
    const res = await deleteRentalOrder(id);
    if (res.success) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selectedOrderForDetails?.id === id) {
        setSelectedOrderForDetails(null);
      }
      showNotification("Rental order deleted successfully");
    } else {
      alert(res.error || "Failed to delete rental order");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setTypeFilter("All");
    setBillingCompanyFilter("All");
    setDateFilterPreset("All");
    setCustomStartDate("");
    setCustomEndDate("");
    setDateFilterMode("active");
    setSortBy("order_asc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "All" ||
    typeFilter !== "All" ||
    billingCompanyFilter !== "All" ||
    dateFilterPreset !== "All" ||
    customStartDate !== "" ||
    customEndDate !== "" ||
    sortBy !== "order_asc";

  // Filtered and Sorted Orders
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.billingCompany && o.billingCompany.toLowerCase().includes(q)) ||
          o.generatorName.toLowerCase().includes(q) ||
          (o.generatorKva && o.generatorKva.toLowerCase().includes(q)) ||
          (o.siteLocation && o.siteLocation.toLowerCase().includes(q)) ||
          (o.rentalType && o.rentalType.toLowerCase().includes(q))
      );
    }

    // 2. Billing Company Filter
    if (billingCompanyFilter !== "All") {
      result = result.filter(
        (o) => o.billingCompany?.toLowerCase() === billingCompanyFilter.toLowerCase()
      );
    }

    // 3. Status Filter
    if (statusFilter !== "All") {
      result = result.filter(
        (o) => o.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // 4. Rental Type Filter
    if (typeFilter !== "All") {
      result = result.filter(
        (o) => o.rentalType?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // 5. Date Filter
    if (dateFilterPreset !== "All" || customStartDate || customEndDate) {
      let fromStr = customStartDate;
      let toStr = customEndDate;

      if (dateFilterPreset !== "Custom" && dateFilterPreset !== "All") {
        const range = getDateRange(dateFilterPreset);
        if (range) {
          fromStr = range.from;
          toStr = range.to;
        }
      }

      if (fromStr || toStr) {
        result = result.filter((o) => {
          const startDateParsed = parseOrderDate(o.startDate);
          const endDateParsed = parseOrderDate(o.endDate);

          const startYMD = startDateParsed ? toYMD(startDateParsed) : o.startDate?.trim();
          const endYMD = endDateParsed ? toYMD(endDateParsed) : (o.endDate?.trim() || startYMD);

          if (!startYMD) return false;

          if (dateFilterMode === "start") {
            if (fromStr && startYMD < fromStr) return false;
            if (toStr && startYMD > toStr) return false;
            return true;
          } else {
            // "active" in range:
            if (fromStr && endYMD && endYMD < fromStr) return false;
            if (toStr && startYMD > toStr) return false;
            return true;
          }
        });
      }
    }

    // 6. Sorting
    result.sort((a, b) => {
      if (sortBy === "order_asc") {
        return a.orderNumber.localeCompare(b.orderNumber, undefined, { numeric: true });
      }
      if (sortBy === "order_desc") {
        return b.orderNumber.localeCompare(a.orderNumber, undefined, { numeric: true });
      }
      if (sortBy === "total_desc") {
        return Number(b.totalAmount || 0) - Number(a.totalAmount || 0);
      }
      if (sortBy === "total_asc") {
        return Number(a.totalAmount || 0) - Number(b.totalAmount || 0);
      }
      if (sortBy === "customer_asc") {
        return a.customerName.localeCompare(b.customerName);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return result;
  }, [
    orders,
    searchQuery,
    statusFilter,
    typeFilter,
    billingCompanyFilter,
    dateFilterPreset,
    customStartDate,
    customEndDate,
    dateFilterMode,
    sortBy,
  ]);

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
            Rental Orders
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Create and manage rental agreements
          </p>
        </div>
        {/* Full "New Rental Order" button — desktop only */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Rental Order</span>
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
            placeholder="Search orders (e.g. RO-0001, Acme)..."
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

      {/* MOBILE Row 2: Status + Type + Billing + Date filters */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={billingCompanyFilter}
            onChange={(e) => setBillingCompanyFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Companies</option>
            {billingCompanyOptions.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={dateFilterPreset}
            onChange={(e) => {
              const val = e.target.value;
              setDateFilterPreset(val);
              if (val !== "Custom") {
                setCustomStartDate("");
                setCustomEndDate("");
              }
            }}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Dates</option>
            <option value="ThisMonth">This Month</option>
            <option value="LastMonth">Last Month</option>
            <option value="ThisYear">This Year</option>
            <option value="Custom">Custom Range</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors cursor-pointer text-center"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* DESKTOP: Full search + filter bar + view toggle — single row */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer, site, generator..."
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
        <div className="relative shrink-0 min-w-[130px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative shrink-0 min-w-[130px]">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative shrink-0 min-w-[140px]">
          <select
            value={billingCompanyFilter}
            onChange={(e) => setBillingCompanyFilter(e.target.value)}
            className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Companies</option>
            {billingCompanyOptions.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative shrink-0 min-w-[145px]">
          <select
            value={dateFilterPreset}
            onChange={(e) => {
              const val = e.target.value;
              setDateFilterPreset(val);
              if (val !== "Custom") {
                setCustomStartDate("");
                setCustomEndDate("");
              }
            }}
            className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All">All Dates</option>
            <option value="ThisMonth">This Month</option>
            <option value="LastMonth">Last Month</option>
            <option value="ThisYear">This Year</option>
            <option value="Custom">Custom Range</option>
          </select>
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative shrink-0 min-w-[180px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="order_asc">Order ID (Ascending)</option>
            <option value="order_desc">Order ID (Descending)</option>
            <option value="total_desc">Total: High to Low</option>
            <option value="total_asc">Total: Low to High</option>
            <option value="customer_asc">Customer (A-Z)</option>
            <option value="newest">Newest First</option>
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
            title="Reset all filters and sorting"
          >
            Reset
          </button>
        )}
      </div>

      {/* Quick Billing Company Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold text-xs flex items-center gap-1.5 shrink-0 mr-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Billing Company:</span>
        </span>
        <button
          type="button"
          onClick={() => setBillingCompanyFilter("All")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
            billingCompanyFilter === "All"
              ? "bg-[#083a60] text-white border-[#083a60] shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          All ({orders.length})
        </button>
        {billingCompanyOptions.map((comp) => {
          const count = orders.filter((o) => o.billingCompany?.toLowerCase() === comp.toLowerCase()).length;
          return (
            <button
              key={comp}
              type="button"
              onClick={() => setBillingCompanyFilter(comp)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
                billingCompanyFilter.toLowerCase() === comp.toLowerCase()
                  ? "bg-[#083a60] text-white border-[#083a60] shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {comp} {count > 0 && <span className="opacity-75 font-normal">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Quick Date Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold text-xs flex items-center gap-1.5 shrink-0 mr-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Date Filter:</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setDateFilterPreset("All");
            setCustomStartDate("");
            setCustomEndDate("");
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
            dateFilterPreset === "All" && !customStartDate && !customEndDate
              ? "bg-[#083a60] text-white border-[#083a60] shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Dates
        </button>
        <button
          type="button"
          onClick={() => setDateFilterPreset("ThisMonth")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
            dateFilterPreset === "ThisMonth"
              ? "bg-[#083a60] text-white border-[#083a60] shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          This Month
        </button>
        <button
          type="button"
          onClick={() => setDateFilterPreset("LastMonth")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
            dateFilterPreset === "LastMonth"
              ? "bg-[#083a60] text-white border-[#083a60] shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Last Month
        </button>
        <button
          type="button"
          onClick={() => setDateFilterPreset("ThisYear")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
            dateFilterPreset === "ThisYear"
              ? "bg-[#083a60] text-white border-[#083a60] shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          This Year
        </button>
        <button
          type="button"
          onClick={() => setDateFilterPreset("Custom")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
            dateFilterPreset === "Custom" || customStartDate || customEndDate
              ? "bg-[#083a60] text-white border-[#083a60] shadow-xs"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Custom Range...
        </button>
      </div>

      {/* Custom Date Range Picker bar (shows when Custom is active) */}
      {(dateFilterPreset === "Custom" || customStartDate || customEndDate) && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50/90 rounded-xl border border-slate-200 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setDateFilterPreset("Custom");
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#083a60] focus:outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setDateFilterPreset("Custom");
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#083a60] focus:outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-slate-500 font-medium">Match:</span>
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value as "active" | "start")}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-[#083a60] focus:outline-none cursor-pointer font-semibold"
            >
              <option value="active">Active in Period</option>
              <option value="start">Order Start Date</option>
            </select>
          </div>
          {(customStartDate || customEndDate) && (
            <button
              type="button"
              onClick={() => {
                setCustomStartDate("");
                setCustomEndDate("");
                setDateFilterPreset("All");
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors ml-auto cursor-pointer"
              title="Clear custom date filter"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Dates</span>
            </button>
          )}
        </div>
      )}

      {/* Sub-bar: Results summary and Mobile view switcher */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Showing <strong className="text-slate-700">{filteredAndSortedOrders.length}</strong> of{" "}
            <strong className="text-slate-700">{orders.length}</strong> orders
          </span>
          {dateFilterPreset !== "All" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#083a60] border border-blue-100 font-semibold text-[11px]">
              <Calendar className="w-3 h-3 text-[#083a60]" />
              {dateFilterPreset === "Custom"
                ? `${customStartDate || "Start"} to ${customEndDate || "End"}`
                : dateFilterPreset === "ThisMonth"
                ? "This Month"
                : dateFilterPreset === "LastMonth"
                ? "Last Month"
                : dateFilterPreset === "ThisYear"
                ? "This Year"
                : dateFilterPreset}
            </span>
          )}
        </div>

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
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No rental orders yet
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by creating your first rental agreement for a customer.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Rental Order
          </button>
        </div>
      ) : filteredAndSortedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Filter className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No orders match your filters
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, status, or rental type filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "table" ? (
        <RentalOrdersTable
          orders={filteredAndSortedOrders}
          totalCount={orders.length}
          onMarkCompleted={handleMarkCompleted}
          onDeleteClick={(ord) => setOrderToDelete(ord)}
          onViewDetails={(ord) => setSelectedOrderForDetails(ord)}
          onEditClick={(ord) => setOrderToEdit(ord)}
          sortBy={sortBy}
          onSortChange={(newSort) => setSortBy(newSort)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAndSortedOrders.map((order) => (
            <RentalOrderCard
              key={order.id}
              order={order}
              onMarkCompleted={handleMarkCompleted}
              onDeleteClick={(ord) => setOrderToDelete(ord)}
              onEditClick={(ord) => setOrderToEdit(ord)}
            />
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <RentalOrderDetailsModal
          order={selectedOrderForDetails}
          isOpen={Boolean(selectedOrderForDetails)}
          onClose={() => setSelectedOrderForDetails(null)}
          onMarkCompleted={handleMarkCompleted}
          onDeleteClick={(ord) => {
            setSelectedOrderForDetails(null);
            setOrderToDelete(ord);
          }}
          onEditClick={(ord) => {
            setSelectedOrderForDetails(null);
            setOrderToEdit(ord);
          }}
        />
      )}

      {/* New Rental Order Modal */}
      {isAddModalOpen && (
        <NewRentalOrderModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          customers={customers}
          generators={generators}
          onSubmit={handleCreateOrder}
          onCustomerAdded={(newCust) => setExtraCustomers((prev) => [newCust, ...prev])}
          onGeneratorAdded={(newGen) => setExtraGenerators((prev) => [newGen, ...prev])}
        />
      )}

      {/* Edit Rental Order Modal */}
      {orderToEdit && (
        <EditRentalOrderModal
          order={orderToEdit}
          isOpen={Boolean(orderToEdit)}
          onClose={() => setOrderToEdit(null)}
          customers={customers}
          generators={generators}
          onSubmit={handleUpdateOrder}
          onCustomerAdded={(newCust) => setExtraCustomers((prev) => [newCust, ...prev])}
          onGeneratorAdded={(newGen) => setExtraGenerators((prev) => [newGen, ...prev])}
        />
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <DeleteRentalOrderModal
          order={orderToDelete}
          isOpen={Boolean(orderToDelete)}
          onClose={() => setOrderToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
