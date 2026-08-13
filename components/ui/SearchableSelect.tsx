import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  badge?: string;
  badgeType?: "global" | "company" | "shipment" | "default";
  isDivider?: boolean;
  isGlobal?: boolean;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  warning?: string;
  className?: string;
  id?: string;
  onClose?: () => void;
  allowManualEntry?: boolean;
  noResultsText?: string;
  manualEntryLabel?: string;
  manualEntryPlaceholder?: string;
  manualEntryButtonText?: string;
  manualEntryPosition?: "top" | "bottom";
  disabled?: boolean;
  hideClearOption?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  label,
  error,
  warning,
  className = "",
  id,
  onClose,
  allowManualEntry = false,
  noResultsText,
  manualEntryLabel = "Company Name",
  manualEntryPlaceholder = "Enter manual company name...",
  manualEntryButtonText = "Enter Company Manually",
  manualEntryPosition = "bottom",
  disabled = false,
  hideClearOption = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [dropdownPos, setDropdownPos] = useState({
    top: 0 as number | "auto",
    bottom: 0 as number | "auto",
    left: 0,
    width: 0,
    maxHeight: 320,
    placement: "bottom" as "top" | "bottom",
  });

  const updatePosition = () => {
    if (!containerRef.current || !isOpen) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownEstimatedHeight = 340; // max-h-80 + padding
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: "top" | "bottom" = "bottom";
    if (spaceBelow < dropdownEstimatedHeight && spaceAbove > spaceBelow) {
      placement = "top";
    }

    let top: number | "auto" = rect.bottom + 6;
    let bottom: number | "auto" = "auto";
    let maxHeight = Math.max(spaceBelow - 20, 200);

    if (placement === "top") {
      top = "auto";
      bottom = window.innerHeight - rect.top + 6;
      maxHeight = Math.max(spaceAbove - 20, 200);
    }

    setDropdownPos({
      top,
      bottom,
      left: rect.left,
      width: rect.width,
      maxHeight,
      placement,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, options.length, search]);

  const selectId = id || `search-select-${Math.random().toString(36).substring(2, 9)}`;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (containerRef.current && !containerRef.current.contains(event.target as Node)) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Reset manual entry state when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setIsManualMode(false);
      setManualValue("");
    }
  }, [isOpen]);

  // Filter options based on search query (case-insensitive)
  const filteredOptions = options.filter((opt) => {
    if (opt.isDivider) {
      return search === "";
    }
    return opt.label.toLowerCase().includes(search.toLowerCase());
  });

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex, isOpen]);

  // Adjust highlight index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  const getBaseName = (val: string) => {
    const idx = val.indexOf("(");
    const hyphenIdx = val.indexOf(" - ");
    const limit = idx !== -1 ? idx : (hyphenIdx !== -1 ? hyphenIdx : -1);
    return limit !== -1 ? val.substring(0, limit).trim().toLowerCase() : val.trim().toLowerCase();
  };

  const isValueMatch = (optVal: string, valueVal: string) => {
    if (!valueVal) return false;
    const ov = optVal.trim().toLowerCase();
    const vv = valueVal.trim().toLowerCase();
    if (ov === vv) return true;
    return getBaseName(optVal) === getBaseName(valueVal);
  };

  const selectedOption = options.find((opt) => isValueMatch(opt.value, value));

  // Helper to move index to next/previous non-disabled item
  const moveHighlight = (direction: "up" | "down") => {
    if (filteredOptions.length === 0) return;
    let nextIndex = highlightedIndex;
    const step = direction === "down" ? 1 : -1;

    for (let i = 0; i < filteredOptions.length; i++) {
      nextIndex = (nextIndex + step + filteredOptions.length) % filteredOptions.length;
      if (!filteredOptions[nextIndex].disabled && !filteredOptions[nextIndex].isDivider) {
        setHighlightedIndex(nextIndex);
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
        setSearch("");
        // Initial highlight of selected value
        const selIdx = filteredOptions.findIndex((opt) => isValueMatch(opt.value, value));
        if (selIdx !== -1 && !filteredOptions[selIdx].disabled && !filteredOptions[selIdx].isDivider) {
          setHighlightedIndex(selIdx);
        } else {
          // Highlight first non-disabled, non-divider item
          const firstValid = filteredOptions.findIndex((opt) => !opt.disabled && !opt.isDivider);
          setHighlightedIndex(firstValid);
        }
      }
      return;
    }

    // Stop propagation of all keyboard inputs when dropdown is active to prevent table cells navigation
    e.stopPropagation();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveHighlight("down");
        break;
      case "ArrowUp":
        e.preventDefault();
        moveHighlight("up");
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled && !opt.isDivider) {
            onChange(opt.value);
            setIsOpen(false);
            onClose?.();
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        onClose?.();
        break;
      case "Tab":
        // Let it naturally lose focus and close
        setIsOpen(false);
        onClose?.();
        break;
      default:
        break;
    }
  };

  const hasBadge = !!selectedOption?.badge;
  const borderClass = error
    ? "border-rose-500/70 focus:border-rose-500 bg-rose-955/10 text-rose-200"
    : warning || hasBadge
    ? "border-amber-500/70 focus:border-amber-500 bg-amber-955/10 text-amber-250"
    : "border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200";

  return (
    <div className="flex flex-col gap-1.5 w-full select-none" ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[10px] font-bold uppercase tracking-wider text-slate-450"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsOpen(!isOpen);
            setSearch("");
          }}
          onKeyDown={handleKeyDown}
          className={`w-full text-sm rounded-xl px-4 h-[42px] outline-none transition-colors border flex justify-between items-center text-left ${
            disabled ? "bg-slate-900/60 border-slate-850 text-slate-550 cursor-not-allowed opacity-60 pointer-events-none" : borderClass
          } ${className}`}
        >
          <span className={`flex items-center gap-2 flex-1 min-w-0 ${selectedOption ? "text-slate-200" : "text-slate-500"}`}>
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            {selectedOption?.badge && (
              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border tracking-wider select-none shrink-0 ${
                selectedOption.badgeType === "global"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : selectedOption.badgeType === "company"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : selectedOption.badgeType === "shipment"
                  ? "bg-amber-500/10 text-amber-450 border-amber-500/20"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}>
                {selectedOption.badge}
              </span>
            )}
          </span>
          <span className="text-slate-500 shrink-0 ml-1">
            <svg className={`h-4.5 w-4.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {isOpen && mounted && createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[9999] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2"
            style={{
              top: dropdownPos.top !== "auto" ? dropdownPos.top : undefined,
              bottom: dropdownPos.bottom !== "auto" ? dropdownPos.bottom : undefined,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
          >
            {isManualMode ? (
              <div className="flex flex-col gap-2 p-1.5" onKeyDown={(e) => e.stopPropagation()}>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{manualEntryLabel}</span>
                <input
                  type="text"
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  placeholder={manualEntryPlaceholder}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 h-[42px] text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (manualValue.trim()) {
                        onChange(manualValue.trim());
                        setIsOpen(false);
                        onClose?.();
                      }
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setIsManualMode(false);
                    }
                  }}
                />
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setIsManualMode(false)}
                    className="px-3 py-2 text-[11px] font-bold rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (manualValue.trim()) {
                        onChange(manualValue.trim());
                        setIsOpen(false);
                        onClose?.();
                      }
                    }}
                    className="px-3 py-2 text-[11px] font-bold rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 h-[42px] text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 transition-colors"
                    autoFocus
                  />
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </div>

                {/* Manual entry button - always visible, outside scrollable area */}
                {allowManualEntry && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setManualValue(search);
                        setIsManualMode(true);
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm text-violet-400 hover:bg-slate-900/60 hover:text-violet-300 transition-all border border-transparent cursor-pointer font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <span className="text-base font-bold">+</span> {manualEntryButtonText}
                    </button>
                    <div className="border-t border-slate-800/80 my-0.5 shrink-0" />
                  </>
                )}

                <div 
                  className="overflow-y-auto flex-1 flex flex-col gap-0.5 animate-fade-in" 
                  ref={listRef}
                  style={{ maxHeight: Math.min(dropdownPos.maxHeight - 60, 320) }}
                >
                  {!hideClearOption && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange("");
                        setIsOpen(false);
                        onClose?.();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors hover:bg-slate-900 text-slate-400 hover:text-slate-250 cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}

                  {filteredOptions.length > 0 ? (
                    (() => {
                      // Sort: unregistered/badged items first, then registered items
                      const unregisteredItems = filteredOptions.filter(
                        (opt) => !opt.isDivider && opt.badge
                      );
                      const registeredItems = filteredOptions.filter(
                        (opt) => !opt.isDivider && !opt.badge
                      );
                      const dividerItems = filteredOptions.filter(
                        (opt) => opt.isDivider
                      );
                      const sortedOptions = [...unregisteredItems, ...dividerItems, ...registeredItems];

                      return sortedOptions.map((opt) => {
                        if (opt.isDivider) {
                          return (
                            <div key={opt.value} className="border-t border-slate-800/80 my-1 shrink-0" />
                          );
                        }

                        // Use the original filteredOptions index for highlight tracking
                        const originalIdx = filteredOptions.indexOf(opt);
                        const isSelected = isValueMatch(opt.value, value);
                        const isHighlighted = originalIdx === highlightedIndex;
                        const refProp = isHighlighted ? { ref: activeItemRef } : {};

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={opt.disabled}
                            onClick={() => {
                              onChange(opt.value);
                              setIsOpen(false);
                              onClose?.();
                            }}
                            {...refProp}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all flex justify-between items-center cursor-pointer ${
                              opt.disabled
                                ? "opacity-40 cursor-not-allowed text-slate-500"
                                : isSelected
                                ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                                : isHighlighted
                                ? "bg-slate-900 text-slate-200 border border-slate-800"
                                : "text-slate-350 hover:bg-slate-900/60 hover:text-slate-100 border border-transparent"
                            }`}
                          >
                            <span>{opt.label}</span>
                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              {opt.badge && (
                                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border tracking-wider select-none ${
                                  opt.badgeType === "global"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : opt.badgeType === "company"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : opt.badgeType === "shipment"
                                    ? "bg-amber-500/10 text-amber-450 border-amber-500/20"
                                    : "bg-slate-800 text-slate-400 border-slate-700"
                                }`}>
                                  {opt.badge}
                                </span>
                              )}
                              {opt.disabled && opt.disabledReason && (
                                <span className="text-[10px] text-slate-500 font-bold">
                                  {opt.disabledReason}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()
                  ) : (
                    <div className="text-sm text-slate-500 text-center py-4 font-semibold">
                      {noResultsText || (allowManualEntry ? "No registered company found." : "No results found")}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>,
          document.body
        )}
      </div>
      {error && <span className="text-[10px] text-rose-455 font-bold">{error}</span>}
      {warning && !error && (
        <span className="text-[10px] text-amber-450 font-bold">{warning}</span>
      )}
    </div>
  );
}
