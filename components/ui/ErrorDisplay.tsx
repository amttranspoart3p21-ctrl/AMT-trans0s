import React from "react";
import Button from "./Button";

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({
  message = "Failed to load database records.",
  onRetry,
}: ErrorDisplayProps) {
  return (
    <div className="w-full bg-rose-955/5 border border-rose-900/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-rose-950/50 border border-rose-900/35 flex items-center justify-center text-rose-500 shrink-0 text-xs">
          ⚠️
        </div>
        <div className="text-left">
          <h4 className="text-xs font-bold text-rose-455">System Error Encountered</h4>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry Query
        </Button>
      )}
    </div>
  );
}
