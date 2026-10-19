import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "PTP - Connect",
  description: "Real-time overview of your generator fleet & rental business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex bg-[#f8fafc] text-slate-900 antialiased">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-y-auto pt-14 lg:pt-0">{children}</main>
      </body>
    </html>
  );
}
