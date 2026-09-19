import { Card } from "@/components/ui/card";
import { Cpu, Zap, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { generators } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let totalCount = 3;
  let availableCount = 1;
  let onRentCount = 1;

  try {
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
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <p className="text-sm font-medium text-slate-600">
        Real-time overview of your generator fleet & rental business
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 max-w-[860px]">
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
    </div>
  );
}
