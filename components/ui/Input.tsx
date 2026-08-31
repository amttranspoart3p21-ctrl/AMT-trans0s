import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  warning?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  warning,
  icon,
  className = "",
  id,
  type = "text",
  ...props
}: InputProps) {
  const autoId = useId();
  const inputId = id || autoId;

  const borderClass = error
    ? "border-rose-400 dark:border-rose-500/70 focus:border-rose-500 bg-rose-50 dark:bg-rose-955/10 text-rose-900 dark:text-rose-200"
    : warning
    ? "border-amber-400 dark:border-amber-500/70 focus:border-amber-500 bg-amber-50 dark:bg-amber-955/10 text-amber-900 dark:text-amber-250"
    : "border-slate-300 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-slate-50/80 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-slate-500 shrink-0 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full text-xs rounded-xl px-4 py-2.5 outline-none transition-colors border ${
            icon ? "pl-10" : ""
          } ${borderClass} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-[10px] text-rose-455 font-bold">{error}</span>}
      {warning && !error && (
        <span className="text-[10px] text-amber-450 font-bold">{warning}</span>
      )}
    </div>
  );
}
