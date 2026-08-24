"use client";

import React from "react";
import ShipmentWorkspace from "./components/ShipmentWorkspace";
import Layout from "@/components/layout/Layout";

export default function ShipmentsPage() {
  return (
    <Layout>
      <ShipmentWorkspace
        title="Global Shipment Register"
        context={{ type: "global" }}
        actions={["spreadsheet", "export"]}
      />
    </Layout>
  );
}
