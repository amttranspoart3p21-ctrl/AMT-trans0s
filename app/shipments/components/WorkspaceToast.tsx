import React from "react";

interface WorkspaceToastProps {
  message: string | null;
}

export default function WorkspaceToast({ message }: WorkspaceToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span>{message}</span>
    </div>
  );
}
