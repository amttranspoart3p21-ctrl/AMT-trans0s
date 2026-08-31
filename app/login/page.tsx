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
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect straight to dashboard
    if (isAppAuthenticated()) {
      router.replace("/dashboard");
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
      setIsSubmitting(true);
      setAppAuthenticated(true);
      setTimeout(() => {
        router.replace("/dashboard");
      }, 300);
    } else {
      setErrorMsg("Invalid administrative password. Please try again.");
    }
  };

  const handleQuickFill = () => {
    const storedPassword = getStoredPassword();
    setPassword(storedPassword);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen w-screen bg-[#0E1117] text-[#F0F6FC] flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Ambient background glow & grid pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-[#161B22]/90 border border-[#30363D] rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center z-10 animate-fade-in">
        {/* Status Chip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800/50 text-sky-400 text-[10px] font-mono font-black uppercase tracking-widest mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          <span>TMS ENTERPRISE CONSOLE</span>
        </div>

        {/* Company Branding Logo */}
        <div className="mb-4 flex items-center justify-center relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-2xl blur-sm opacity-30 group-hover:opacity-60 transition duration-300" />
          {company.logo ? (
            <img
              src={company.logo}
              alt="Company Logo"
              className="relative h-16 w-16 object-contain rounded-2xl border border-[#30363D] shadow-xl bg-[#0D1117] p-1.5"
            />
          ) : (
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-xl">
              {company.companyName ? company.companyName.charAt(0).toUpperCase() : "T"}
            </div>
          )}
        </div>

        {/* Company Name & Tagline */}
        <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white truncate max-w-full">
          {company.companyName || DEFAULT_COMPANY_SETTINGS.companyName}
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1 mb-6">
          Logistics & Fleet Operations System
        </p>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#30363D] to-transparent mb-6" />

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Administrative Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>

              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg("");
                }}
                placeholder="Enter password"
                className="w-full h-[42px] bg-[#0D1117] border border-[#30363D] text-slate-100 text-xs font-bold rounded-xl pl-10 pr-10 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs font-bold text-left animate-shake">
              <svg className="h-4 w-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[42px] bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-950/50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
            <span>{isSubmitting ? "AUTHENTICATING..." : "UNLOCK CONSOLE"}</span>
          </button>
        </form>

        {/* Quick Demo Autofill Hint */}
        <div className="mt-6 pt-4 border-t border-[#30363D] w-full flex items-center justify-between text-[11px] text-slate-500">
          <span>Default: <strong className="font-mono text-slate-400">admin123</strong></span>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-sky-400 hover:text-sky-300 font-bold transition-colors cursor-pointer hover:underline"
          >
            Auto-fill
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono">
        <span>TMS transOS</span>
        <span>•</span>
        <span>Enterprise Logistics Platform</span>
        <span>•</span>
        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">v2.4.0</span>
      </div>
    </div>
  );
}
