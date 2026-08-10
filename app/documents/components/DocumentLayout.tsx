import React from "react";

interface DocumentLayoutProps {
  children: React.ReactNode;
  orientation?: "portrait" | "landscape";
}

export default function DocumentLayout({ children, orientation = "portrait" }: DocumentLayoutProps) {
  const isLandscape = orientation === "landscape";
  return (
    <div className="doc-layout-outer w-full bg-slate-950 p-4 md:p-6 flex justify-center overflow-x-auto">
      <div 
        id="printable-document"
        className={`w-full ${
          isLandscape ? "max-w-[1240px] min-h-[750px] p-6" : "max-w-[800px] min-h-[1130px] p-10"
        } bg-white text-slate-900 shadow-2xl rounded-xl flex flex-col justify-between relative border border-slate-200 select-text ${
          isLandscape ? "landscape-doc" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
