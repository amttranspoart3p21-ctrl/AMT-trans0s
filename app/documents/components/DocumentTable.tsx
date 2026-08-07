import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { ColumnConfig } from "./document-config";

interface DocumentTableProps {
  shipments: ShipmentRecord[];
  columns: ColumnConfig[];
  branches?: Branch[];
}

export default function DocumentTable({ shipments, columns, branches = [] }: DocumentTableProps) {
  // Dynamic branch code lookup helper using active system branches list
  const resolveBranchCode = (val: any): string => {
    if (!val) return "-";
    const clean = String(val).trim();
    if (!clean) return "-";

    const match = branches.find(
      (b) =>
        b.branchCode.toLowerCase() === clean.toLowerCase() ||
        b.branchName.toLowerCase() === clean.toLowerCase() ||
        b.branchId.toLowerCase() === clean.toLowerCase()
    );
    return match ? match.branchCode : clean;
  };

  // Helper to format values nicely based on column key and format
  const formatValue = (val: any, colKey: string, format?: string, rIdx: number = 0): string => {
    if (colKey === "sNo") {
      return String(rIdx + 1);
    }
    if (colKey === "fromAmtBranch" || colKey === "toAmtBranch") {
      return resolveBranchCode(val);
    }
    if (colKey === "paymentReceivingBranch") {
      if (!val) return "-";
      const clean = String(val).trim();
      if (clean === "From Company") return "From Branch";
      if (clean === "To Company") return "To Branch";
      return clean;
    }
    if (val === null || val === undefined || val === "") return "-";

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

  const isManyCols = columns.length > 10;

  return (
    <div className="w-full overflow-hidden border border-slate-300 rounded-xl mb-6">
      <table className="w-full border-collapse text-xs select-text">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-extrabold uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`font-black ${isManyCols ? "px-1.5 py-2 text-[8.5px] leading-tight" : "px-4 py-3 text-[10px]"} ${
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
                className="px-4 py-8 text-center text-slate-400 font-medium italic text-xs"
              >
                No matching shipment records resolved for this filter context.
              </td>
            </tr>
          ) : (
            shipments.map((s, rIdx) => (
              <tr key={s.shipmentId || rIdx} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col, cIdx) => {
                  const rawVal = col.key === "sNo" ? undefined : s[col.key as keyof ShipmentRecord];
                  const formattedStr = formatValue(rawVal, col.key, col.format, rIdx);

                  return (
                    <td
                      key={cIdx}
                      className={`text-slate-700 font-medium ${
                        isManyCols ? "px-1.5 py-1.5 text-[8.5px] leading-tight" : "px-4 py-2.5 text-xs"
                      } ${
                        col.align === "right"
                          ? "text-right font-mono"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {formattedStr}
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
