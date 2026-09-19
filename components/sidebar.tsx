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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navContent = (
    <>
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400 text-slate-950 shadow-sm shrink-0">
          <Zap className="w-5 h-5 fill-slate-950 stroke-slate-950" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-white leading-tight">
            PTP Connect
          </span>
          <span className="text-xs text-blue-200/80 font-normal">
            Power To Power
          </span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setIsOpen(false)}
          className="ml-auto lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
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
    </>
  );

  return (
    <>
      {/* ── Mobile top bar (hidden on lg+) ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#083a60] text-white shadow-md">
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400 text-slate-950 shrink-0">
            <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-slate-950" />
          </div>
          <span className="font-bold text-sm tracking-tight">PTP Connect</span>
        </div>
      </header>

      {/* ── Desktop sidebar (hidden below lg) ── */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#083a60] text-white flex-col min-h-screen">
        {navContent}
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#083a60] text-white flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
