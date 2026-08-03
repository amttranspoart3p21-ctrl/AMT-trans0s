import React from "react";

interface TotalsSectionProps {
  totals: Array<{ label: string; value: string | number }>;
}

export default function TotalsSection({ totals }: TotalsSectionProps) {
  if (!totals || totals.length === 0) return null;

  return (
    <div className="w-full flex justify-end mb-6">
      <div className="w-full max-w-xs border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col gap-2.5">
        {totals.map((t, idx) => {
          const isGrandTotal = t.label.toLowerCase().includes("grand total") || idx === totals.length - 1;
          return (
            <div
              key={idx}
              className={`flex justify-between items-center text-xs ${
                isGrandTotal 
                  ? "border-t border-slate-300 pt-2.5 mt-1 text-slate-900 font-extrabold text-sm" 
                  : "text-slate-600 font-bold"
              }`}
            >
              <span>{t.label}</span>
              <span className={isGrandTotal ? "text-slate-900" : "text-slate-800 font-mono"}>
                {t.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
