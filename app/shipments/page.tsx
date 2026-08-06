"use client";

import React from "react";
import ShipmentWorkspace from "./components/ShipmentWorkspace";
import AdminLayout from "@/components/layout/AdminLayout";

export default function ShipmentsPage() {
  return (
    <AdminLayout>
      <ShipmentWorkspace
        title="Global Shipment Register"
        context={{ type: "global" }}
        actions={["spreadsheet", "export"]}
      />
    </AdminLayout>
  );
}
