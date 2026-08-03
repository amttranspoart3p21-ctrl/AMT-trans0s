import React from "react";
import DocumentLayout from "./DocumentLayout";
import DocumentHeader from "./DocumentHeader";
import DocumentTable from "./DocumentTable";
import TotalsSection from "./TotalsSection";
import type { DocumentConfig } from "./document-config";
import type { ShipmentRecord } from "@/types/shipment";

interface DocumentPreviewProps {
  config: DocumentConfig;
  shipments: ShipmentRecord[];
  branchName?: string;
  companyName?: string;
  dateRange?: string;
  generatedDate: string;
}

export default function DocumentPreview({
  config,
  shipments,
  branchName,
  companyName,
  dateRange,
  generatedDate,
}: DocumentPreviewProps) {
  // Compute totals dynamically based on config calculation callbacks
  const calculatedTotals = config.totals.map((t) => ({
    label: t.label,
    value: t.calc(shipments),
  }));

  return (
    <DocumentLayout>
      {/* 1. Header with branding fields */}
      <DocumentHeader
        title={config.title}
        branding={config.branding}
        branchName={branchName}
        companyName={companyName}
        dateRange={dateRange}
        generatedDate={generatedDate}
      />

      {/* 2. Main Shipment Records Table */}
      <div className="flex-1 min-h-[300px]">
        <DocumentTable shipments={shipments} columns={config.columns} />
      </div>

      {/* 3. Totals and Signatures footer block */}
      <div className="mt-auto">
        <TotalsSection totals={calculatedTotals} />

        {/* Dynamic Footer / Signature placeholders */}
        <div className="border-t border-slate-200 pt-8 mt-12 flex justify-between items-center text-[10px] text-slate-500 font-bold select-none">
          <div className="flex flex-col gap-0.5">
            <span>Prepared By: System Admin</span>
            <span>AMT Operations Team</span>
          </div>
          <div className="text-right flex flex-col gap-1 items-end">
            <div className="h-10 w-28 border-b border-slate-350 mb-1" />
            <span>Authorized Signatory</span>
            <span className="text-[9px] font-medium text-slate-400">Stamp & Signature Required</span>
          </div>
        </div>
      </div>
    </DocumentLayout>
  );
}
