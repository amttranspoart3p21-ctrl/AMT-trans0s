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
      theme: "text-slate-900 dark:text-zinc-100 border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#1f2021]",
    },
    pendingPayments: {
      label: isCompany ? "Pending Bills" : "Pending Payments",
      value: pendingPaymentsCount,
      theme: "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30",
    },
    revenue: {
      label: isCompany ? "Total Revenue" : "Revenue",
      value: `₹${revenue.toLocaleString()}`,
      theme: "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30",
    },
    pendingAmount: {
      label: isCompany ? "Outstanding Amt" : "Pending Amount",
      value: `₹${pendingAmount.toLocaleString()}`,
      theme: "text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30",
    },
    delivered: {
      label: isCompany ? "Delivered Cargo" : "Delivered Status",
      value: delivered,
      theme: "text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30",
    },
    missing: {
      label: "Missing Cargo",
      value: missing,
      theme: "text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30",
    },
    damaged: {
      label: "Damaged Status",
      value: damaged,
      theme: "text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30",
    },
    todayShipments: {
      label: "Today's Shipments",
      value: today,
      theme: "text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30",
    },
    sentShipments: {
      label: "Sent Shipments",
      value: sent,
      theme: "text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30",
    },
    receivedShipments: {
      label: "Received Shipments",
      value: received,
      theme: "text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30",
    },
  };

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4 select-none">
      {cards.map((cardKey) => {
        const card = cardDefinitions[cardKey];
        if (!card) return null;
        return (
          <div
            key={cardKey}
            className={`flex flex-col border p-3 rounded-xl transition-all shadow-xs ${card.theme}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-0.5">
              {card.label}
            </span>
            <span className="text-lg font-bold tracking-tight">
              {card.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
