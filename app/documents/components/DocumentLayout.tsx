import React from "react";

interface DocumentLayoutProps {
  children: React.ReactNode;
  orientation?: "portrait" | "landscape";
}

export default function DocumentLayout({ children, orientation = "portrait" }: DocumentLayoutProps) {
  const isLandscape = orientation === "landscape";
  return (
    <div className="doc-layout-outer w-full flex justify-center overflow-x-auto">
      <div 
        id="printable-document"
        className={`w-full ${
          isLandscape ? "max-w-[1630px] p-4 sm:p-5" : "max-w-[800px] p-4 sm:p-6"
        } bg-white text-slate-900 shadow-2xl rounded-xl flex flex-col justify-between relative border border-slate-200 select-text ${
          isLandscape ? "landscape-doc" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
