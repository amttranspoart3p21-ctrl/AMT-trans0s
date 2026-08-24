"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const navItemsList = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "OCR", path: "/ocr" },
  { label: "Shipments Workspace", path: "/shipments" },
  { label: "Documents Center", path: "/documents" },
  { label: "Branches", path: "/branches" },
  { label: "Companies", path: "/companies" },
  { label: "Packages", path: "/packages" },
  { label: "Route Rates", path: "/global-route-rates" },
  { label: "Settings", path: "/settings" },
];

export default function NavTitleAndBreadcrumbs() {
  const pathname = usePathname();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Home" }];

    const crumbs: BreadcrumbItem[] = [{ label: "Home", path: "/dashboard" }];
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
    if (pathname === "/dashboard") return "Master Dashboard";
    if (pathname === "/ocr") return "Dashboard & OCR Review";
    const item = navItemsList.find((n) => n.path === pathname);
    return item ? item.label : "Management Console";
  };

  return (
    <div className="flex flex-col text-left">
      <h2
        className={`text-sm font-bold tracking-tight leading-snug transition-colors ${
          isDarkMode ? "text-white" : "text-slate-800"
        }`}
      >
        {getPageTitle()}
      </h2>
      <div
        className={`flex items-center gap-1.5 mt-0.5 text-[11px] font-medium tracking-normal transition-colors ${
          isDarkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className={isDarkMode ? "text-slate-600 font-light" : "text-slate-300 font-light"}>/</span>}
            {crumb.path ? (
              <Link
                href={crumb.path}
                className={`transition-colors ${
                  isDarkMode ? "hover:text-white" : "hover:text-slate-800"
                }`}
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={`font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
