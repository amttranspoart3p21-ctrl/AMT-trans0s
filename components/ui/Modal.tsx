import React, { useEffect } from "react";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in select-none">
      {/* Backdrop tap closer */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <div
        className={`w-full ${sizeClasses[size]} bg-white dark:bg-[#18191A] border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden max-h-[92vh] transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-1 bg-sky-600 rounded-full shrink-0" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-100">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-xs text-slate-800 dark:text-zinc-200">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-[#18191A]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
