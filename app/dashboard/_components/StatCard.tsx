"use client";

import { useAppSelector } from "@/store/hooks";
import React from "react";

/* ─── Prominent Circular Ring / Donut Chart ────────────────────── */
function CircularProgress({
  pct,
  color,
  isDarkMode,
}: {
  pct: number;
  color: string;
  isDarkMode: boolean;
}) {
  const safe = Math.min(100, Math.max(0, Math.round(pct)));
  // r = 15.9155 gives a circumference of exactly 100
  const circumference = 100;
  const strokeDashoffset = circumference - (safe / 100) * circumference;

  return (
    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        {/* Background Track - Clearly visible in dark mode */}
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke={isDarkMode ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0"}
          strokeWidth="3.2"
        />
        {/* Animated / Glowing Progress Ring */}
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke={color}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out",
            filter: `drop-shadow(0 0 4px ${color}44)`,
          }}
        />
      </svg>
      {/* Centered Percentage Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
        <span
          className="text-[12px] font-black tracking-tight"
          style={{ color: isDarkMode ? "#F0F6FC" : "#0F172A" }}
        >
          {safe}
          <span className="text-[8px] font-bold ml-0.5" style={{ color }}>
            %
          </span>
        </span>
      </div>
    </div>
  );
}

/* ─── Real Breakdown Donut (For Total Cards) ────────────────────── */
interface BreakdownItem {
  label: string;
  value: number;
  color: string;
}

function DualSegmentDonut({
  breakdown,
  total,
  isDarkMode,
}: {
  breakdown: BreakdownItem[];
  total: number;
  isDarkMode: boolean;
}) {
  if (total <= 0) return null;

  const firstPct = total > 0 ? (breakdown[0].value / total) * 100 : 0;
  const secondPct = total > 0 && breakdown[1] ? (breakdown[1].value / total) * 100 : 0;
  const circumference = 100;

  return (
    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        {/* Base Track */}
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke={isDarkMode ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0"}
          strokeWidth="3.2"
        />
        {/* Second segment (e.g. Inactive) */}
        {secondPct > 0 && (
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke={breakdown[1].color}
            strokeWidth="3.2"
            strokeDasharray={`${secondPct} ${100 - secondPct}`}
            strokeDashoffset={-firstPct}
            style={{
              filter: `drop-shadow(0 0 3px ${breakdown[1].color}44)`,
            }}
          />
        )}
        {/* First segment (e.g. Active) */}
        {firstPct > 0 && (
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke={breakdown[0].color}
            strokeWidth="3.2"
            strokeDasharray={`${firstPct} ${100 - firstPct}`}
            strokeDashoffset={0}
            style={{
              filter: `drop-shadow(0 0 4px ${breakdown[0].color}44)`,
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
        <span
          className="text-[11px] font-black tracking-tight"
          style={{ color: isDarkMode ? "#F0F6FC" : "#0F172A" }}
        >
          {Math.round(firstPct)}
          <span className="text-[7.5px] font-bold text-emerald-400 ml-0.5">%</span>
        </span>
      </div>
    </div>
  );
}

/* ─── StatCard Component ───────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  /** Percentage (0-100) for single metric gauge */
  percentage?: number;
  /** Real multi-segment data for Total cards */
  breakdown?: BreakdownItem[];
  /** Context subtitle (e.g. "10 of 10 Active") */
  subtext?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  iconColor,
  iconBg,
  percentage,
  breakdown,
  subtext,
}: StatCardProps) {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 transition-all duration-200 cursor-default group flex flex-col justify-between h-full"
      style={
        isDarkMode
          ? {
              background: "#242526",
              border: "1px solid #21262D",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.35)",
            }
          : {
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.05)",
            }
      }
    >
      {/* Ambient background glow */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none transition-opacity duration-300"
        style={{
          background: iconColor,
          opacity: isDarkMode ? 0.07 : 0.04,
          filter: "blur(32px)",
        }}
      />

      {/* Top Row: Icon on left, Real Large Chart on right */}
      <div className="relative flex items-center justify-between gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>

        {/* Real Chart Visual (No Dummy Bars) */}
        {percentage !== undefined ? (
          <CircularProgress pct={percentage} color={iconColor} isDarkMode={isDarkMode} />
        ) : breakdown && breakdown.length > 0 ? (
          <DualSegmentDonut breakdown={breakdown} total={value} isDarkMode={isDarkMode} />
        ) : null}
      </div>

      {/* Main Metric Value, Label (Left) and Context Subtext (Right - Green Square Area) */}
      <div className="relative mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-[34px] font-extrabold tabular-nums leading-none tracking-tight"
            style={{ color: isDarkMode ? "#F0F6FC" : "#0F172A" }}
          >
            {value}
          </p>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.1em] mt-2 leading-tight"
            style={{ color: isDarkMode ? "#8B949E" : "#64748B" }}
          >
            {label}
          </p>
        </div>

        {/* Right side aligned badge */}
        {subtext && (
          <div className="text-right shrink-0 max-w-[58%] pb-0.5">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10.5px] font-semibold tracking-normal text-right shadow-xs transition-colors"
              style={
                isDarkMode
                  ? {
                      background: "#21262D",
                      color: "#C9D1D9",
                      border: "1px solid #30363D",
                    }
                  : {
                      background: "#F1F5F9",
                      color: "#334155",
                      border: "1px solid #E2E8F0",
                    }
              }
            >
              {subtext}
            </span>
          </div>
        )}
      </div>

      {/* Real Progress / Breakdown Bar at bottom */}
      <div className="relative mt-4 pt-2">
        {percentage !== undefined ? (
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, percentage))}%`,
                background: iconColor,
              }}
            />
          </div>
        ) : breakdown && breakdown.length > 0 ? (
          <div
            className="w-full h-1.5 rounded-full overflow-hidden flex"
            style={{ background: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0" }}
          >
            {breakdown.map((item, idx) => {
              const itemPct = value > 0 ? (item.value / value) * 100 : 0;
              return (
                <div
                  key={idx}
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${itemPct}%`,
                    background: item.color,
                  }}
                  title={`${item.label}: ${item.value} (${Math.round(itemPct)}%)`}
                />
              );
            })}
          </div>
        ) : (
          <div
            className="w-full h-1.5 rounded-full"
            style={{ background: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0" }}
          />
        )}
      </div>

      {/* Hover bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-300 rounded-b-xl"
        style={{ background: iconColor, opacity: 0.85 }}
      />
    </div>
  );
}
