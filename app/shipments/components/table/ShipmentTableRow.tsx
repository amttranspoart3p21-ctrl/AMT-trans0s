import React from "react";
import type { ShipmentRecord } from "@/types/shipment";
import type { Branch } from "@/types/branch";
import type { Company } from "@/types/company";
import type { Package } from "@/types/packageType";
import type { CompanyRouteRate } from "@/types/company-route-rate";
import type { GlobalRouteRate } from "@/types/global-route-rate";
import { getRowWarnings } from "../../utils/shipmentValidation";
import ShipmentTableCell from "./ShipmentTableCell";
import ShipmentTableActions from "./ShipmentTableActions";

export interface ShipmentTableRowProps {
  shipment: ShipmentRecord;
  isSelected: boolean;
  isDirty: boolean;
  selectedIds: string[];
  onSelectRow?: (selectedIds: string[]) => void;
  mode?: "read-only" | "spreadsheet";
  branches: Branch[];
  companies: Company[];
  packages: Package[];
  companyRouteRates: CompanyRouteRate[];
  globalRouteRates: GlobalRouteRate[];
  highlightedCells: Record<string, Set<string>>;
  editingCell: { shipmentId: string; field: string } | null;
  setEditingCell: (cell: { shipmentId: string; field: string } | null) => void;
  onChangeRow?: (shipmentId: string, field: keyof ShipmentRecord, value: any) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>, shipmentId: string, field: keyof ShipmentRecord) => void;
  onPreviewShipment?: (shipment: ShipmentRecord) => void;
  onEditShipment?: (shipment: ShipmentRecord) => void;
  onViewImage?: (imageId: string, fileName: string) => void;
  onDelete: (shipmentId: string) => void;
}

export default function ShipmentTableRow({
  shipment,
  isSelected,
  isDirty,
  selectedIds,
  onSelectRow,
  mode = "read-only",
  branches,
  companies,
  packages,
  companyRouteRates,
  globalRouteRates,
  highlightedCells,
  editingCell,
  setEditingCell,
  onChangeRow,
  handleKeyDown,
  onPreviewShipment,
  onEditShipment,
  onViewImage,
  onDelete,
}: ShipmentTableRowProps) {
  const warnings = getRowWarnings(shipment);
  const hasWarnings = warnings.length > 0;

  // Dynamically filter company dropdowns by branch selection to enforce Master integrity
  const fromBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === shipment.fromAmtBranch?.trim().toLowerCase()
  );
  const fromAmtCompanies = companies
    .filter((c) => fromBranchObj && c.branchId === fromBranchObj.branchId)
    .map((c) => c.companyName);

  const toBranchObj = branches.find(
    (b) => b.branchName?.trim().toLowerCase() === shipment.toAmtBranch?.trim().toLowerCase()
  );
  const toAmtCompanies = companies
    .filter((c) => toBranchObj && c.branchId === toBranchObj.branchId)
    .map((c) => c.companyName);

  const activePackagesList = packages.map((p) => p.packageName);

  return (
    <tr
      title={hasWarnings ? `Validation issues:\n${warnings.join("\n")}` : undefined}
      className={`transition-colors border-b border-slate-100/90 dark:border-zinc-800/70 border-l-2 h-[50px] group ${
        isSelected
          ? "bg-sky-50/70 dark:bg-sky-950/40 border-l-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/60"
          : isDirty
          ? "bg-emerald-50/40 dark:bg-emerald-950/30 border-l-emerald-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/50"
          : hasWarnings
          ? "bg-amber-50/40 dark:bg-amber-950/30 border-l-amber-500 hover:bg-amber-50/60 dark:hover:bg-amber-950/50"
          : "bg-white even:bg-[#f8fafc]/60 hover:bg-slate-50 dark:bg-[#242526] dark:even:bg-[#1c1d1e]/90 dark:hover:bg-zinc-800/80 border-l-transparent"
      }`}
    >
      <td className="py-2 px-3.5 align-middle" style={{ width: "115px", minWidth: "115px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="date"
          type="date"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 font-semibold text-slate-800 dark:text-zinc-100 align-middle" style={{ width: "120px", minWidth: "120px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="vehicleNumber"
          type="text"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "135px", minWidth: "135px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="fromAmtBranch"
          type="select"
          options={branches.map((b) => b.branchName)}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "240px", minWidth: "240px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="fromCompany"
          type="select"
          options={fromAmtCompanies}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "135px", minWidth: "135px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="toAmtBranch"
          type="select"
          options={branches.map((b) => b.branchName)}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "240px", minWidth: "240px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="toCompany"
          type="select"
          options={toAmtCompanies}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "130px", minWidth: "130px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="ourInvoiceNumber"
          type="text"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "150px", minWidth: "150px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="customerInvoiceNumber"
          type="text"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "200px", minWidth: "200px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="packageType"
          type="select"
          options={activePackagesList}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "90px", minWidth: "90px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="quantity"
          type="text"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "140px", minWidth: "140px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="pickupService"
          type="select"
          options={["Branch", "Home", "Free Home"]}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "150px", minWidth: "150px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="deliveryService"
          type="select"
          options={["Branch", "Home", "Free Home"]}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "135px", minWidth: "135px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="paymentReceivingBranch"
          type="select"
          options={["From Company", "To Company"]}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "240px", minWidth: "240px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="paymentCompany"
          type="select"
          options={Array.from(new Set(companies.map((c) => c.companyName)))}
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "130px", minWidth: "130px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="transportRate"
          type="number"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "125px", minWidth: "125px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="pickupCharge"
          type="number"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "125px", minWidth: "125px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="deliveryCharge"
          type="number"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "140px", minWidth: "140px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="pricePerPiece"
          type="number"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 align-middle" style={{ width: "140px", minWidth: "140px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="totalAmount"
          type="number"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 text-center align-middle" style={{ width: "140px", minWidth: "140px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="deliveryStatus"
          type="badge"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <td className="py-2 px-3.5 text-center align-middle" style={{ width: "130px", minWidth: "130px" }}>
        <ShipmentTableCell
          shipment={shipment}
          field="paymentStatus"
          type="badge"
          mode={mode}
          branches={branches}
          companies={companies}
          packages={packages}
          companyRouteRates={companyRouteRates}
          globalRouteRates={globalRouteRates}
          highlightedCells={highlightedCells}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onChangeRow={onChangeRow}
          handleKeyDown={handleKeyDown}
        />
      </td>
      <ShipmentTableActions
        shipment={shipment}
        onPreviewShipment={onPreviewShipment}
        onEditShipment={onEditShipment}
        onViewImage={onViewImage}
        onDelete={onDelete}
      />
    </tr>
  );
}
