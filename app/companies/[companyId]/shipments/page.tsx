import React from "react";
import ShipmentWorkspace from "@/app/shipments/components/ShipmentWorkspace";

interface PageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function CompanyShipmentsPage({ params }: PageProps) {
  const { companyId } = await params;

  return (
    <ShipmentWorkspace
      title="Company Shipment Workspace"
      context={{ type: "company", id: companyId }}
      actions={["spreadsheet", "export", "statement", "billing"]}
      dashboardConfig={{
        cards: [
          "totalShipments",
          "sentShipments",
          "receivedShipments",
          "pendingPayments",
          "revenue",
          "pendingAmount",
          "delivered",
          "missing",
        ],
      }}
    />
  );
}
