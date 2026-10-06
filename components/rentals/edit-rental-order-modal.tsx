"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Calendar, ChevronDown, Loader2, Search, Plus, Check } from "lucide-react";
import { Customer, Generator, RentalOrder } from "@/lib/db/schema";
import { CreateRentalOrderInput } from "@/app/rentals/actions";
import { createCustomer, CreateCustomerInput } from "@/app/customers/actions";
import {
  createGenerator,
  getNextSuggestedGeneratorId,
  CreateGeneratorInput,
} from "@/app/generators/actions";
import { AddCustomerModal } from "@/components/customers/add-customer-modal";
import { AddGeneratorModal } from "@/components/generators/add-generator-modal";

interface EditRentalOrderModalProps {
  order: RentalOrder | null;
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  generators: Generator[];
  onSubmit: (id: number, data: CreateRentalOrderInput) => Promise<{ success: boolean; error?: string }>;
  onCustomerAdded?: (customer: Customer) => void;
  onGeneratorAdded?: (generator: Generator) => void;
}

const getRateForType = (
  baseDailyRate: number | string | null | undefined,
  rentalType: string
): string => {
  if (!baseDailyRate) return "";
  const base = Number(baseDailyRate);
  if (isNaN(base) || base <= 0) return "";
  if (rentalType === "Monthly") return String(base * 30);
  if (rentalType === "Weekly") return String(base * 7);
  return String(base);
};

const convertRateBetweenTypes = (
  currentRate: number | string,
  fromType: string,
  toType: string
): string => {
  const num = Number(currentRate);
  if (isNaN(num) || num <= 0) return "";
  let baseDaily = num;
  if (fromType === "Monthly") baseDaily = num / 30;
  else if (fromType === "Weekly") baseDaily = num / 7;

  if (toType === "Monthly") return String(Math.round(baseDaily * 30));
  if (toType === "Weekly") return String(Math.round(baseDaily * 7));
  return String(Math.round(baseDaily));
};

