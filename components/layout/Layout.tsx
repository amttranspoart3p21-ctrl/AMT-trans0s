import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AuthGuard from "./AuthGuard";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-[#f3f4f6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-[#0b0f19]">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </div>
    </div>
  );
}



// components/layout/
// │
// ├── Layout.tsx                 🟢 SERVER
// │
// ├── Sidebar.tsx                🔵 CLIENT
// ├── Navbar.tsx                 🟢 SERVER
// ├── SidebarToggleButton.tsx    🔵 CLIENT
// ├── NavTitleAndBreadcrumbs.tsx 🔵 CLIENT
// ├── LockAppButton.tsx          🔵 CLIENT
// └── AuthGuard.tsx              🔵 CLIENT