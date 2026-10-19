import { Card } from "@/components/ui/card";
import { Cpu, Zap, Truck, Receipt, CreditCard, Clock, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { generators } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import Link from "next/link";
import { getFinanceStats } from "@/app/finance/actions";
import { formatINR } from "@/lib/utils";
import { syncGeneratorStatusesWithRentals } from "@/lib/sync-generators";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let totalCount = 0;
  let availableCount = 0;
  let onRentCount = 0;

  try {
    await syncGeneratorStatusesWithRentals();

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generators);
    totalCount = Number(totalRes?.count || 0);

    const [availRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generators)
      .where(eq(generators.status, "Available"));
    availableCount = Number(availRes?.count || 0);

    const [rentRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generators)
      .where(eq(generators.status, "On Rent"));
    onRentCount = Number(rentRes?.count || 0);
  } catch (err) {
    console.error("Error loading dashboard fleet stats:", err);
  }

  const financeStats = await getFinanceStats();
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Real-time overview of your generator fleet &amp; rental business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[860px]">
        {/* Total Generators */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0284c7]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                TOTAL GENERATORS
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {totalCount}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Fleet size
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#0c4a7e] text-white shadow-sm shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Available */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#059669]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                AVAILABLE
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {availableCount}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Ready to deploy
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#059669] text-white shadow-sm shrink-0">
              <Zap className="w-5 h-5 fill-white stroke-white" />
            </div>
          </div>
        </Card>

        {/* On Rent */}
        <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-7 pr-5">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#083a60]" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                ON RENT
              </span>
              <span className="text-3xl font-bold text-slate-900 mt-2">
                {onRentCount}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Currently deployed
              </span>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#0c4a7e] text-white shadow-sm shrink-0">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Snapshot */}
      <div className="pt-2 space-y-4 max-w-[860px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Financial Overview
            </h2>
            <p className="text-xs text-slate-500">
              Invoiced revenue, collections recovery, and pending receivables
            </p>
          </div>
          <Link
            href="/finance"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#083a60] hover:text-[#0c4a7e] hover:underline"
          >
            <span>Open Finance Tab</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total Billed */}
          <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-7 pr-5">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0284c7]" />
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  TOTAL BILLED
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-2">
                  {formatINR(financeStats.totalRevenue)}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Gross invoice value
                </span>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 text-[#083a60] shadow-sm shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Collected */}
          <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-7 pr-5">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#059669]" />
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  COLLECTED
                </span>
                <span className="text-2xl font-bold text-emerald-700 mt-2">
                  {formatINR(financeStats.totalCollected)}
                </span>
                <span className="text-xs text-emerald-600 font-medium mt-1">
                  {financeStats.collectionRate}% Recovery rate
                </span>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 shadow-sm shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Outstanding */}
          <Card className="relative overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl py-5 pl-7 pr-5">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#f59e0b]" />
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  RECEIVABLES
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-2">
                  {formatINR(financeStats.totalOutstanding)}
                </span>
                <span className="text-xs text-amber-600 font-medium mt-1">
                  {financeStats.overdueInvoicesCount > 0
                    ? `${financeStats.overdueInvoicesCount} Invoices Overdue`
                    : "Due from clients"}
                </span>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 text-amber-700 shadow-sm shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
