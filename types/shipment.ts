export interface Shipment {
  date: string;
  vehicleNumber: string;

  fromAmtBranch: string;
  fromCompany: string;

  toAmtBranch: string;
  toCompany: string;

  packageType: string;
  quantity: string;

  ourInvoiceNumber: string;
  customerInvoiceNumber: string;

  paymentCompany: string;
  paymentReceivingBranch?: "From Company" | "To Company" | "";

  pickupService: "Branch" | "Home" | "Free Home";
  deliveryService: "Branch" | "Home" | "Free Home";

  transportRate?: number | null;
  pickupCharge?: number | null;
  deliveryCharge?: number | null;
  pricePerPiece?: number | null;
  totalAmount?: number | null;
  
  deliveryStatus: "Not Delivered" | "Delivered" | "Missing" | "Damaged";
  paymentStatus: "Pending" | "Paid" | "Free";
}

/** Single source of truth for Payment Status dropdown options */
export const PAYMENT_STATUS_OPTIONS: Shipment["paymentStatus"][] = [
  "Pending",
  "Paid",
  "Free",
] as const;

/** Single source of truth for Delivery Status dropdown options */
export const DELIVERY_STATUS_OPTIONS: Shipment["deliveryStatus"][] = [
  "Not Delivered",
  "Delivered",
  "Missing",
  "Damaged",
] as const;

export interface ShipmentRecord extends Shipment {
  shipmentId: string;
  totalAmount: number | null;
  uploadSessionId?: string;
  imageId?: string;
  imagePath?: string;
  imageFileName?: string;
}

export interface ShipmentFilters {
  search?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  month?: string;
  year?: string;
  fromBranch?: string;
  toBranch?: string;
  fromCompany?: string;
  toCompany?: string;
  company?: string;
  deliveryStatus?: Shipment["deliveryStatus"];
  paymentStatus?: Shipment["paymentStatus"];
  vehicleNumber?: string;
  ourInvoiceNumber?: string;
  customerInvoiceNumber?: string;
  packageType?: string;
  pickupService?: Shipment["pickupService"];
  deliveryService?: Shipment["deliveryService"];
}

export interface ShipmentPagination {
  page?: number;
  limit?: number;
}

export interface ShipmentResponse {
  success: boolean;
  message: string;
  data: ShipmentRecord[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BulkUpdateRequest {
  shipmentIds: string[];
  updates: Partial<ShipmentRecord>;
}

export type WorkspaceAction = "spreadsheet" | "export" | "statement" | "billing";

export type DashboardCard =
  | "totalShipments"
  | "pendingPayments"
  | "revenue"
  | "pendingAmount"
  | "delivered"
  | "missing"
  | "damaged"
  | "todayShipments"
  | "sentShipments"
  | "receivedShipments";

export interface WorkspaceContext {
  type: "global" | "branch" | "company";
  id?: string;
  displayName?: string;
}