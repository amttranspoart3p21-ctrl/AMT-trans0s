import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  warning?: string;
  options?: Array<{ value: string; label: string } | string>;
}

export default function Select({
  label,
  error,
  warning,
  options = [],
  className = "",
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const borderClass = error
    ? "border-rose-500/70 focus:border-rose-500 bg-rose-955/10 text-rose-200"
    : warning
    ? "border-amber-500/70 focus:border-amber-500 bg-amber-955/10 text-amber-250"
    : "border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200";

  return (
    <div className="flex flex-col gap-1.5 w-full select-none">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[10px] font-bold uppercase tracking-wider text-slate-400"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border cursor-pointer appearance-none ${borderClass} ${className}`}
          {...props}
        >
          {children ? (
            children
          ) : (
            <>
              <option value="">Select...</option>
              {options.map((opt) => {
                const val = typeof opt === "string" ? opt : opt.value;
                const lbl = typeof opt === "string" ? opt : opt.label;
                return (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                );
              })}
            </>
          )}
        </select>
        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {error && <span className="text-[10px] text-rose-455 font-bold">{error}</span>}
      {warning && !error && (
        <span className="text-[10px] text-amber-450 font-bold">{warning}</span>
      )}
    </div>
  );
}
