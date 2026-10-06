"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { Generator } from "@/lib/db/schema";
import { GeneratorTable } from "./generator-table";
import { GeneratorDetailsModal } from "./generator-details-modal";
import { EditGeneratorModal } from "./edit-generator-modal";
import { AddGeneratorModal } from "./add-generator-modal";
import {
  createGenerator,
  updateGenerator,
  deleteGenerator,
  CreateGeneratorInput,
  getNextSuggestedGeneratorId,
} from "@/app/generators/actions";

interface GeneratorsViewProps {
  initialGenerators: Generator[];
}

export function GeneratorsView({ initialGenerators }: GeneratorsViewProps) {
  const [generators, setGenerators] = useState<Generator[]>(initialGenerators);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGenerator, setSelectedGenerator] = useState<Generator | null>(null);

  const [suggestedId, setSuggestedId] = useState("GEN-0001");
  const [notification, setNotification] = useState<string | null>(null);

  // Filtered generators based on search query and status filter
  const filteredGenerators = useMemo(() => {
    return generators.filter((gen) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        gen.generatorId.toLowerCase().includes(q) ||
        gen.name.toLowerCase().includes(q) ||
        (gen.brand && gen.brand.toLowerCase().includes(q)) ||
        gen.model.toLowerCase().includes(q) ||
        (gen.location && gen.location.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === "All Status") return true;
      const statusLower = gen.status.toLowerCase();
      const filterLower = statusFilter.toLowerCase();

      if (filterLower === "maintenance") {
        return statusLower.includes("maintenance");
      }
      return statusLower === filterLower;
    });
  }, [generators, searchQuery, statusFilter]);

  const handleOpenAddModal = async () => {
    try {
      const nextId = await getNextSuggestedGeneratorId();
      setSuggestedId(nextId);
    } catch {
      setSuggestedId("GEN-0001");
    }
    setIsAddModalOpen(true);
  };

  const handleRowClick = (gen: Generator) => {
    setSelectedGenerator(gen);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEdit = (gen: Generator) => {
    setSelectedGenerator(gen);
    setIsEditModalOpen(true);
  };

  const handleOpenEditFromDetails = (gen: Generator) => {
    setIsDetailsModalOpen(false);
    setSelectedGenerator(gen);
    setIsEditModalOpen(true);
  };

  const handleCreateGenerator = async (data: CreateGeneratorInput) => {
    const res = await createGenerator(data);
    if (res.success && res.data) {
      setGenerators((prev) => [res.data as Generator, ...prev]);
      showNotification(`Generator ${data.generatorId} added successfully`);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to create generator" };
  };

  const handleUpdateGenerator = async (
    id: number,
    data: Partial<CreateGeneratorInput>
  ) => {
    const res = await updateGenerator(id, data);
    if (res.success && res.data) {
      const updated = res.data as Generator;
      setGenerators((prev) =>
        prev.map((g) => (g.id === id ? updated : g))
      );
      setSelectedGenerator(updated);
      showNotification(`Generator ${updated.generatorId} updated successfully`);
      return { success: true, data: updated };
    }
    return { success: false, error: res.error || "Failed to update generator" };
  };

  const handleDeleteGenerator = async (id: number) => {
    const res = await deleteGenerator(id);
    if (res.success) {
      setGenerators((prev) => prev.filter((g) => g.id !== id));
      if (selectedGenerator?.id === id) {
        setSelectedGenerator(null);
        setIsDetailsModalOpen(false);
      }
      showNotification("Generator deleted successfully");
    } else {
      alert("Error deleting generator: " + (res.error || "Unknown error"));
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

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
            Generators
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage your complete generator fleet
          </p>
        </div>
        {/* Full "Add Generator" button — desktop only */}
        <button
          onClick={handleOpenAddModal}
          className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Generator</span>
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
            placeholder="Search by ID, brand, model..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
          />
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </div>

      {/* MOBILE Row 2: Status filter */}
      <div className="relative sm:hidden">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
        >
          <option value="All Status">All Status</option>
          <option value="Available">Available</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Breakdown">Breakdown</option>
          <option value="On Rent">On Rent</option>
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* DESKTOP: Search + Status filter */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, brand, model..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
          />
        </div>
        <div className="relative shrink-0 min-w-[150px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-slate-200/90 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
          >
            <option value="All Status">All Status</option>
            <option value="Available">Available</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Breakdown">Breakdown</option>
            <option value="On Rent">On Rent</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Main View: Table View */}
      <GeneratorTable
        generators={filteredGenerators}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteGenerator}
        onOpenAddModal={handleOpenAddModal}
        onRowClick={handleRowClick}
      />

      {/* Details Modal with Edit Button */}
      <GeneratorDetailsModal
        generator={selectedGenerator}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={handleOpenEditFromDetails}
        onDelete={handleDeleteGenerator}
      />

      {/* Edit Generator Modal */}
      <EditGeneratorModal
        generator={selectedGenerator}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateGenerator}
      />

      {/* Add New Generator Modal */}
      <AddGeneratorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateGenerator}
        suggestedId={suggestedId}
      />
    </div>
  );
}
