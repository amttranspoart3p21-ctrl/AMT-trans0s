"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getCompanySettings,
  getStoredPassword,
  setAppAuthenticated,
  isAppAuthenticated,
  DEFAULT_COMPANY_SETTINGS,
  type CompanySettings,
} from "@/utils/settings";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);

  useEffect(() => {
    // If already authenticated, redirect straight to dashboard
    if (isAppAuthenticated()) {
      router.replace("/");
      return;
    }
    // Load company settings for branding
    setCompany(getCompanySettings());
  }, [router]);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const storedPassword = getStoredPassword();
    if (password === storedPassword) {
      setAppAuthenticated(true);
      router.replace("/");
    } else {
      setErrorMsg("Incorrect password.");
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#070b13] text-[#f3f4f6] flex items-center justify-center p-4 select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        {/* Company Branding Logo */}
        <div className="mb-4 flex items-center justify-center">
          {company.logo ? (
            <img
              src={company.logo}
              alt="Company Logo"
              className="h-16 w-16 object-contain rounded-2xl border border-slate-800 shadow-lg bg-slate-950 p-1"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-xl shadow-violet-900/40">
              ts
            </div>
          )}
        </div>

        {/* Company Name */}
        <h1 className="text-xl font-black text-slate-100 tracking-tight mb-1">
          {company.companyName || DEFAULT_COMPANY_SETTINGS.companyName}
        </h1>
        <p className="text-xs text-slate-400 font-medium mb-6">
          Transport Management System
        </p>

        <div className="w-full h-px bg-slate-800/80 mb-6" />

        {/* Lock Status Header */}
        <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-full text-slate-400 text-xs font-semibold">
          <svg className="h-3.5 w-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>APP LOCKED</span>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Enter your password to continue
        </p>

        {/* Form */}
        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
          <div>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg("");
              }}
              placeholder="Enter password"
              className="w-full bg-slate-950/90 border border-slate-800 text-slate-100 text-center text-sm font-mono tracking-widest rounded-xl px-4 py-3 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-600"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center justify-center gap-1.5 p-2.5 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold animate-in fade-in duration-150">
              <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span>UNLOCK</span>
          </button>
        </form>
      </div>
    </div>
  );
}
