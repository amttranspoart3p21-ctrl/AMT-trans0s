"use client";

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout/Layout";
import Input from "@/components/ui/Input";
import { useAppSelector } from "@/store/hooks";
import {
  getCompanySettings,
  saveCompanySettings,
  getStoredPassword,
  savePassword,
  DEFAULT_COMPANY_SETTINGS,
  type CompanySettings,
} from "@/utils/settings";

type Tab = "password" | "company";

export default function SettingsPage() {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const [activeTab, setActiveTab] = useState<Tab>("password");

  // ── Password Tab State ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // ── Company Information Tab State ────────────────────────────────────────
  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [companyError, setCompanyError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Toast Notification State ─────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setCompany(getCompanySettings());
  }, []);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    const stored = getStoredPassword();

    if (currentPassword !== stored) {
      setPasswordError("Current password is incorrect.");
      return;
    }
    if (newPassword.trim() === "") {
      setPasswordError("New password cannot be empty.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and Confirm New Password do not match.");
      return;
    }

    savePassword(newPassword);
    showToast("Administrative password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCompanyError("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setCompanyError("Image file size should be less than 2MB.");
      return;
    }

    setCompanyError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCompany((prev) => ({ ...prev, logo: dataUrl }));
      showToast("Logo preview loaded! Click save to apply changes.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    setCompany((prev) => ({ ...prev, logo: "" }));
    showToast("Logo removed from configuration.");
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError("");

    if (!company.companyName.trim()) {
      setCompanyError("Company / Transport Name is required.");
      return;
    }

    saveCompanySettings(company);
    // Notify other components/tabs
    window.dispatchEvent(new Event("storage"));
    showToast("Enterprise profile & branding saved successfully!");
  };

  return (
    <Layout>
      <div
        className="h-full flex-1 flex flex-col p-5 md:p-6 w-full mx-auto relative select-none overflow-hidden transition-colors duration-300"
        style={isDarkMode ? { background: "#18191A" } : { background: "#F0F7FF" }}
      >
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 transition-all animate-bounce ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/90 border-rose-500/50 text-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Header Bar with Segmented Tab Switcher */}
        <div className="shrink-0 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                System & Enterprise Settings
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 ml-9.5">
              Manage system authentication, enterprise entity profile, and document header branding.
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 shadow-2xs shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "password"
                  ? "bg-sky-600 dark:bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>Security & Password</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("company")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === "company"
                  ? "bg-sky-600 dark:bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              <span>Company & Branding</span>
            </button>
          </div>
        </div>

        {/* Main Content Area (Scrollable container) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
          {/* ============================================================
              TAB 1: SECURITY & PASSWORD
              ============================================================ */}
          {activeTab === "password" && (
            <div className="max-w-xl mx-auto flex flex-col gap-4 select-none">
              {/* Context Information Card */}
              <div
                className="rounded-2xl p-5 border shadow-xs flex items-center justify-between gap-4"
                style={{
                  background: isDarkMode ? "#242526" : "#FFFFFF",
                  borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                      Local Administrative Access
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Default initial master password: <span className="font-mono font-bold text-sky-600 dark:text-sky-400">admin123</span>
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 shrink-0">
                  SECURE
                </span>
              </div>

              {/* Password Form Card */}
              <div
                className="rounded-2xl p-6 border shadow-xs flex flex-col gap-5"
                style={{
                  background: isDarkMode ? "#242526" : "#FFFFFF",
                  borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                }}
              >
                <div className="border-b pb-3" style={{ borderColor: isDarkMode ? "#30363D" : "#E2E8F0" }}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                    Change Password
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Enter your current password followed by your new password to update system credentials.
                  </p>
                </div>

                {passwordError && (
                  <div
                    className="rounded-xl p-3 text-xs font-semibold flex items-center gap-2 border"
                    style={
                      isDarkMode
                        ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#FCA5A5" }
                        : { background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }
                    }
                  >
                    <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  {/* Current Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      Current Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="setting-current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Enter current password"
                        className={`w-full h-[42px] text-xs font-bold rounded-xl px-3.5 pr-10 outline-none border transition-all ${
                          isDarkMode
                            ? "bg-[#121314] hover:bg-[#21262D]/50 focus:bg-[#121314] border-zinc-700/80 focus:border-sky-500 text-zinc-100 placeholder:text-zinc-500"
                            : "bg-white hover:bg-slate-50 focus:bg-white border-slate-300 focus:border-sky-500 text-slate-800 placeholder:text-slate-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? (
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

                  {/* New Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="setting-new-password"
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Enter minimum 6 characters"
                        className={`w-full h-[42px] text-xs font-bold rounded-xl px-3.5 pr-10 outline-none border transition-all ${
                          isDarkMode
                            ? "bg-[#121314] hover:bg-[#21262D]/50 focus:bg-[#121314] border-zinc-700/80 focus:border-sky-500 text-zinc-100 placeholder:text-zinc-500"
                            : "bg-white hover:bg-slate-50 focus:bg-white border-slate-300 focus:border-sky-500 text-slate-800 placeholder:text-slate-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? (
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

                  {/* Confirm New Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="setting-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Re-enter new password"
                        className={`w-full h-[42px] text-xs font-bold rounded-xl px-3.5 pr-10 outline-none border transition-all ${
                          isDarkMode
                            ? "bg-[#121314] hover:bg-[#21262D]/50 focus:bg-[#121314] border-zinc-700/80 focus:border-sky-500 text-zinc-100 placeholder:text-zinc-500"
                            : "bg-white hover:bg-slate-50 focus:bg-white border-slate-300 focus:border-sky-500 text-slate-800 placeholder:text-slate-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
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

                  <button
                    id="setting-change-password-btn"
                    type="submit"
                    className="mt-2 flex items-center justify-center gap-2 py-2.5 px-5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span>Update Access Password</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 2: COMPANY & BRANDING
              ============================================================ */}
          {activeTab === "company" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-5 select-none">
              <form onSubmit={handleSaveCompany} className="flex flex-col gap-5">
                {companyError && (
                  <div
                    className="rounded-xl p-3 text-xs font-semibold flex items-center gap-2 border"
                    style={
                      isDarkMode
                        ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#FCA5A5" }
                        : { background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }
                    }
                  >
                    <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{companyError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Form Inputs (7 cols) */}
                  <div
                    className="lg:col-span-7 rounded-2xl p-5 md:p-6 border shadow-xs flex flex-col gap-4"
                    style={{
                      background: isDarkMode ? "#242526" : "#FFFFFF",
                      borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                    }}
                  >
                    <div className="border-b pb-3" style={{ borderColor: isDarkMode ? "#30363D" : "#E2E8F0" }}>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                        Enterprise Profile
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        These details populate document headers across Shipment Statements and Invoices.
                      </p>
                    </div>

                    {/* Company Name */}
                    <Input
                      id="setting-company-name"
                      label="Company / Transport Name *"
                      type="text"
                      value={company.companyName}
                      onChange={(e) => setCompany((p) => ({ ...p, companyName: e.target.value }))}
                      placeholder="e.g. TMS TRANSOS LOGISTICS"
                    />

                    {/* GSTIN & Email in 2 columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        id="setting-gstin"
                        label="GSTIN / Tax ID"
                        type="text"
                        value={company.gstin}
                        onChange={(e) => setCompany((p) => ({ ...p, gstin: e.target.value }))}
                        placeholder="e.g. 33AABCA1234F1Z5"
                        className="font-mono uppercase"
                      />

                      <Input
                        id="setting-email"
                        label="Billing Email"
                        type="email"
                        value={company.email}
                        onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))}
                        placeholder="e.g. billing@tms-transos.com"
                      />
                    </div>

                    {/* Phone 1 & Phone 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        id="setting-phone1"
                        label="Primary Contact Number"
                        type="text"
                        value={company.phoneNumber1}
                        onChange={(e) => setCompany((p) => ({ ...p, phoneNumber1: e.target.value }))}
                        placeholder="e.g. +91 98765 43210"
                      />

                      <Input
                        id="setting-phone2"
                        label="Secondary Contact Number"
                        type="text"
                        value={company.phoneNumber2}
                        onChange={(e) => setCompany((p) => ({ ...p, phoneNumber2: e.target.value }))}
                        placeholder="e.g. +91 87654 32109"
                      />
                    </div>

                    {/* Address Textarea */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="setting-address" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                        Corporate Headquarters Address
                      </label>
                      <textarea
                        id="setting-address"
                        rows={2}
                        value={company.address}
                        onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))}
                        placeholder="e.g. Transport Nagar, Ambur, Tamil Nadu - 635802"
                        className={`w-full text-xs font-bold rounded-xl p-3 outline-none border transition-all resize-none ${
                          isDarkMode
                            ? "bg-[#121314] hover:bg-[#21262D]/50 focus:bg-[#121314] border-zinc-700/80 focus:border-sky-500 text-zinc-100 placeholder:text-zinc-500"
                            : "bg-white hover:bg-slate-50 focus:bg-white border-slate-300 focus:border-sky-500 text-slate-800 placeholder:text-slate-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Right Column: Logo & Live Document Preview (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Logo Management Card */}
                    <div
                      className="rounded-2xl p-5 border shadow-xs flex flex-col gap-3.5"
                      style={{
                        background: isDarkMode ? "#242526" : "#FFFFFF",
                        borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                          Company Logo
                        </h3>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">Max 2MB</span>
                      </div>

                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="setting-logo-input"
                      />

                      <div className="flex items-center gap-3.5">
                        {/* Logo Preview Container */}
                        <div
                          onClick={() => logoInputRef.current?.click()}
                          className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 overflow-hidden cursor-pointer transition-all hover:opacity-85"
                          style={{
                            background: isDarkMode ? "#121314" : "#F8FAFC",
                            borderColor: company.logo
                              ? isDarkMode ? "#38BDF8" : "#0284C7"
                              : isDarkMode ? "#30363D" : "#CBD5E1",
                          }}
                        >
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt="Company Logo"
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-zinc-500">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                              <span className="text-[9px] font-bold">No Logo</span>
                            </div>
                          )}
                        </div>

                        {/* Logo Actions */}
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <button
                            id="setting-select-logo-btn"
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <svg className="h-3.5 w-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <span>{company.logo ? "Replace Logo" : "Upload Logo"}</span>
                          </button>

                          {company.logo && (
                            <button
                              id="setting-remove-logo-btn"
                              type="button"
                              onClick={handleRemoveLogo}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold cursor-pointer transition-all border border-rose-200 dark:border-rose-800/40 flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                              <span>Remove Logo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Document Header Live Preview Banner */}
                    <div
                      className="rounded-2xl p-4 border shadow-xs flex flex-col gap-2.5"
                      style={{
                        background: isDarkMode ? "#1F2021" : "#F8FAFC",
                        borderColor: isDarkMode ? "#30363D" : "#E2E8F0",
                      }}
                    >
                      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: isDarkMode ? "#30363D" : "#E2E8F0" }}>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                          Document Header Preview
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40">
                          LIVE PREVIEW
                        </span>
                      </div>

                      <div className="flex items-start gap-3 pt-1">
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt="Logo"
                            className="h-10 w-10 object-contain rounded shrink-0 bg-white p-0.5 border border-slate-200 dark:border-zinc-700"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-sky-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {company.companyName.charAt(0) || "T"}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100 truncate">
                            {company.companyName || "COMPANY NAME"}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                            {company.address || "Address details will appear here"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[9.5px] text-slate-400 dark:text-zinc-500 font-mono mt-1">
                            {company.phoneNumber1 && <span>Ph: {company.phoneNumber1}</span>}
                            {company.gstin && <span>GST: {company.gstin}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button Row */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    id="setting-save-company-btn"
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Save Enterprise Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
