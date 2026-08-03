import React from "react";

interface DocumentLayoutProps {
  children: React.ReactNode;
}

export default function DocumentLayout({ children }: DocumentLayoutProps) {
  return (
    <div className="w-full bg-slate-950 p-6 flex justify-center">
      <div 
        className="w-full max-w-[800px] min-h-[1130px] bg-white text-slate-900 p-10 shadow-2xl rounded-xl flex flex-col justify-between relative border border-slate-200 select-text"
        style={{ contentVisibility: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}
