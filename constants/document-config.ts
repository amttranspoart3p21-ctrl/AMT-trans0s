import type { ShipmentRecord } from "@/types/shipment";

export interface ColumnConfig {
  header: string;
  key: string;
  align?: "left" | "right" | "center";
  format?: "text" | "number" | "currency" | "date";
}

export interface TotalsConfig {
  label: string;
  calc: (
    shipments: ShipmentRecord[],
    context?: { branchName?: string; companyName?: string }
  ) => string | number;
}

export interface BrandingConfig {
  logoUrl?: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

export interface DocumentConfig {
  id: string;
  title: string;
  columns: ColumnConfig[];
  totals: TotalsConfig[];
  branding: BrandingConfig;
}

// Global Helper to parse quantities safely
const sumQuantities = (shipments: ShipmentRecord[]): number => {
  return shipments.reduce((sum, s) => {
    if (!s.quantity) return sum;
    const clean = s.quantity.trim();
    if (clean === "") return sum;
    const pattern = /^\d+(?:\s*[xX*×]\s*\d+)*$/;
    if (!pattern.test(clean)) return sum + 1;
    const parts = clean.split(/[xX*×]/);
    let product = 1;
    for (const part of parts) {
      const valStr = part.trim();
      const val = parseInt(valStr, 10);
      if (!isNaN(val) && val > 0) {
        product *= val;
      }
    }
    return sum + product;
  }, 0);
};

// Global Helper to sum amounts
const sumAmounts = (shipments: ShipmentRecord[]): number => {
  return shipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
};

// Default Branding details
const defaultBranding: BrandingConfig = {
  companyName: "ANTIGRAVITY MOTOR TRANSPORT (AMT)",
  address: "Plot No. 12, Transport Nagar, Ambur, Tamil Nadu - 635802",
  phone: "+91 98765 43210 / +91 87654 32109",
  email: "billing@amt-transport.com",
  gstNumber: "33AABCA1234F1Z5",
  logoUrl: "/logo-placeholder.png",
};

export const documentConfigurations: Record<string, DocumentConfig> = {
  shipment: {
    id: "shipment",
    title: "Shipment Register Statement",
    branding: defaultBranding,
    columns: [
      { header: "Date", key: "date", align: "left", format: "date" },
      { header: "Vehicle", key: "vehicleNumber", align: "left" },
      { header: "From Branch", key: "fromAmtBranch", align: "left" },
      { header: "From Company", key: "fromCompany", align: "left" },
      { header: "To Branch", key: "toAmtBranch", align: "left" },
      { header: "To Company", key: "toCompany", align: "left" },
      { header: "Package", key: "packageType", align: "left" },
      { header: "Qty", key: "quantity", align: "center" },
      { header: "Total Amount", key: "totalAmount", align: "right", format: "currency" },
    ],
    totals: [
      { label: "Total Shipments", calc: (list) => list.length },
      { label: "Total Quantity", calc: (list) => sumQuantities(list) },
      { label: "Total Amount", calc: (list) => `₹${sumAmounts(list).toLocaleString("en-IN")}` },
    ],
  },
  branch: {
    id: "branch",
    title: "Branch Transport Statement",
    branding: defaultBranding,
    columns: [
      { header: "Date", key: "date", align: "left", format: "date" },
      { header: "Vehicle", key: "vehicleNumber", align: "left" },
      { header: "To Branch", key: "toAmtBranch", align: "left" },
      { header: "To Company", key: "toCompany", align: "left" },
      { header: "Package", key: "packageType", align: "left" },
      { header: "Qty", key: "quantity", align: "center" },
      { header: "Rate", key: "pricePerPiece", align: "right", format: "currency" },
      { header: "Total Amount", key: "totalAmount", align: "right", format: "currency" },
    ],
    totals: [
      { label: "Total Shipments", calc: (list) => list.length },
      {
        label: "Delivered",
        calc: (list) => list.filter((s) => s.deliveryStatus === "Delivered").length,
      },
      {
        label: "Missing",
        calc: (list) => list.filter((s) => s.deliveryStatus === "Missing").length,
      },
      {
        label: "Damaged",
        calc: (list) => list.filter((s) => s.deliveryStatus === "Damaged").length,
      },
      {
        label: "Revenue",
        calc: (list) => {
          const revenue = list
            .filter((s) => s.paymentStatus === "Paid")
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
          return `₹${revenue.toLocaleString("en-IN")}`;
        },
      },
      {
        label: "Pending Amount",
        calc: (list) => {
          const pending = list
            .filter((s) => s.paymentStatus === "Pending")
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
          return `₹${pending.toLocaleString("en-IN")}`;
        },
      },
    ],
  },
  company: {
    id: "company",
    title: "Company Accounts Statement",
    branding: defaultBranding,
    columns: [
      { header: "Date", key: "date", align: "left", format: "date" },
      { header: "Vehicle", key: "vehicleNumber", align: "left" },
      { header: "Our Invoice", key: "ourInvoiceNumber", align: "left" },
      { header: "Customer Invoice", key: "customerInvoiceNumber", align: "left" },
      { header: "Package", key: "packageType", align: "left" },
      { header: "Qty", key: "quantity", align: "center" },
      { header: "Rate", key: "pricePerPiece", align: "right", format: "currency" },
      { header: "Total Amount", key: "totalAmount", align: "right", format: "currency" },
    ],
    totals: [
      {
        label: "Sent Shipments",
        calc: (list, context) => {
          const companyName = context?.companyName || "";
          return list.filter((s) => s.fromCompany?.toLowerCase() === companyName.toLowerCase()).length;
        },
      },
      {
        label: "Received Shipments",
        calc: (list, context) => {
          const companyName = context?.companyName || "";
          return list.filter((s) => s.toCompany?.toLowerCase() === companyName.toLowerCase()).length;
        },
      },
      {
        label: "Paid Amount",
        calc: (list) => {
          const paid = list
            .filter((s) => s.paymentStatus === "Paid")
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
          return `₹${paid.toLocaleString("en-IN")}`;
        },
      },
      {
        label: "Outstanding Amount",
        calc: (list) => {
          const outstanding = list
            .filter((s) => s.paymentStatus === "Pending")
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
          return `₹${outstanding.toLocaleString("en-IN")}`;
        },
      },
    ],
  },
  vehicle: {
    id: "vehicle",
    title: "Vehicle Log & Rates Statement",
    branding: defaultBranding,
    columns: [
      { header: "Date", key: "date", align: "left", format: "date" },
      { header: "Vehicle", key: "vehicleNumber", align: "left" },
      { header: "From Branch", key: "fromAmtBranch", align: "left" },
      { header: "To Branch", key: "toAmtBranch", align: "left" },
      { header: "Package", key: "packageType", align: "left" },
      { header: "Qty", key: "quantity", align: "center" },
      { header: "Total Amount", key: "totalAmount", align: "right", format: "currency" },
    ],
    totals: [
      { label: "Total Trips", calc: (list) => list.length },
      { label: "Total Quantity", calc: (list) => sumQuantities(list) },
      { label: "Revenue", calc: (list) => `₹${sumAmounts(list).toLocaleString("en-IN")}` },
    ],
  },
  payment: {
    id: "payment",
    title: "Outstanding Payment Statement",
    branding: defaultBranding,
    columns: [
      { header: "Date", key: "date", align: "left", format: "date" },
      { header: "Payment Company", key: "paymentCompany", align: "left" },
      { header: "Our Invoice", key: "ourInvoiceNumber", align: "left" },
      { header: "Status", key: "paymentStatus", align: "center" },
      { header: "Price", key: "pricePerPiece", align: "right", format: "currency" },
      { header: "Total Amount", key: "totalAmount", align: "right", format: "currency" },
    ],
    totals: [
      {
        label: "Paid Amount",
        calc: (list) => {
          const paid = list
            .filter((s) => s.paymentStatus === "Paid")
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
          return `₹${paid.toLocaleString("en-IN")}`;
        },
      },
      {
        label: "Pending Amount",
        calc: (list) => {
          const pending = list
            .filter((s) => s.paymentStatus === "Pending")
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
          return `₹${pending.toLocaleString("en-IN")}`;
        },
      },
      {
        label: "Outstanding Bills",
        calc: (list) => list.filter((s) => s.paymentStatus === "Pending").length,
      },
    ],
  },
  billing: {
    id: "billing",
    title: "Transport Tax Invoice",
    branding: defaultBranding,
    columns: [
      { header: "Package Description", key: "packageType", align: "left" },
      { header: "Quantity", key: "quantity", align: "center" },
      { header: "Rate per Piece", key: "pricePerPiece", align: "right", format: "currency" },
      { header: "Gross Total", key: "totalAmount", align: "right", format: "currency" },
    ],
    totals: [
      {
        label: "Subtotal",
        calc: (list) => {
          const total = sumAmounts(list);
          return `₹${total.toLocaleString("en-IN")}`;
        },
      },
      {
        label: "CGST (9%)",
        calc: (list) => {
          const total = sumAmounts(list) * 0.09;
          return `₹${total.toLocaleString("en-IN")}`;
        },
      },
      {
        label: "SGST (9%)",
        calc: (list) => {
          const total = sumAmounts(list) * 0.09;
          return `₹${total.toLocaleString("en-IN")}`;
        },
      },
      {
        label: "Grand Total",
        calc: (list) => {
          const total = sumAmounts(list) * 1.18;
          return `₹${total.toLocaleString("en-IN")}`;
        },
      },
    ],
  },
};
