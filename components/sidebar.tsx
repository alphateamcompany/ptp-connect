"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Cpu,
  Users,
  FileText,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutGrid,
  },
  {
    label: "Generators",
    href: "/generators",
    icon: Cpu,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    label: "Rental Orders",
    href: "/rentals",
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-[#083a60] text-white flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400 text-slate-950 shadow-sm shrink-0">
          <Zap className="w-5 h-5 fill-slate-950 stroke-slate-950" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-white leading-tight">
            PowerOps ERP
          </span>
          <span className="text-xs text-blue-200/80 font-normal">
            Power To Power
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-[#083a60] shadow-sm font-semibold"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0",
                  isActive ? "text-[#083a60]" : "text-white/90"
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto text-[#083a60] shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