export function EditRentalOrderModal({
  order,
  isOpen,
  onClose,
  customers,
  generators,
  onSubmit,
  onCustomerAdded,
  onGeneratorAdded,
}: EditRentalOrderModalProps) {
  const [formData, setFormData] = useState<CreateRentalOrderInput>({
    customerId: null,
    customerName: "",
    generatorId: null,
    generatorName: "",
    startDate: "",
    endDate: "",
    rentalType: "Monthly",
    dailyRate: "",
    transportCharges: "0",
    securityDeposit: "0",
    dieselIncluded: false,
    operatorIncluded: false,
    status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local added customer and generator lists
  const [addedCustomers, setAddedCustomers] = useState<Customer[]>([]);
  const [addedGenerators, setAddedGenerators] = useState<Generator[]>([]);

  const customerList = useMemo(() => {
    const existingIds = new Set(customers.map((c) => c.id));
    return [...addedCustomers.filter((c) => !existingIds.has(c.id)), ...customers];
  }, [addedCustomers, customers]);

  const generatorList = useMemo(() => {
    const existingIds = new Set(generators.map((g) => g.id));
    return [...addedGenerators.filter((g) => !existingIds.has(g.id)), ...generators];
  }, [addedGenerators, generators]);

  // Search states for comboboxes
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);

  const [generatorSearch, setGeneratorSearch] = useState("");
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  // Sub-modals states
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddGeneratorOpen, setIsAddGeneratorOpen] = useState(false);
  const [suggestedGenId, setSuggestedGenId] = useState("GEN-0808");

  // DOM Refs
  const customerRef = useRef<HTMLDivElement>(null);
  const generatorRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // Pre-fill form when order changes or modal opens
  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        customerId: order.customerId ?? null,
        customerName: order.customerName || "",
        generatorId: order.generatorId ?? null,
        generatorName: order.generatorName || "",
        startDate: order.startDate || "",
        endDate: order.endDate || "",
        rentalType: order.rentalType || "Monthly",
        dailyRate: order.dailyRate !== undefined && order.dailyRate !== null ? String(order.dailyRate) : "",
        transportCharges: order.transportCharges !== undefined && order.transportCharges !== null ? String(order.transportCharges) : "0",
        securityDeposit: order.securityDeposit !== undefined && order.securityDeposit !== null ? String(order.securityDeposit) : "0",
        dieselIncluded: Boolean(order.dieselIncluded),
        operatorIncluded: Boolean(order.operatorIncluded),
        status: order.status || "Active",
      });
      setCustomerSearch(order.customerName || "");
      setGeneratorSearch(order.generatorName || "");
      setError(null);
    }
  }, [order, isOpen]);

  // Close combobox dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setIsCustomerOpen(false);
      }
      if (generatorRef.current && !generatorRef.current.contains(e.target as Node)) {
        setIsGeneratorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle ESC key for modal dismissal (ignore if sub-modal is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !isAddCustomerOpen && !isAddGeneratorOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose, isAddCustomerOpen, isAddGeneratorOpen]);

  // Filtered customers based on search query
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customerList;
    return customerList.filter((c) => {
      const comp = c.companyName?.toLowerCase() || "";
      const cust = c.customerName?.toLowerCase() || "";
      const contact = c.contactPerson?.toLowerCase() || "";
      const phone = c.phone?.toLowerCase() || "";
      const email = c.email?.toLowerCase() || "";
      return comp.includes(q) || cust.includes(q) || contact.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [customerList, customerSearch]);

  // Filtered generators based on search query
  const filteredGenerators = useMemo(() => {
    const q = generatorSearch.toLowerCase().trim();
    if (!q) return generatorList;
    return generatorList.filter((g) => {
      const name = g.name.toLowerCase();
      const model = g.model.toLowerCase();
      const brand = g.brand?.toLowerCase() || "";
      const cap = String(g.capacityKva).toLowerCase();
      const status = g.status.toLowerCase();
      const genId = g.generatorId?.toLowerCase() || "";
      return (
        name.includes(q) ||
        model.includes(q) ||
        brand.includes(q) ||
        cap.includes(q) ||
        status.includes(q) ||
        genId.includes(q)
      );
    });
  }, [generatorList, generatorSearch]);

  if (!isOpen || !order) return null;

  // Selection handlers
  const handleSelectCustomer = (c: Customer) => {
    const displayName = c.companyName || c.customerName;
    setFormData((prev) => ({
      ...prev,
      customerId: c.id,
      customerName: displayName,
    }));
    setCustomerSearch(displayName);
    setIsCustomerOpen(false);
  };

  const handleClearCustomer = () => {
    setFormData((prev) => ({
      ...prev,
      customerId: null,
      customerName: "",
    }));
    setCustomerSearch("");
    setIsCustomerOpen(true);
  };

  const handleSelectGenerator = (g: Generator) => {
    const displayName = `${g.name} (${g.model})`;
    setFormData((prev) => ({
      ...prev,
      generatorId: g.id,
      generatorName: displayName,
      dailyRate: g.dailyRate ? getRateForType(g.dailyRate, prev.rentalType) : prev.dailyRate,
    }));
    setGeneratorSearch(displayName);
    setIsGeneratorOpen(false);
  };

  const handleClearGenerator = () => {
    setFormData((prev) => ({
      ...prev,
      generatorId: null,
      generatorName: "",
    }));
    setGeneratorSearch("");
    setIsGeneratorOpen(true);
  };

  // Add Customer sub-modal submission
  const handleCreateCustomerSubmit = async (data: CreateCustomerInput) => {
    const res = await createCustomer(data);
    if (res.success && res.data) {
      const newCust = res.data as Customer;
      setAddedCustomers((prev) => [newCust, ...prev]);
      onCustomerAdded?.(newCust);
      handleSelectCustomer(newCust);
      setIsAddCustomerOpen(false);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to create customer" };
  };

  // Add Generator sub-modal opening and submission
  const handleOpenAddGeneratorModal = async () => {
    try {
      const nextId = await getNextSuggestedGeneratorId();
      setSuggestedGenId(nextId);
    } catch {
      setSuggestedGenId("GEN-0811");
    }
    setIsAddGeneratorOpen(true);
  };

  const handleCreateGeneratorSubmit = async (data: CreateGeneratorInput) => {
    const res = await createGenerator(data);
    if (res.success && res.data) {
      const newGen = res.data as Generator;
      setAddedGenerators((prev) => [newGen, ...prev]);
      onGeneratorAdded?.(newGen);
      handleSelectGenerator(newGen);
      setIsAddGeneratorOpen(false);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to create generator" };
  };

  const handleRentalTypeChange = (newType: string) => {
    setFormData((prev) => {
      let updatedRate = prev.dailyRate;
      const selectedGen = prev.generatorId
        ? generatorList.find((g) => g.id === prev.generatorId)
        : null;

      if (selectedGen && selectedGen.dailyRate) {
        updatedRate = getRateForType(selectedGen.dailyRate, newType);
      } else if (prev.dailyRate) {
        updatedRate = convertRateBetweenTypes(prev.dailyRate, prev.rentalType, newType);
      }

      return {
        ...prev,
        rentalType: newType,
        dailyRate: updatedRate,
      };
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === "rentalType") {
      handleRentalTypeChange(value);
      return;
    }
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Resolve customer if user typed but didn't click
    let currentCustomerId = formData.customerId;
    let currentCustomerName = formData.customerName.trim();
    if (!currentCustomerName && customerSearch.trim()) {
      const matched = customerList.find(
        (c) =>
          (c.companyName && c.companyName.toLowerCase() === customerSearch.trim().toLowerCase()) ||
          (c.customerName && c.customerName.toLowerCase() === customerSearch.trim().toLowerCase())
      );
      if (matched) {
        currentCustomerId = matched.id;
        currentCustomerName = matched.companyName || matched.customerName;
      } else {
        currentCustomerName = customerSearch.trim();
      }
    }

    // Resolve generator if user typed but didn't click
    let currentGeneratorId = formData.generatorId;
    let currentGeneratorName = formData.generatorName.trim();
    let currentDailyRate = formData.dailyRate;
    if (!currentGeneratorName && generatorSearch.trim()) {
      const matchedGen = generatorList.find(
        (g) =>
          g.name.toLowerCase() === generatorSearch.trim().toLowerCase() ||
          `${g.name} (${g.model})`.toLowerCase() === generatorSearch.trim().toLowerCase()
      );
      if (matchedGen) {
        currentGeneratorId = matchedGen.id;
        currentGeneratorName = `${matchedGen.name} (${matchedGen.model})`;
        if (!currentDailyRate && matchedGen.dailyRate) {
          currentDailyRate = getRateForType(matchedGen.dailyRate, formData.rentalType);
        }
      } else {
        currentGeneratorName = generatorSearch.trim();
      }
    }

    if (!currentCustomerName) {
      setError("Please select or search for a customer.");
      return;
    }
    if (!currentGeneratorName) {
      setError("Please select or search for a generator.");
      return;
    }
    if (!formData.startDate) {
      setError("Please select a start date.");
      return;
    }
    if (!formData.endDate) {
      setError("Please select an end date.");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    const rateLabelText =
      formData.rentalType === "Monthly"
        ? "monthly rate"
        : formData.rentalType === "Weekly"
        ? "weekly rate"
        : "daily rate";

    if (!currentDailyRate || Number(currentDailyRate) <= 0) {
      setError(`Please enter a valid ${rateLabelText}.`);
      return;
    }

    const payload: CreateRentalOrderInput = {
      ...formData,
      customerId: currentCustomerId,
      customerName: currentCustomerName,
      generatorId: currentGeneratorId,
      generatorName: currentGeneratorName,
      dailyRate: currentDailyRate,
    };

    setLoading(true);
    try {
      const res = await onSubmit(order.id, payload);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to update rental order.");
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-rental-order-title"
      >
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-start justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div>
              <div className="flex items-center gap-2.5">
                <h2
                  id="edit-rental-order-title"
                  className="text-xl font-bold text-slate-900 tracking-tight"
                >
                  Edit Rental Order
                </h2>
                <span className="font-mono text-xs font-bold text-[#083a60] bg-blue-50/70 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Update rental agreement terms and schedule
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Order Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Customer Search & Add */}
              <div
                className={`relative ${isCustomerOpen ? "z-30" : "z-10"}`}
                ref={customerRef}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-900">
                    Customer
                  </label>
                  {formData.customerId && (
                    <span className="text-xs font-medium text-emerald-600">
                      Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsCustomerOpen(true);
                        if (formData.customerId) {
                          const selected = customerList.find(
                            (c) => c.id === formData.customerId
                          );
                          const currentName = selected
                            ? selected.companyName || selected.customerName
                            : "";
                          if (e.target.value !== currentName) {
                            setFormData((prev) => ({
                              ...prev,
                              customerId: null,
                              customerName: e.target.value,
                            }));
                          }
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            customerName: e.target.value,
                          }));
                        }
                      }}
                      onFocus={() => setIsCustomerOpen(true)}
                      placeholder="Type to search customer..."
                      className="w-full pl-9 pr-16 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                      autoComplete="off"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {customerSearch && (
                        <button
                          type="button"
                          onClick={handleClearCustomer}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                          title="Clear customer selection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsCustomerOpen((prev) => !prev)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                        title="Toggle dropdown"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isCustomerOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Customer Dropdown */}
                    {isCustomerOpen && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => {
                            const isSelected = formData.customerId === c.id;
                            const displayName = c.companyName || c.customerName;
                            return (
                              <div
                                key={c.id}
                                onClick={() => handleSelectCustomer(c)}
                                className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                                  isSelected
                                    ? "bg-[#083a60]/5 text-[#083a60]"
                                    : "text-slate-800"
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="text-sm font-semibold truncate">
                                    {displayName}
                                  </div>
                                  {(c.contactPerson || c.phone) && (
                                    <div className="text-xs text-slate-500 truncate mt-0.5">
                                      {[c.contactPerson, c.phone]
                                        .filter(Boolean)
                                        .join(" • ")}
                                    </div>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#083a60] shrink-0" />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-4 text-center">
                            <p className="text-xs text-slate-500">
                              No customer found matching &ldquo;{customerSearch}&rdquo;
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomerOpen(false);
                                setIsAddCustomerOpen(true);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#083a60]/10 hover:bg-[#083a60]/15 text-[#083a60] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              Add new customer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add Customer Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all shrink-0 cursor-pointer shadow-2xs hover:border-slate-300 active:scale-95"
                    title="Add new customer"
                  >
                    <Plus className="w-4 h-4 text-[#083a60] stroke-[2.5]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Generator Search & Add */}
              <div
                className={`relative ${isGeneratorOpen ? "z-20" : "z-5"}`}
                ref={generatorRef}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-900">
                    Generator
                  </label>
                  {formData.generatorId && (
                    <span className="text-xs font-medium text-emerald-600">
                      Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={generatorSearch}
                      onChange={(e) => {
                        setGeneratorSearch(e.target.value);
                        setIsGeneratorOpen(true);
                        if (formData.generatorId) {
                          const selected = generatorList.find(
                            (g) => g.id === formData.generatorId
                          );
                          const currentName = selected
                            ? `${selected.name} (${selected.model})`
                            : "";
                          if (e.target.value !== currentName) {
                            setFormData((prev) => ({
                              ...prev,
                              generatorId: null,
                              generatorName: e.target.value,
                            }));
                          }
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            generatorName: e.target.value,
                          }));
                        }
                      }}
                      onFocus={() => setIsGeneratorOpen(true)}
                      placeholder="Type to search generator..."
                      className="w-full pl-9 pr-16 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs"
                      autoComplete="off"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {generatorSearch && (
                        <button
                          type="button"
                          onClick={handleClearGenerator}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                          title="Clear generator selection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsGeneratorOpen((prev) => !prev)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                        title="Toggle dropdown"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isGeneratorOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Generator Dropdown */}
                    {isGeneratorOpen && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                        {filteredGenerators.length > 0 ? (
                          filteredGenerators.map((g) => {
                            const isSelected = formData.generatorId === g.id;
                            const isAvailable =
                              g.status?.toLowerCase() === "available";
                            return (
                              <div
                                key={g.id}
                                onClick={() => handleSelectGenerator(g)}
                                className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                                  isSelected
                                    ? "bg-[#083a60]/5 text-[#083a60]"
                                    : "text-slate-800"
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold truncate">
                                      {g.name}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">
                                      ({g.model})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs">
                                    <span className="font-medium text-slate-600">
                                      {g.capacityKva} kVA
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span
                                      className={`px-1.5 py-0.2 shrink-0 rounded font-medium text-[11px] ${
                                        isAvailable
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                          : "bg-amber-50 text-amber-700 border border-amber-200/60"
                                      }`}
                                    >
                                      {g.status}
                                    </span>
                                    {g.dailyRate && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500">
                                          ₹{Number(getRateForType(g.dailyRate, formData.rentalType)).toLocaleString("en-IN")}/
                                          {formData.rentalType === "Monthly" ? "mo" : formData.rentalType === "Weekly" ? "wk" : "day"}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#083a60] shrink-0" />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-4 text-center">
                            <p className="text-xs text-slate-500">
                              No generator found matching &ldquo;{generatorSearch}&rdquo;
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsGeneratorOpen(false);
                                handleOpenAddGeneratorModal();
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#083a60]/10 hover:bg-[#083a60]/15 text-[#083a60] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              Add new generator
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add Generator Button */}
                  <button
                    type="button"
                    onClick={handleOpenAddGeneratorModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all shrink-0 cursor-pointer shadow-2xs hover:border-slate-300 active:scale-95"
                    title="Add new generator"
                  >
                    <Plus className="w-4 h-4 text-[#083a60] stroke-[2.5]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Start Date
                  </label>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => {
                      try {
                        startDateRef.current?.showPicker();
                      } catch {
                        startDateRef.current?.focus();
                      }
                    }}
                  >
                    <input
                      ref={startDateRef}
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <Calendar className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    End Date
                  </label>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => {
                      try {
                        endDateRef.current?.showPicker();
                      } catch {
                        endDateRef.current?.focus();
                      }
                    }}
                  >
                    <input
                      ref={endDateRef}
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <Calendar className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Rental Type & Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Rental Type
                  </label>
                  <div className="relative">
                    <select
                      name="rentalType"
                      value={formData.rentalType}
                      onChange={handleChange}
                      className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all cursor-pointer font-medium"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Daily">Daily</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    {formData.rentalType === "Monthly"
                      ? "Monthly Rate"
                      : formData.rentalType === "Weekly"
                      ? "Weekly Rate"
                      : "Daily Rate"}{" "}
                    (₹)
                  </label>
                  <input
                    type="number"
                    name="dailyRate"
                    value={formData.dailyRate}
                    onChange={handleChange}
                    placeholder={
                      formData.rentalType === "Monthly"
                        ? "135000"
                        : formData.rentalType === "Weekly"
                        ? "31500"
                        : "4500"
                    }
                    min="0"
                    step="any"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Transport Charges & Security Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Transport Charges (₹)
                  </label>
                  <input
                    type="number"
                    name="transportCharges"
                    value={formData.transportCharges}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    name="securityDeposit"
                    value={formData.securityDeposit}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="any"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Diesel Included & Operator Included Switch Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Diesel Included */}
                <label
                  htmlFor="editDieselIncluded"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    Diesel Included
                  </span>
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      id="editDieselIncluded"
                      name="dieselIncluded"
                      checked={Boolean(formData.dieselIncluded)}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083a60]"></div>
                  </div>
                </label>

                {/* Operator Included */}
                <label
                  htmlFor="editOperatorIncluded"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    Operator Included
                  </span>
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      id="editOperatorIncluded"
                      name="operatorIncluded"
                      checked={Boolean(formData.operatorIncluded)}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083a60]"></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onSubmit={handleCreateCustomerSubmit}
          zIndex="z-[60]"
        />
      )}

      {/* Quick Add Generator Modal */}
      {isAddGeneratorOpen && (
        <AddGeneratorModal
          isOpen={isAddGeneratorOpen}
          onClose={() => setIsAddGeneratorOpen(false)}
          onSubmit={handleCreateGeneratorSubmit}
          suggestedId={suggestedGenId}
          zIndex="z-[60]"
        />
      )}
    </>
  );
}
