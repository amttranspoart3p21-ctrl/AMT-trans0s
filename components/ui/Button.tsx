import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center gap-1.5 font-semibold transition-all rounded-xl cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed border";

  const variantStyles = {
    primary:
      "bg-violet-600 hover:bg-violet-550 active:bg-violet-700 text-white border-violet-500/30 shadow-md shadow-violet-900/10",
    secondary:
      "bg-slate-800 hover:bg-slate-750 active:bg-slate-800 text-slate-300 hover:text-slate-100 border-slate-700/60",
    danger:
      "bg-rose-600 hover:bg-rose-550 active:bg-rose-700 text-white border-rose-550/30 shadow-md shadow-rose-900/10",
    success:
      "bg-emerald-600 hover:bg-emerald-550 active:bg-emerald-700 text-white border-emerald-550/30 shadow-md shadow-emerald-900/10",
    ghost:
      "bg-transparent hover:bg-slate-800 active:bg-slate-850 text-slate-400 hover:text-slate-200 border-transparent",
  };

  const sizeStyles = {
    xs: "px-2.5 py-1 text-[10px]",
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-4.5 py-2 text-xs",
    lg: "px-6 py-2.5 text-sm",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
