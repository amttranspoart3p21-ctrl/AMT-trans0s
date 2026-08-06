import React from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "No records found",
  description = "There are no matches or data matching this context.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="w-full bg-slate-900/20 border border-slate-850/60 p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
      <div className="h-10 w-10 rounded-full bg-slate-850/60 border border-slate-800 flex items-center justify-center text-slate-500 mb-1">
        {icon ? (
          icon
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )}
      </div>
      <div>
        <h4 className="text-xs font-semibold text-slate-300">{title}</h4>
        <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-normal">
          {description}
        </p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
