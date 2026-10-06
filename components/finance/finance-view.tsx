"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  TrendingDown,
  TrendingUp,
  Search,
  Plus,
  CheckCircle2,
  X,
  Receipt,
  Users,
  AlertCircle,
  Clock,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import {
  Invoice,
  Payment,
  Expense,
  RentalOrder,
  Customer,
  Generator,
} from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import {
  createInvoice,
  recordPayment,
  createExpense,
  deleteInvoice,
  deletePayment,
  deleteExpense,
  CreateInvoiceInput,
  RecordPaymentInput,
  CreateExpenseInput,
} from "@/app/finance/actions";
import { InvoicesTable, formatINR } from "./invoices-table";
import { PaymentsTable } from "./payments-table";
import { ExpensesTable } from "./expenses-table";
import { CustomerBalancesTable } from "./customer-balances-table";
import { CreateInvoiceModal } from "./create-invoice-modal";
import { RecordPaymentModal } from "./record-payment-modal";
import { LogExpenseModal } from "./log-expense-modal";
import { InvoiceDetailsModal } from "./invoice-details-modal";
import { DeleteFinanceModal } from "./delete-finance-modal";

interface FinanceViewProps {
  initialInvoices: Invoice[];
  initialPayments: Payment[];
  initialExpenses: Expense[];
  rentalOrders: RentalOrder[];
  customers: Customer[];
  generators: Generator[];
}

type ActiveTab = "invoices" | "payments" | "expenses" | "customers";
type InvoiceSortOption = "newest" | "oldest" | "due_date" | "amount_desc" | "amount_asc";
type PaymentSortOption = "newest" | "oldest" | "amount_desc" | "amount_asc";
type ExpenseSortOption = "newest" | "oldest" | "amount_desc" | "amount_asc";
type CustomerSortOption = "highest_due" | "most_billed" | "name_asc" | "name_desc";

