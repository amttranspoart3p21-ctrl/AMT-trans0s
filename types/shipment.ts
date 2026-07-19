export interface Shipment {
//   shipmentId: string;
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
  pricePerPiece: number;
//   totalAmount: number;

  deliveryStatus: string;
  paymentStatus: string;
}

export interface ShipmentRecord extends Shipment {
  shipmentId: string;
  totalAmount: number;
}