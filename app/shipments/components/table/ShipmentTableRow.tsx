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
      className={`transition-colors border-l-2 h-[50px] ${
        isDirty
          ? "bg-emerald-950/10 border-emerald-500 hover:bg-emerald-950/20"
          : hasWarnings
          ? "bg-amber-955/5 border-amber-500/50 hover:bg-amber-955/10"
          : "hover:bg-slate-800/30 border-transparent"
      }`}
    >
      {/* Checkbox Select Cell */}
      <td className="py-[4px] px-3 text-center align-middle w-[50px]" style={{ width: "50px", minWidth: "50px" }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {
            const newSelected = isSelected
              ? selectedIds.filter((id) => id !== shipment.shipmentId)
              : [...selectedIds, shipment.shipmentId];
            onSelectRow?.(newSelected);
          }}
          className="rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500 cursor-pointer h-3.5 w-3.5"
        />
      </td>
      <td className="py-[4px] px-3 align-middle" style={{ width: "110px", minWidth: "110px" }}>
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
      <td className="py-[4px] px-3 font-semibold text-slate-200 align-middle" style={{ width: "110px", minWidth: "110px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "130px", minWidth: "130px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "240px", minWidth: "240px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "130px", minWidth: "130px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "240px", minWidth: "240px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "130px", minWidth: "130px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "150px", minWidth: "150px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "200px", minWidth: "200px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "90px", minWidth: "90px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "140px", minWidth: "140px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "150px", minWidth: "150px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "130px", minWidth: "130px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "240px", minWidth: "240px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "120px", minWidth: "120px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "120px", minWidth: "120px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "120px", minWidth: "120px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "140px", minWidth: "140px" }}>
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
      <td className="py-[4px] px-3 align-middle" style={{ width: "140px", minWidth: "140px" }}>
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
      <td className="py-[4px] px-3 text-center align-middle" style={{ width: "140px", minWidth: "140px" }}>
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
      <td className="py-[4px] px-3 text-center align-middle" style={{ width: "120px", minWidth: "120px" }}>
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
