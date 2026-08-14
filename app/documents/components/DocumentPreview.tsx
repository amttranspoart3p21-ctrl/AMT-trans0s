import React, { useState, useEffect } from "react";
import DocumentLayout from "./DocumentLayout";
import DocumentHeader from "./DocumentHeader";
import DocumentTable from "./DocumentTable";
import TotalsSection from "./TotalsSection";
import Pagination from "@/app/shipments/components/Pagination";
import type { DocumentConfig } from "./document-config";
import type { Branch } from "@/types/branch";
import type { ShipmentRecord } from "@/types/shipment";

interface DocumentPreviewProps {
  config: DocumentConfig;
  shipments: ShipmentRecord[];
  branchName?: string;
  companyName?: string;
  dateRange?: string;
  generatedDate: string;
  branches?: Branch[];
}

export default function DocumentPreview({
  config,
  shipments,
  branchName,
  companyName,
  dateRange,
  generatedDate,
  branches = [],
}: DocumentPreviewProps) {
  // Screen Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Compute total pages
  const totalPages = Math.ceil(shipments.length / limit);

  // Normalize page index when shipment data or limit changes
  useEffect(() => {
    if (page > 1 && page > totalPages) {
      setPage(1);
    }
  }, [shipments.length, limit, totalPages, page]);

  // Paginated shipments slice for screen preview
  const paginatedShipments = shipments.slice((page - 1) * limit, page * limit);

  // Compute totals dynamically based on config calculation callbacks
  const calculatedTotals = config.totals.map((t) => ({
    label: t.label,
    value: t.calc(shipments, { branchName, companyName }),
  }));

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <DocumentLayout orientation={config.orientation}>
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
        {/* Screen view table wrapper: visible on screen, hidden on print */}
        <div className="flex-1 min-h-[300px] no-print">
          <DocumentTable shipments={paginatedShipments} columns={config.columns} branches={branches} />
        </div>

        {/* Print view table wrapper: hidden on screen, visible on print */}
        <div className="print-table-container flex-1 min-h-[300px]">
          <DocumentTable shipments={shipments} columns={config.columns} branches={branches} />
        </div>

        {/* 3. Totals and Signatures footer block */}
        <div className="mt-auto">
          {/* <TotalsSection totals={calculatedTotals} /> */}

          {/* Dynamic Footer / Signature placeholders */}
          <div className="border-t border-slate-200 pt-8 mt-12 flex justify-between items-center text-[10px] text-slate-500 font-bold select-none">
            <div className="flex flex-col gap-0.5">
              <span>Prepared By: System Admin</span>
              <span>TMS Operations Team</span>
            </div>
            <div className="text-right flex flex-col gap-1 items-end">
              <div className="h-10 w-28 border-b border-slate-350 mb-1" />
              <span>Authorized Signatory </span>
              <span className="text-[9px] font-medium text-slate-400">Stamp & Signature Required</span>
            </div>
          </div>
        </div>
      </DocumentLayout>

      {/* Screen pagination controls wrapper naturally placed below the document preview */}
      <div className={`w-full ${config.orientation === "landscape" ? "max-w-[1240px]" : "max-w-[800px]"} no-print px-4 md:px-0`}>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          totalRecords={shipments.length}
          limitOptions={[20, 50, 100]}
        />
      </div>
    </div>
  );
}
