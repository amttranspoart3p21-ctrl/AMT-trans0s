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
  paymentReceivingBranch: "From Company" | "To Company";

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

export interface ShipmentRecord extends Shipment {
  shipmentId: string;
  totalAmount: number | null;
}