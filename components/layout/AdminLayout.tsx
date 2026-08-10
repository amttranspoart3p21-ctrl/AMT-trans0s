"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar, setActiveRoute } from "@/store/slices/uiSlice";
import Button from "../ui/Button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const activeRoute = useAppSelector((state) => state.ui.activeRoute);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(setActiveRoute(pathname));
  }, [pathname, dispatch]);

  const navItems = [
    {
      label: "Dashboard / OCR",
      path: "/",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Shipments Workspace",
      path: "/shipments",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: "Documents Center",
      path: "/documents",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Branches",
      path: "/branches",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: "Companies",
      path: "/companies",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Packages",
      path: "/packages",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    // {
    //   label: "Company Packages",
    //   path: "/company-packages",
    //   icon: (
    //     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    //     </svg>
    //   ),
    // },
    {
      label: "Route Rates",
      path: "/global-route-rates",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    // {
    //   label: "Settings",
    //   path: "/settings",
    //   icon: (
    //     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    //     </svg>
    //   ),
    // },
  ];

interface BreadcrumbItem {
  label: string;
  path?: string;
}

  // Derive breadcrumbs based on pathname
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Home" }];

    const crumbs: BreadcrumbItem[] = [{ label: "Home", path: "/" }];
    segments.forEach((seg, idx) => {
      const isLast = idx === segments.length - 1;
      const formattedSeg = seg
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      crumbs.push({
        label: formattedSeg,
        path: isLast ? undefined : `/${segments.slice(0, idx + 1).join("/")}`,
      });
    });

    return crumbs;
  };

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard & OCR Review";
    const item = navItems.find((n) => n.path === pathname);
    return item ? item.label : "Management Console";
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-[#f3f4f6]">
      {/* Sidebar Panel */}
      <aside
        className={`h-full bg-slate-950 border-r border-slate-900 flex flex-col justify-between select-none shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center px-4.5 border-b border-slate-900 gap-3 shrink-0 overflow-hidden">
            <div className="h-7.5 w-7.5 rounded-lg bg-violet-600 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-lg shadow-violet-900/40">
             ts
            </div>
            {!sidebarCollapsed && (
              <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent truncate">
                TMS transOS
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-2.5 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeRoute === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isActive
                      ? "bg-violet-600/10 text-violet-400 border border-violet-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User block */}
        <div className="p-3 border-t border-slate-900 shrink-0 overflow-hidden bg-slate-955/20">
          <div className="flex items-center gap-3">
            <div className="h-8.5 w-8.5 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0 select-none">
              SA
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-[11px] font-bold text-slate-300 truncate">{user?.name}</span>
                <span className="text-[9px] font-semibold text-slate-500 truncate">{user?.role}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header Panel */}
        <header className="h-16 bg-slate-950/40 border-b border-slate-900 px-6 flex items-center justify-between shrink-0 select-none z-10 backdrop-blur-md">
          <div className="flex items-center gap-4.5">
            {/* Toggle collapse button */}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => dispatch(toggleSidebar())}
              className="p-1.5 border border-slate-850 hover:bg-slate-900 rounded-lg"
            >
              <svg className="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>

            {/* Title & Breadcrumbs */}
            <div className="flex flex-col text-left">
              <h2 className="text-xs font-bold text-slate-200 tracking-tight leading-tight">
                {getPageTitle()}
              </h2>
              <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                {getBreadcrumbs().map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="opacity-40">/</span>}
                    {crumb.path ? (
                      <Link href={crumb.path} className="hover:text-slate-400 transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-400 font-bold">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Metadata */}
          <div className="flex items-center gap-4">
            {/* Profile badge status */}
            <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              Live ERP Connected
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f19]">
          {children}
        </main>
      </div>
    </div>
  );
}