export function FinanceView({
  initialInvoices,
  initialPayments,
  initialExpenses,
  rentalOrders,
  customers,
  generators,
}: FinanceViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const [activeTab, setActiveTab] = useState<ActiveTab>("invoices");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("All");
  const [paymentModeFilter, setPaymentModeFilter] = useState("All");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("All");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("All");

  // Sort selectors
  const [invoiceSort, setInvoiceSort] = useState<
    "newest" | "oldest" | "due_date" | "amount_desc" | "amount_asc"
  >("newest");
  const [paymentSort, setPaymentSort] = useState<
    "newest" | "oldest" | "amount_desc" | "amount_asc"
  >("newest");
  const [expenseSort, setExpenseSort] = useState<
    "newest" | "oldest" | "amount_desc" | "amount_asc"
  >("newest");
  const [customerSort, setCustomerSort] = useState<
    "highest_due" | "most_billed" | "name_asc" | "name_desc"
  >("highest_due");

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [preselectedInvoiceForPay, setPreselectedInvoiceForPay] = useState<Invoice | null>(null);
  const [preselectedCustomerForPay, setPreselectedCustomerForPay] = useState<Customer | null>(null);
  const [preselectedCustomerForInv, setPreselectedCustomerForInv] = useState<Customer | null>(null);

  // Deletion modal
  const [deleteModalState, setDeleteModalState] = useState<{
    type: "invoice" | "payment" | "expense";
    item: Invoice | Payment | Expense;
  } | null>(null);

  // Financial KPIs
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    const today = new Date().toISOString().split("T")[0];

    for (const inv of invoices) {
      const tot = parseFloat(inv.totalAmount) || 0;
      const pd = parseFloat(inv.paidAmount) || 0;
      const bal = parseFloat(inv.balanceAmount) || 0;
      totalRevenue += tot;
      totalCollected += pd;
      totalOutstanding += bal;

      if (bal > 0 && inv.dueDate && inv.dueDate < today) {
        overdueCount++;
      }
    }

    let totalExpenses = 0;
    for (const exp of expenses) {
      totalExpenses += parseFloat(exp.amount) || 0;
    }

    const netProfit = totalCollected - totalExpenses;
    const collectionRate =
      totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 100;

    return {
      totalRevenue,
      totalCollected,
      totalOutstanding,
      totalExpenses,
      netProfit,
      collectionRate,
      overdueCount,
    };
  }, [invoices, expenses]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    if (searchQuery.trim() !== "") return true;
    if (activeTab === "invoices") {
      return invoiceStatusFilter !== "All" || invoiceSort !== "newest";
    }
    if (activeTab === "payments") {
      return paymentModeFilter !== "All" || paymentSort !== "newest";
    }
    if (activeTab === "expenses") {
      return expenseCategoryFilter !== "All" || expenseSort !== "newest";
    }
    if (activeTab === "customers") {
      return customerStatusFilter !== "All" || customerSort !== "highest_due";
    }
    return false;
  }, [
    searchQuery,
    activeTab,
    invoiceStatusFilter,
    invoiceSort,
    paymentModeFilter,
    paymentSort,
    expenseCategoryFilter,
    expenseSort,
    customerStatusFilter,
    customerSort,
  ]);

  const handleResetFilters = () => {
    setSearchQuery("");
    if (activeTab === "invoices") {
      setInvoiceStatusFilter("All");
      setInvoiceSort("newest");
    } else if (activeTab === "payments") {
      setPaymentModeFilter("All");
      setPaymentSort("newest");
    } else if (activeTab === "expenses") {
      setExpenseCategoryFilter("All");
      setExpenseSort("newest");
    } else if (activeTab === "customers") {
      setCustomerStatusFilter("All");
      setCustomerSort("highest_due");
    }
  };

  // Filtered & Sorted Invoices
  const sortedInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const today = new Date().toISOString().split("T")[0];

    const list = invoices.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.orderNumber && inv.orderNumber.toLowerCase().includes(q)) ||
        (inv.customerGst && inv.customerGst.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (invoiceStatusFilter !== "All") {
        const bal = parseFloat(inv.balanceAmount) || 0;
        const isOverdue = bal > 0 && inv.dueDate && inv.dueDate < today;

        if (invoiceStatusFilter === "Overdue") {
          return isOverdue;
        }
        if (invoiceStatusFilter === "Paid") {
          return inv.status.toLowerCase() === "paid" || bal <= 0;
        }
        if (invoiceStatusFilter === "Partially Paid") {
          return (
            inv.status.toLowerCase() === "partially paid" ||
            (parseFloat(inv.paidAmount) > 0 && bal > 0)
          );
        }
        if (invoiceStatusFilter === "Pending") {
          return inv.status.toLowerCase() === "pending" && !isOverdue;
        }
      }

      return true;
    });

    if (invoiceSort === "newest") {
      list.sort((a, b) => b.id - a.id);
    } else if (invoiceSort === "oldest") {
      list.sort((a, b) => a.id - b.id);
    } else if (invoiceSort === "due_date") {
      list.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    } else if (invoiceSort === "amount_desc") {
      list.sort((a, b) => (parseFloat(b.totalAmount) || 0) - (parseFloat(a.totalAmount) || 0));
    } else if (invoiceSort === "amount_asc") {
      list.sort((a, b) => (parseFloat(a.totalAmount) || 0) - (parseFloat(b.totalAmount) || 0));
    }

    return list;
  }, [invoices, searchQuery, invoiceStatusFilter, invoiceSort]);

  // Filtered & Sorted Payments
  const sortedPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = payments.filter((p) => {
      const matchesSearch =
        !q ||
        p.paymentNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
        p.paymentMethod.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (paymentModeFilter !== "All" && p.paymentMethod !== paymentModeFilter) {
        return false;
      }
      return true;
    });

    if (paymentSort === "newest") {
      list.sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || "") || b.id - a.id);
    } else if (paymentSort === "oldest") {
      list.sort((a, b) => (a.paymentDate || "").localeCompare(b.paymentDate || "") || a.id - b.id);
    } else if (paymentSort === "amount_desc") {
      list.sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));
    } else if (paymentSort === "amount_asc") {
      list.sort((a, b) => (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0));
    }

    return list;
  }, [payments, searchQuery, paymentModeFilter, paymentSort]);

  // Filtered & Sorted Expenses
  const sortedExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = expenses.filter((e) => {
      const matchesSearch =
        !q ||
        e.expenseNumber.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.generatorName && e.generatorName.toLowerCase().includes(q)) ||
        (e.vendor && e.vendor.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (expenseCategoryFilter !== "All" && e.category !== expenseCategoryFilter) {
        return false;
      }
      return true;
    });

    if (expenseSort === "newest") {
      list.sort((a, b) => (b.expenseDate || "").localeCompare(a.expenseDate || "") || b.id - a.id);
    } else if (expenseSort === "oldest") {
      list.sort((a, b) => (a.expenseDate || "").localeCompare(b.expenseDate || "") || a.id - b.id);
    } else if (expenseSort === "amount_desc") {
      list.sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));
    } else if (expenseSort === "amount_asc") {
      list.sort((a, b) => (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0));
    }

    return list;
  }, [expenses, searchQuery, expenseCategoryFilter, expenseSort]);

  // Handlers for Creating / Recording
  const handleCreateInvoiceSubmit = async (data: CreateInvoiceInput) => {
    const res = await createInvoice(data);
    if (res.success && res.data) {
      setInvoices((prev) => [res.data as Invoice, ...prev]);
      showNotification(`Tax Invoice ${res.data.invoiceNumber} generated successfully`);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to create invoice" };
  };

  const handleRecordPaymentSubmit = async (data: RecordPaymentInput) => {
    const res = await recordPayment(data);
    if (res.success && res.data) {
      const newPay = res.data as Payment;
      setPayments((prev) => [newPay, ...prev]);

      // If linked to an invoice, locally update that invoice
      if (data.invoiceId) {
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === data.invoiceId) {
              const prevPaid = parseFloat(inv.paidAmount) || 0;
              const total = parseFloat(inv.totalAmount) || 0;
              const payAmt = parseFloat(String(data.amount)) || 0;
              const newPaid = Math.min(total, prevPaid + payAmt);
              const newBal = Math.max(0, total - newPaid);
              return {
                ...inv,
                paidAmount: newPaid.toFixed(2),
                balanceAmount: newBal.toFixed(2),
                status: newBal <= 0 ? "Paid" : "Partially Paid",
              };
            }
            return inv;
          })
        );
      }

      showNotification(`Payment ${newPay.paymentNumber} of ${formatINR(data.amount)} recorded`);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to record payment" };
  };

  const handleLogExpenseSubmit = async (data: CreateExpenseInput) => {
    const res = await createExpense(data);
    if (res.success && res.data) {
      setExpenses((prev) => [res.data as Expense, ...prev]);
      showNotification(`Expense ${res.data.expenseNumber} logged successfully`);
      return { success: true };
    }
    return { success: false, error: res.error || "Failed to log expense" };
  };

  // Handlers for Deletion
  const handleConfirmDelete = async () => {
    if (!deleteModalState) return;
    const { type, item } = deleteModalState;

    if (type === "invoice") {
      await deleteInvoice(item.id);
      setInvoices((prev) => prev.filter((i) => i.id !== item.id));
      showNotification("Invoice removed");
    } else if (type === "payment") {
      await deletePayment(item.id);
      setPayments((prev) => prev.filter((p) => p.id !== item.id));
      showNotification("Payment record removed");
    } else if (type === "expense") {
      await deleteExpense(item.id);
      setExpenses((prev) => prev.filter((e) => e.id !== item.id));
      showNotification("Expense entry removed");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#083a60] text-white text-sm font-medium rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            Finance &amp; Accounts
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Revenue tracking, tax billing, collections, and operational expenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Create Invoice */}
          <button
            onClick={() => {
              setPreselectedCustomerForInv(null);
              setIsCreateInvoiceOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#083a60] hover:bg-[#0c4a7e] text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Invoice</span>
          </button>

          {/* Record Payment */}
          <button
            onClick={() => {
              setPreselectedInvoiceForPay(null);
              setPreselectedCustomerForPay(null);
              setIsRecordPaymentOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>

          {/* Log Expense */}
          <button
            onClick={() => setIsLogExpenseOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Executive Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Billed / Revenue */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-6 pr-4">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0284c7]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                TOTAL BILLED
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-2">
                {formatINR(stats.totalRevenue)}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                {invoices.length} Tax Invoices
              </span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#083a60] shadow-2xs shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Collections Received */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-6 pr-4">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#059669]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                COLLECTED
              </span>
              <span className="text-2xl font-bold text-emerald-700 mt-2">
                {formatINR(stats.totalCollected)}
              </span>
              <span className="text-xs text-emerald-600 font-medium mt-1">
                {stats.collectionRate}% Recovery Rate
              </span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 shadow-2xs shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-6 pr-4">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#f59e0b]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                RECEIVABLES
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-2">
                {formatINR(stats.totalOutstanding)}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {stats.overdueCount > 0 ? (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {stats.overdueCount} Overdue
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">All within terms</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-700 shadow-2xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-6 pr-4">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#e11d48]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                OP. EXPENSES
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-2">
                {formatINR(stats.totalExpenses)}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Fuel, Spares, Logistics
              </span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 text-rose-700 shadow-2xs shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Net Operating Margin */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-6 pr-4">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#4f46e5]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                NET CASH FLOW
              </span>
              <span
                className={`text-2xl font-bold mt-2 ${
                  stats.netProfit >= 0 ? "text-slate-900" : "text-rose-600"
                }`}
              >
                {formatINR(stats.netProfit)}
              </span>
              <span className="text-xs text-indigo-600 font-medium mt-1">
                Collected vs Outflow
              </span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 shadow-2xs shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Sub-Tabs (Top Row) */}
      <div className="border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-fit max-w-full overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("invoices");
              setSearchQuery("");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "invoices"
                ? "bg-white text-[#083a60] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices &amp; Billing</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "invoices"
                  ? "bg-[#083a60] text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {invoices.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("payments");
              setSearchQuery("");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "payments"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments &amp; Collections</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "payments"
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {payments.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("expenses");
              setSearchQuery("");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "expenses"
                ? "bg-white text-rose-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Expenses &amp; Outflow</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "expenses"
                  ? "bg-rose-700 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {expenses.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("customers");
              setSearchQuery("");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "customers"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer Aging &amp; Balances</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "customers"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {customers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Controls (Row Below Tabs) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input with clear button */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "invoices"
                ? "Search by invoice #, customer, order #, GST..."
                : activeTab === "payments"
                ? "Search by receipt #, customer, ref #, mode..."
                : activeTab === "expenses"
                ? "Search by expense #, description, category, vendor, DG..."
                : "Search by customer name, company, contact, phone, GST..."
            }
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

        {/* Tab-Specific Filter Selector */}
        <div className="sm:w-52">
          <div className="relative">
            {activeTab === "invoices" && (
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            )}

            {activeTab === "payments" && (
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="All">All Payment Modes</option>
                <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            )}

            {activeTab === "expenses" && (
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Diesel / Fuel">Diesel / Fuel</option>
                <option value="Maintenance & Repairs">Maintenance &amp; Repairs</option>
                <option value="Transportation & Crane">Transportation &amp; Crane</option>
                <option value="Operator Wages">Operator Wages</option>
                <option value="Spare Parts">Spare Parts</option>
                <option value="Other">Other</option>
              </select>
            )}

            {activeTab === "customers" && (
              <select
                value={customerStatusFilter}
                onChange={(e) => setCustomerStatusFilter(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="All">All Accounts</option>
                <option value="Has Due">Has Balance Due</option>
                <option value="Overdue">Overdue Invoices</option>
                <option value="Clear">All Clear / Settled</option>
              </select>
            )}

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tab-Specific Sort Selector */}
        <div className="sm:w-52">
          <div className="relative">
            {activeTab === "invoices" && (
              <select
                value={invoiceSort}
                onChange={(e) => setInvoiceSort(e.target.value as InvoiceSortOption)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="due_date">Sort: Due Date (Earliest)</option>
                <option value="amount_desc">Sort: Amount (High to Low)</option>
                <option value="amount_asc">Sort: Amount (Low to High)</option>
              </select>
            )}

            {activeTab === "payments" && (
              <select
                value={paymentSort}
                onChange={(e) => setPaymentSort(e.target.value as PaymentSortOption)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="amount_desc">Sort: Amount (High to Low)</option>
                <option value="amount_asc">Sort: Amount (Low to High)</option>
              </select>
            )}

            {activeTab === "expenses" && (
              <select
                value={expenseSort}
                onChange={(e) => setExpenseSort(e.target.value as ExpenseSortOption)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="amount_desc">Sort: Amount (High to Low)</option>
                <option value="amount_asc">Sort: Amount (Low to High)</option>
              </select>
            )}

            {activeTab === "customers" && (
              <select
                value={customerSort}
                onChange={(e) => setCustomerSort(e.target.value as CustomerSortOption)}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#083a60] focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                <option value="highest_due">Sort: Highest Due</option>
                <option value="most_billed">Sort: Most Billed</option>
                <option value="name_asc">Sort: Name (A to Z)</option>
                <option value="name_desc">Sort: Name (Z to A)</option>
              </select>
            )}

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            title="Reset Search, Filter & Sort"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      {activeTab === "invoices" && (
        <InvoicesTable
          invoices={sortedInvoices}
          onViewInvoice={(inv) => setViewingInvoice(inv)}
          onRecordPayment={(inv) => {
            setPreselectedInvoiceForPay(inv);
            setPreselectedCustomerForPay(null);
            setIsRecordPaymentOpen(true);
          }}
          onDeleteInvoice={(inv) =>
            setDeleteModalState({ type: "invoice", item: inv })
          }
          onOpenCreateModal={() => {
            setPreselectedCustomerForInv(null);
            setIsCreateInvoiceOpen(true);
          }}
        />
      )}

      {activeTab === "payments" && (
        <PaymentsTable
          payments={sortedPayments}
          onDeletePayment={(pay) =>
            setDeleteModalState({ type: "payment", item: pay })
          }
          onOpenRecordModal={() => {
            setPreselectedInvoiceForPay(null);
            setPreselectedCustomerForPay(null);
            setIsRecordPaymentOpen(true);
          }}
        />
      )}

      {activeTab === "expenses" && (
        <ExpensesTable
          expenses={sortedExpenses}
          onDeleteExpense={(exp) =>
            setDeleteModalState({ type: "expense", item: exp })
          }
          onOpenLogModal={() => setIsLogExpenseOpen(true)}
        />
      )}

      {activeTab === "customers" && (
        <CustomerBalancesTable
          customers={customers}
          invoices={invoices}
          searchQuery={searchQuery}
          statusFilter={customerStatusFilter}
          sortBy={customerSort}
          onOpenCreateInvoice={(cust) => {
            setPreselectedCustomerForInv(cust || null);
            setIsCreateInvoiceOpen(true);
          }}
          onOpenRecordPayment={(cust) => {
            setPreselectedInvoiceForPay(null);
            setPreselectedCustomerForPay(cust || null);
            setIsRecordPaymentOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSubmit={handleCreateInvoiceSubmit}
        rentalOrders={rentalOrders}
        customers={customers}
        preselectedCustomer={preselectedCustomerForInv}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSubmit={handleRecordPaymentSubmit}
        invoices={invoices}
        customers={customers}
        preselectedInvoice={preselectedInvoiceForPay}
        preselectedCustomer={preselectedCustomerForPay}
      />

      <LogExpenseModal
        isOpen={isLogExpenseOpen}
        onClose={() => setIsLogExpenseOpen(false)}
        onSubmit={handleLogExpenseSubmit}
        generators={generators}
      />

      <InvoiceDetailsModal
        invoice={viewingInvoice}
        isOpen={Boolean(viewingInvoice)}
        onClose={() => setViewingInvoice(null)}
        onRecordPayment={(inv) => {
          setPreselectedInvoiceForPay(inv);
          setPreselectedCustomerForPay(null);
          setIsRecordPaymentOpen(true);
        }}
      />

      {deleteModalState && (
        <DeleteFinanceModal
          isOpen={Boolean(deleteModalState)}
          onClose={() => setDeleteModalState(null)}
          title={
            deleteModalState.type === "invoice"
              ? "Delete Tax Invoice"
              : deleteModalState.type === "payment"
              ? "Delete Payment Record"
              : "Delete Expense Record"
          }
          description="Are you sure you want to permanently delete"
          itemIdentifier={
            deleteModalState.type === "invoice"
              ? (deleteModalState.item as Invoice).invoiceNumber
              : deleteModalState.type === "payment"
              ? (deleteModalState.item as Payment).paymentNumber
              : (deleteModalState.item as Expense).expenseNumber
          }
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
