import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  headerAction?: React.ReactNode;
}

export default function Card({ children, title, headerAction, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-slate-900/60 backdrop-blur-md border border-slate-850 p-5 rounded-2xl shadow-xl flex flex-col gap-4 ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex justify-between items-center pb-3 border-b border-slate-850/50">
          {title && (
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {title}
            </h3>
          )}
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
