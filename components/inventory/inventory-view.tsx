"use client";

import React, { useState, useMemo } from "react";
import {
  Package,
  AlertTriangle,
  AlertOctagon,
  Search,
  Plus,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";
import { InventoryItem } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  CreateInventoryInput,
} from "@/app/inventory/actions";
import { InventoryTable, formatIndianCurrency } from "./inventory-table";
import { AddInventoryModal } from "./add-inventory-modal";
import { EditInventoryModal } from "./edit-inventory-modal";
import { DeleteInventoryModal } from "./delete-inventory-modal";

interface InventoryViewProps {
  initialItems: InventoryItem[];
  generatorOptions: string[];
}

export function InventoryView({
  initialItems,
  generatorOptions,
}: InventoryViewProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [prevInitial, setPrevInitial] = useState(initialItems);
  if (prevInitial !== initialItems) {
    setPrevInitial(initialItems);
    setItems(initialItems);
  }

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Toast notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Dynamic metrics from current items list
  const stats = useMemo(() => {
    const totalItems = items.length;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of items) {
      const q = Number(item.qtyAvailable) || 0;
      const c = parseFloat(item.unitCost) || 0;
      const r = Number(item.reorderLevel) || 0;
      totalValue += q * c;

      if (q <= 0 || item.status === "Out of Stock") {
        outOfStockCount++;
      } else if (q <= r || item.status === "Low Stock") {
        lowStockCount++;
      }
    }

    return {
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [items]);

  // Unique categories for filter
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    return ["All", ...Array.from(set)];
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      // Search match
      const matchesSearch =
        !q ||
        item.partNumber?.toLowerCase().includes(q) ||
        item.partName?.toLowerCase().includes(q) ||
        item.model?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.compatibleGenerator?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category filter
      if (categoryFilter !== "All" && item.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "All") {
        const qty = Number(item.qtyAvailable) || 0;
        const reorder = Number(item.reorderLevel) || 0;
        if (statusFilter === "Out of Stock") {
          return qty <= 0 || item.status === "Out of Stock";
        }
        if (statusFilter === "Low Stock") {
          return (qty > 0 && qty <= reorder) || item.status === "Low Stock";
        }
        if (statusFilter === "In Stock") {
          return qty > reorder && item.status !== "Out of Stock" && item.status !== "Low Stock";
        }
      }

      return true;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  // CRUD Handlers
  const handleCreate = async (data: CreateInventoryInput) => {
    const res = await createInventoryItem(data);
    if (res.success && res.data) {
      const created = res.data as InventoryItem;
      setItems((prev) => [created, ...prev]);
      showNotification(`Part "${created.partNumber}" added successfully`);
      return { success: true };
    }
    return {
      success: false,
      error: res.error || "Failed to create inventory item",
    };
  };

  const handleUpdate = async (id: number, data: Partial<CreateInventoryInput>) => {
    const res = await updateInventoryItem(id, data);
    if (res.success && res.data) {
      const updated = res.data as InventoryItem;
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      showNotification(`Part "${updated.partNumber}" updated successfully`);
      return { success: true };
    }
    return {
      success: false,
      error: res.error || "Failed to update inventory item",
    };
  };

  const handleDelete = async (id: number) => {
    const res = await deleteInventoryItem(id);
    if (res.success) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      showNotification("Inventory item deleted successfully");
    } else {
      alert("Error deleting item: " + (res.error || "Unknown error"));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 lg:top-6 left-4 right-4 lg:left-auto lg:right-6 z-50 flex items-center gap-2 bg-[#083a60] text-white px-4 py-3 rounded-xl shadow-xl text-sm animate-in slide-in-from-top-4 duration-200 border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Inventory
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Spare parts, stock levels, reorder thresholds &amp; generator compatibility
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Part / Item</span>
        </button>
      </div>

      {/* Metric Cards (4 cards in a row matching Maintenance/Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* TOTAL PARTS */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-xs rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0284c7]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                TOTAL PARTS
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {stats.totalItems}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Distinct stock items
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#083a60] text-white shadow-xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* TOTAL VALUE */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-xs rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#eab308]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                TOTAL VALUE
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {formatIndianCurrency(stats.totalValue)}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Current inventory worth
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#eab308] text-slate-950 font-bold text-xl shadow-xs shrink-0">
              ₹
            </div>
          </div>
        </Card>

        {/* LOW STOCK ALERTS */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-xs rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#f59e0b]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                LOW STOCK ALERTS
              </span>
              <span className="text-3xl font-bold text-amber-600 mt-2">
                {stats.lowStockCount}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                At or below reorder level
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* OUT OF STOCK */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-xs rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#dc2626]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                OUT OF STOCK
              </span>
              <span className="text-3xl font-bold text-rose-600 mt-2">
                {stats.outOfStockCount}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Need urgent reordering
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-rose-600 text-white shadow-xs shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by part no., name, model, warehouse (e.g. LF9009, Oil Filter)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <div className="sm:w-52">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="All">All Categories</option>
                {uniqueCategories
                  .filter((c) => c !== "All")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Status:
          </span>
          {["All", "In Stock", "Low Stock", "Out of Stock"].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#083a60] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {status}
              </button>
            );
          })}

          {(categoryFilter !== "All" || statusFilter !== "All" || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter("All");
                setStatusFilter("All");
                setSearchQuery("");
              }}
              className="text-xs text-blue-600 hover:underline font-medium ml-2 cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <InventoryTable
        items={filteredItems}
        onEdit={(item) => setItemToEdit(item)}
        onDelete={(item) => setItemToDelete(item)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Add Modal */}
      {isAddModalOpen && (
        <AddInventoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreate}
          generatorOptions={generatorOptions}
        />
      )}

      {/* Edit Modal */}
      {itemToEdit && (
        <EditInventoryModal
          key={`edit-${itemToEdit.id}`}
          item={itemToEdit}
          isOpen={!!itemToEdit}
          onClose={() => setItemToEdit(null)}
          onSubmit={handleUpdate}
          generatorOptions={generatorOptions}
        />
      )}

      {/* Delete Modal */}
      {itemToDelete && (
        <DeleteInventoryModal
          key={`del-${itemToDelete.id}`}
          item={itemToDelete}
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
