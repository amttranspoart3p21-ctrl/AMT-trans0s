export interface Shipment {
  date: string;
  vehicleNumber: string;

  fromAmtBranch: string;
  fromCompany: string;

  toAmtBranch: string;
  toCompany: string;

  packageType: string;
  quantity: number;

  ourInvoiceNumber: string;
  customerInvoiceNumber: string;

  paymentCompany: string;
   paymentReceivingBranch: string;
  pricePerPiece: number;
    deliveryType: "Normal" | "Home";   
  deliveryStatus: string;
  paymentStatus: string;
}

export interface ShipmentRecord extends Shipment {
  shipmentId: string;
  totalAmount: number;
}