"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Search, CheckCircle2 } from "lucide-react";
import { Customer } from "@/lib/db/schema";
import { CustomerTable } from "./customer-table";
import { AddCustomerModal } from "./add-customer-modal";
import { EditCustomerModal } from "./edit-customer-modal";
import { DeleteCustomerModal } from "./delete-customer-modal";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  CreateCustomerInput,
} from "@/app/customers/actions";

interface CustomersViewProps {
  initialCustomers: Customer[];
}

export function CustomersView({ initialCustomers }: CustomersViewProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;

    return customers.filter((cust) => {
      return (
        (cust.companyName && cust.companyName.toLowerCase().includes(q)) ||
        (cust.customerName && cust.customerName.toLowerCase().includes(q)) ||
        (cust.contactPerson && cust.contactPerson.toLowerCase().includes(q)) ||
        (cust.email && cust.email.toLowerCase().includes(q)) ||
        (cust.phone && cust.phone.toLowerCase().includes(q)) ||
        (cust.gstNumber && cust.gstNumber.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleCreateCustomer = async (data: CreateCustomerInput) => {
    const res = await createCustomer(data);
    if (res.success && res.data) {
      const created = res.data as Customer;
      setCustomers((prev) => [created, ...prev]);
      showNotification(`Customer "${created.companyName}" added successfully`);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to create customer" };
  };

  const handleUpdateCustomer = async (
    id: number,
    data: Partial<CreateCustomerInput>
  ) => {
    const res = await updateCustomer(id, data);
    if (res.success && res.data) {
      const updated = res.data as Customer;
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      showNotification(`Customer "${updated.companyName}" updated successfully`);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to update customer" };
  };

  const handleDeleteCustomer = async (id: number) => {
    const res = await deleteCustomer(id);
    if (res.success) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      showNotification("Customer deleted successfully");
    } else {
      alert("Error deleting customer: " + (res.error || "Unknown error"));
    }
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
            Customers
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage customer relationships &amp; billing
          </p>
        </div>
        {/* Full "Add Customer" button — desktop only */}
        <button
          onClick={handleOpenAddModal}
          className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* MOBILE: Search + compact "+ Add" on one line */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, phone (e.g. Acme Infra)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
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

      {/* DESKTOP: Full-width search bar */}
      <div className="relative w-full hidden sm:block">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, company, phone (e.g. Acme Infra)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
        />
      </div>

      {/* Customer Table */}
      <CustomerTable
        customers={filteredCustomers}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
      />

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <AddCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateCustomer}
        />
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && selectedCustomer && (
        <EditCustomerModal
          key={`edit-${selectedCustomer.id}`}
          customer={selectedCustomer}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCustomer(null);
          }}
          onSubmit={handleUpdateCustomer}
        />
      )}

      {/* Delete Customer Confirmation Modal */}
      {isDeleteModalOpen && selectedCustomer && (
        <DeleteCustomerModal
          key={`del-${selectedCustomer.id}`}
          customer={selectedCustomer}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedCustomer(null);
          }}
          onConfirm={handleDeleteCustomer}
        />
      )}
    </div>
  );
}

