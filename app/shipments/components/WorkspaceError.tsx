import React from "react";

interface WorkspaceErrorProps {
  errorMsg: string;
  onRetry: () => void;
}

export default function WorkspaceError({ errorMsg, onRetry }: WorkspaceErrorProps) {
  return (
    <div className="w-full bg-red-950/40 border border-red-900/50 p-4 rounded-2xl mb-6 flex items-center gap-3 text-xs text-red-400 font-semibold">
      <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="flex-1 flex justify-between items-center">
        <span>{errorMsg}</span>
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-red-900/20 hover:bg-red-900/40 rounded-lg border border-red-700/30 transition-colors text-[10px] uppercase font-bold cursor-pointer"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
