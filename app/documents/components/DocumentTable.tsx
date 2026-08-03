import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { ColumnConfig } from "./document-config";

interface DocumentTableProps {
  shipments: ShipmentRecord[];
  columns: ColumnConfig[];
}

export default function DocumentTable({ shipments, columns }: DocumentTableProps) {
  // Helper to format values nicely
  const formatValue = (val: any, format?: string): string => {
    if (val === null || val === undefined) return "-";
    if (format === "date") {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      } catch (_) {}
      return String(val);
    }
    if (format === "currency") {
      const num = Number(val);
      if (!isNaN(num)) {
        return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      }
    }
    return String(val);
  };

  return (
    <div className="w-full overflow-hidden border border-slate-300 rounded-xl mb-8">
      <table className="w-full border-collapse text-xs select-text">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 font-black ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {shipments.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-400 font-medium italic"
              >
                No matching shipment records resolved for this filter context.
              </td>
            </tr>
          ) : (
            shipments.map((s, rIdx) => (
              <tr key={s.shipmentId || rIdx} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col, cIdx) => {
                  const val = s[col.key as keyof ShipmentRecord];
                  return (
                    <td
                      key={cIdx}
                      className={`px-4 py-2.5 text-slate-700 font-medium ${
                        col.align === "right"
                          ? "text-right font-mono"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {formatValue(val, col.format)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
