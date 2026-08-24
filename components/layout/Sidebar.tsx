"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveRoute, toggleDarkMode, setSidebarCollapsed } from "@/store/slices/uiSlice";
import { getCompanySettings, DEFAULT_COMPANY_SETTINGS, lockApp } from "@/utils/settings";
import SidebarToggleButton from "./SidebarToggleButton";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const activeRoute = useAppSelector((state) => state.ui.activeRoute);
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  const [sidebarCompanyName, setSidebarCompanyName] = useState<string>(DEFAULT_COMPANY_SETTINGS.companyName);
  const [sidebarLogo, setSidebarLogo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sidebarCollapsed && shouldFocusSearch) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setShouldFocusSearch(false);
      return () => clearTimeout(timer);
    }
  }, [sidebarCollapsed, shouldFocusSearch]);

  const handleSearchClick = () => {
    if (sidebarCollapsed) {
      dispatch(setSidebarCollapsed(false));
      setShouldFocusSearch(true);
    } else {
      searchInputRef.current?.focus();
    }
  };

  useEffect(() => {
    const s = getCompanySettings();
    setSidebarCompanyName(s.companyName || DEFAULT_COMPANY_SETTINGS.companyName);
    setSidebarLogo(s.logo || "");

    const handleStorage = () => {
      const fresh = getCompanySettings();
      setSidebarCompanyName(fresh.companyName || DEFAULT_COMPANY_SETTINGS.companyName);
      setSidebarLogo(fresh.logo || "");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    dispatch(setActiveRoute(pathname));
  }, [pathname, dispatch]);

  const handleLockApp = () => {
    lockApp();
    router.replace("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      label: "OCR",
      path: "/ocr",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M3.75 16.5V18A2.25 2.25 0 006 20.25h1.5m9-16.5h1.5A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5M9 12h6m-6 3h4m-4-6h6" />
        </svg>
      ),
    },
    {
      label: "Shipments Workspace",
      path: "/shipments",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
    {
      label: "Route Rates",
      path: "/global-route-rates",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      label: "Settings",
      path: "/settings",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`h-full flex flex-col justify-between select-none shrink-0 transition-all duration-300 relative border-r ${
        isDarkMode
          ? "bg-[#18191a] text-slate-100 border-slate-800"
          : "bg-white text-slate-800 border-slate-200"
      } ${sidebarCollapsed ? "w-16" : "w-64"}`}
    >
      {/* Floating circular toggle button positioned on top right border */}
      <div className="absolute -right-3 top-5 z-50">
        <SidebarToggleButton />
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Logo Brand Header */}
        <div
          className={`h-16 flex items-center px-3.5 border-b shrink-0 relative ${
            isDarkMode ? "border-slate-800 bg-[#18191a]" : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {sidebarLogo ? (
              <img
                src={sidebarLogo}
                alt="Company Logo"
                className={`h-7.5 w-7.5 rounded-lg object-contain shrink-0 border ${
                  isDarkMode ? "border-slate-700" : "border-slate-200"
                }`}
              />
            ) : (
              <div className="h-7.5 w-7.5 rounded-lg bg-[#0284c7] flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm">
                tms
              </div>
            )}
            {!sidebarCollapsed && (
              <span
                className={`font-bold text-sm tracking-tight truncate ${
                  isDarkMode ? "text-white" : "text-slate-800"
                }`}
              >
                {sidebarCompanyName}
              </span>
            )}
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="p-3">
          {!sidebarCollapsed ? (
            <div className="relative flex items-center">
              <svg
                className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl outline-none transition-all ${
                  isDarkMode
                    ? "bg-[#242526] text-slate-100 placeholder:text-slate-400 border border-slate-700/60 focus:border-sky-500 focus:bg-[#3a3b3c]"
                    : "bg-slate-100/80 text-slate-700 placeholder:text-slate-400 border border-slate-200/60 focus:border-[#0284c7] focus:bg-white"
                }`}
              />
            </div>
          ) : (
            <div
              onClick={handleSearchClick}
              className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto cursor-pointer transition-colors ${
                isDarkMode
                  ? "bg-[#242526] text-slate-300 hover:bg-[#3a3b3c]"
                  : "bg-slate-100/90 text-slate-500 hover:bg-slate-200/70"
              }`}
              title="Search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-1 px-2.5 flex flex-col gap-1 overflow-x-hidden">
          {filteredNavItems.map((item) => {
            const isActive = activeRoute === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150 ${
                  isActive
                    ? isDarkMode
                      ? "bg-[#3a3b3c] text-white shadow-sm border border-slate-700/50"
                      : "bg-[#f0f7ff] text-[#0284c7] border border-[#0284c7]/20 shadow-xs"
                    : isDarkMode
                    ? "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? isDarkMode
                        ? "text-white"
                        : "text-[#0284c7]"
                      : isDarkMode
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Section: Logout & Dark Mode Toggle */}
      <div
        className={`border-t p-3 flex flex-col gap-2 shrink-0 ${
          isDarkMode ? "border-slate-800 bg-[#18191a]" : "border-slate-200/80 bg-white"
        }`}
      >
        {/* Logout / Lock App Action */}
        {/* <button
          onClick={handleLockApp}
          className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all w-full cursor-pointer group ${
            isDarkMode
              ? "text-slate-300 hover:text-red-400 hover:bg-red-950/40"
              : "text-slate-600 hover:text-red-600 hover:bg-red-50/80"
          }`}
          title={sidebarCollapsed ? "Logout / Lock App" : undefined}
        >
          <svg
            className={`h-4 w-4 shrink-0 transition-colors ${
              isDarkMode
                ? "text-slate-400 group-hover:text-red-400"
                : "text-slate-500 group-hover:text-red-600"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          {!sidebarCollapsed && <span>Logout</span>}
        </button> */}

        {/* Mode Toggle Switch Bar */}
        <div
          onClick={() => dispatch(toggleDarkMode())}
          className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            isDarkMode
              ? "bg-[#242526] text-slate-200 border border-slate-700/50"
              : "bg-slate-100/90 text-slate-700 border border-transparent"
          } ${sidebarCollapsed ? "justify-center" : ""}`}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <div className="flex items-center gap-2">
            {isDarkMode ? (
              <svg className="h-4 w-4 text-[#0A84C4] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25m-13.5 0H3m15.364 6.364l-1.591-1.591M6.758 6.758L5.167 5.167m12.728 0l-1.591 1.591M6.758 17.242l-1.591 1.591M12 18a6 6 0 100-12 6 6 0 000 12z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-[#0A84C4] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
            {!sidebarCollapsed && <span>{isDarkMode ? "Dark Mode" : "Light Mode"}</span>}
          </div>

          {!sidebarCollapsed && (
            <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isDarkMode ? "bg-[#0A84C4]" : "bg-[#0A84C4]"}`}>
              <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${isDarkMode ? "translate-x-3.5" : "translate-x-0"}`} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
