
interface LoaderProps {
  variant?: "spinner" | "skeleton" | "overlay";
  rows?: number;
}

export default function Loader({ variant = "spinner", rows = 5 }: LoaderProps) {
  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-40 flex items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Processing Transaction...
          </span>
        </div>
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className="w-full flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="animate-pulse bg-slate-900/40 border border-slate-850 p-4.5 rounded-xl w-full flex items-center gap-4">
            <div className="h-4 bg-slate-800/60 rounded-md w-12 shrink-0" />
            <div className="h-4 bg-slate-800/60 rounded-md w-1/4" />
            <div className="h-4 bg-slate-800/60 rounded-md w-1/3" />
            <div className="h-4 bg-slate-800/60 rounded-md w-1/6" />
            <div className="h-4 bg-slate-800/60 rounded-md w-20 ml-auto shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-12">
      <svg className="animate-spin h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
}
