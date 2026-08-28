"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Company } from "@/types/company";
import type { Branch } from "@/types/branch";

export interface SelectedCompanyInfo {
  companyName: string;
  branchCode?: string;
  branchName?: string;
  isRegistered: boolean;
  registeredCompany?: Company;
}

interface CompanySearchSelectProps {
  companies: Company[];
  branches: Branch[];
  selectedCompany: SelectedCompanyInfo | null;
  onSelectCompany: (companyInfo: SelectedCompanyInfo | null) => void;
}

export default function CompanySearchSelect({
  companies,
  branches,
  selectedCompany,
  onSelectCompany,
}: CompanySearchSelectProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  // True while the user is freely typing in the input.
  // Prevents the selectedCompany useEffect from overwriting the input mid-type.
  const isUserTyping = useRef<boolean>(false);

  useEffect(() => {
    // Only sync the display label when a selection was made via the dropdown,
    // NOT while the user is typing (which would strip trailing spaces).
    if (!isUserTyping.current && selectedCompany) {
      const display = selectedCompany.branchCode
        ? `${selectedCompany.companyName} - ${selectedCompany.branchCode}`
        : selectedCompany.companyName;
      setSearchTerm(display);
    }
  }, [selectedCompany]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map registered companies to display labels with branch codes
  const registeredOptions = companies
    .filter((c) => c.status === "Active")
    .map((comp) => {
      const branch = branches.find(
        (b) =>
          b.branchId === comp.branchId ||
          b.branchName.toLowerCase() === comp.branchName?.toLowerCase()
      );
      const bCode = branch?.branchCode || comp.branchCode || comp.branchName?.slice(0, 3).toUpperCase() || "";
      return {
        company: comp,
        companyName: comp.companyName,
        branchCode: bCode,
        branchName: comp.branchName,
        displayLabel: bCode ? `${comp.companyName} - ${bCode}` : comp.companyName,
      };
    });

  // Filter options based on search term
  const filteredOptions = registeredOptions.filter((opt) =>
    opt.displayLabel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectRegistered = (opt: typeof registeredOptions[0]) => {
    // A dropdown item was chosen — disable the typing guard so the
    // useEffect is allowed to sync the formatted display label.
    isUserTyping.current = false;
    onSelectCompany({
      companyName: opt.companyName,
      branchCode: opt.branchCode,
      branchName: opt.branchName,
      isRegistered: true,
      registeredCompany: opt.company,
    });
    setIsOpen(false);
  };

  const handleCustomInput = (value: string) => {
    // Mark that the user is currently typing so the selectedCompany
    // useEffect does NOT overwrite the input value (which would strip spaces).
    isUserTyping.current = true;

    // Always preserve the raw typed value — never trim the input state.
    setSearchTerm(value);

    if (!value.trim()) {
      // Empty input: clear the selection
      onSelectCompany(null);
      return;
    }

    // Use a normalized copy (trimmed) only for comparison — never for setState.
    const normalizedInput = value.trim().toLowerCase();

    // Check if the trimmed typed value matches a registered option exactly.
    const exactMatch = registeredOptions.find(
      (opt) =>
        opt.displayLabel.toLowerCase() === normalizedInput ||
        opt.companyName.toLowerCase() === normalizedInput
    );

    if (exactMatch) {
      onSelectCompany({
        companyName: exactMatch.companyName,
        branchCode: exactMatch.branchCode,
        branchName: exactMatch.branchName,
        isRegistered: true,
        registeredCompany: exactMatch.company,
      });
    } else {
      // Unregistered: expose the trimmed name for billing logic,
      // but the actual input box still holds the raw value with spaces.
      onSelectCompany({
        companyName: value.trim(),
        isRegistered: false,
      });
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    onSelectCompany(null);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 block">
        Select / Search Billing Company
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleCustomInput(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search registered company (e.g. ABC Logistics - CHE) or type unregistered..."
          className="w-full bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-100 rounded-xl pl-10 pr-10 py-2.5 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-2xs transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        />
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Status Badge */}
      {selectedCompany && (
        <div className="mt-1.5 flex items-center gap-2 text-[10px]">
          {selectedCompany.isRegistered ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
              <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Registered Company ({selectedCompany.branchCode || selectedCompany.branchName || "Global"})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">
              <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Unregistered Company (Manual Profile Entry)</span>
            </span>
          )}
        </div>
      )}

      {/* Dropdown Options Menu */}
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800 text-[9.5px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Registered Companies ({filteredOptions.length})
          </div>

          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500 dark:text-zinc-400 italic">
              No matching registered companies. Type to enter unregistered company.
            </div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <button
                key={opt.company.companyId || idx}
                type="button"
                onClick={() => handleSelectRegistered(opt)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between text-xs cursor-pointer border-b border-slate-100 dark:border-zinc-800/40 last:border-0"
              >
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{opt.companyName}</span>
                <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 rounded text-[9.5px] font-bold uppercase tracking-wider">
                  {opt.branchCode}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
