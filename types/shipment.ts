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
  pickupType:"Normal" | "Home" | "Free Home Pickup"; 
    deliveryType: "Normal" | "Home" | "Free Home Delivery";   
  deliveryStatus: string;
  paymentStatus: string;
}

export interface ShipmentRecord extends Shipment {
  shipmentId: string;
  totalAmount: number;
}