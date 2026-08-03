import React from "react";
import ShipmentWorkspace from "@/app/shipments/components/ShipmentWorkspace";

interface PageProps {
  params: Promise<{
    branchId: string;
  }>;
}

export default async function BranchShipmentsPage({ params }: PageProps) {
  const { branchId } = await params;

  return (
    <ShipmentWorkspace
      title="Branch Shipment Workspace"
      context={{ type: "branch", id: branchId }}
      actions={["spreadsheet", "export", "statement"]}
      dashboardConfig={{
        cards: [
          "totalShipments",
          "pendingPayments",
          "revenue",
          "pendingAmount",
          "delivered",
          "missing",
          "damaged",
          "todayShipments",
        ],
      }}
    />
  );
}
