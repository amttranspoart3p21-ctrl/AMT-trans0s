"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAppAuthenticated } from "@/utils/settings";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    if (pathname !== "/login") {
      if (!isAppAuthenticated()) {
        router.replace("/login");
      } else {
        setIsAuthChecked(true);
      }
    } else {
      setIsAuthChecked(true);
    }
  }, [pathname, router]);

  if (!isAuthChecked && pathname !== "/login") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F0F7FF] dark:bg-[#0b0f19]">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <svg className="animate-spin h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Verifying session security...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
