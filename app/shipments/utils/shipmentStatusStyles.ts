import type { ShipmentRecord } from "@/types/shipment";

/**
 * Returns Tailwind CSS classes for delivery status badges.
 */
export function getDeliveryStatusStyle(
  status: ShipmentRecord["deliveryStatus"]
): string {
  switch (status) {
    case "Delivered":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
    case "Not Delivered":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
    case "Missing":
      return "bg-red-500/10 text-red-400 border border-red-500/25";
    case "Damaged":
      return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
  }
}

/**
 * Returns Tailwind CSS classes for payment status badges.
 */
export function getPaymentStatusStyle(
  status: ShipmentRecord["paymentStatus"]
): string {
  switch (status) {
    case "Paid":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
    case "Pending":
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
    case "Free":
      return "bg-sky-500/10 text-sky-400 border border-sky-500/25";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/25";
  }
}
