import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AuthGuard from "./AuthGuard";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F0F7FF] dark:bg-[#0b0f19] text-slate-800 dark:text-[#f3f4f6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#F0F7FF] dark:bg-[#0b0f19]">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </div>
    </div>
  );
}