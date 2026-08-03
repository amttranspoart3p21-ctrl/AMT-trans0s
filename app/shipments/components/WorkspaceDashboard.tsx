import React from "react";
import type { ShipmentRecord, DashboardCard, WorkspaceContext } from "@/types/shipment";

interface WorkspaceDashboardProps {
  shipments: ShipmentRecord[];
  context: WorkspaceContext;
  cards: DashboardCard[];
}

export default function WorkspaceDashboard({
  shipments,
  context,
  cards,
}: WorkspaceDashboardProps) {
  if (context.type === "global") return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const name = context.displayName || "";

  // 1. Common counters
  const total = shipments.length;
  const pendingPaymentsCount = shipments.filter((s) => s.paymentStatus === "Pending").length;
  const delivered = shipments.filter((s) => s.deliveryStatus === "Delivered").length;
  const missing = shipments.filter((s) => s.deliveryStatus === "Missing").length;
  const damaged = shipments.filter((s) => s.deliveryStatus === "Damaged").length;
  const today = shipments.filter((s) => s.date === todayStr).length;

  // 2. Revenue & outstanding totals based on company context matching (or generic)
  const isCompany = context.type === "company";
  
  const paymentSumSubset = isCompany
    ? shipments.filter((s) => s.paymentCompany?.toLowerCase() === name.toLowerCase())
    : shipments;

  const revenue = paymentSumSubset
    .filter((s) => s.paymentStatus === "Paid")
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const pendingAmount = paymentSumSubset
    .filter((s) => s.paymentStatus === "Pending")
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  // 3. Sent/Received (only relevant for company, but evaluates gracefully)
  const sent = shipments.filter((s) => s.fromCompany?.toLowerCase() === name.toLowerCase()).length;
  const received = shipments.filter((s) => s.toCompany?.toLowerCase() === name.toLowerCase()).length;

  // 4. Configuration card registry mapping keys to values and styles
  const cardDefinitions: Record<DashboardCard, { label: string; value: string | number; theme: string }> = {
    totalShipments: {
      label: "Total Shipments",
      value: total,
      theme: "text-violet-400 border-violet-500/20 bg-violet-500/5",
    },
    pendingPayments: {
      label: isCompany ? "Pending Bills" : "Pending Payments",
      value: pendingPaymentsCount,
      theme: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    },
    revenue: {
      label: isCompany ? "Total Revenue" : "Revenue",
      value: `₹${revenue.toLocaleString()}`,
      theme: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    },
    pendingAmount: {
      label: isCompany ? "Outstanding Amt" : "Pending Amount",
      value: `₹${pendingAmount.toLocaleString()}`,
      theme: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    },
    delivered: {
      label: isCompany ? "Delivered Cargo" : "Delivered Status",
      value: delivered,
      theme: "text-teal-400 border-teal-500/20 bg-teal-500/5",
    },
    missing: {
      label: "Missing Cargo",
      value: missing,
      theme: "text-red-400 border-red-500/20 bg-red-500/5",
    },
    damaged: {
      label: "Damaged Status",
      value: damaged,
      theme: "text-rose-500 border-rose-500/20 bg-rose-500/5",
    },
    todayShipments: {
      label: "Today's Shipments",
      value: today,
      theme: "text-sky-400 border-sky-500/20 bg-sky-500/5",
    },
    sentShipments: {
      label: "Sent Shipments",
      value: sent,
      theme: "text-sky-400 border-sky-500/20 bg-sky-500/5",
    },
    receivedShipments: {
      label: "Received Shipments",
      value: received,
      theme: "text-teal-400 border-teal-500/20 bg-teal-500/5",
    },
  };

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6 select-none">
      {cards.map((cardKey) => {
        const card = cardDefinitions[cardKey];
        if (!card) return null;
        return (
          <div
            key={cardKey}
            className={`flex flex-col border p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-lg ${card.theme}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/80 mb-1">
              {card.label}
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              {card.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
