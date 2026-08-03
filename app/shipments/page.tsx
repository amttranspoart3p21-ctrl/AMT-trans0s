"use client";

import React from "react";
import ShipmentWorkspace from "./components/ShipmentWorkspace";

export default function ShipmentsPage() {
  return (
    <ShipmentWorkspace
      title="Global Shipment Register"
      context={{ type: "global" }}
      actions={["spreadsheet", "export"]}
    />
  );
}
