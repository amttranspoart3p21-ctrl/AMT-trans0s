"use client";

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout/Layout";
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
  const [activeTab, setActiveTab] = useState<Tab>("password");

  // ── Password Tab State ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangePassword = () => {
    setPasswordError("");
    setPasswordSuccess("");

    const stored = getStoredPassword();

    if (currentPassword !== stored) {
      setPasswordError("Current password is incorrect.");
      return;
    }
    if (newPassword.trim() === "") {
      setPasswordError("New password cannot be empty.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and Confirm New Password do not match.");
      return;
    }

    savePassword(newPassword);
    setPasswordSuccess("Password changed successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // ── Company Information Tab State ────────────────────────────────────────
  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [companySuccess, setCompanySuccess] = useState("");
  const [companyError, setCompanyError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setCompany(getCompanySettings());
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCompanyError("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCompany((prev) => ({ ...prev, logo: dataUrl }));
    };
    reader.readAsDataURL(file);
    // reset file input so same file can be re-selected after removal
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    setCompany((prev) => ({ ...prev, logo: "" }));
  };

  const handleSaveCompany = () => {
    setCompanyError("");
    setCompanySuccess("");

    if (!company.companyName.trim()) {
      setCompanyError("Company / Transport Name is required.");
      return;
    }

    saveCompanySettings(company);
    // Notify same-tab listeners (Layout sidebar) about the settings change.
    // The native "storage" event only fires in OTHER tabs, so we dispatch it manually here.
    window.dispatchEvent(new Event("storage"));
    setCompanySuccess("Company Information saved successfully.");
  };

  const inputClass =
    "w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:ring-1 focus:border-violet-500 focus:ring-violet-500 transition-all";

  const labelClass =
    "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";

  return (
    <Layout>
      <div className="flex-1 flex flex-col p-6 max-w-3xl w-full mx-auto select-none">
        {/* Page Header */}
        <header className="pb-6 border-b border-slate-800 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-400 mt-1 font-medium text-sm">
            Manage password and company information.
          </p>
        </header>

        {/* Tab Bar */}
        <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-1 shadow-lg backdrop-blur-md self-start mb-8">
          <button
            onClick={() => setActiveTab("password")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "password"
                ? "bg-violet-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🔑 Password
          </button>
          <button
            onClick={() => setActiveTab("company")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "company"
                ? "bg-violet-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🏢 Company Information
          </button>
        </div>

        {/* ── PASSWORD TAB ─────────────────────────────────────────────────── */}
        {activeTab === "password" && (
          <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold text-slate-200 mb-1">Change Password</h2>
              <p className="text-xs text-slate-500">
                Update your local access password. The default password is{" "}
                <span className="font-mono text-violet-400">admin123</span>.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Current Password */}
              <div>
                <label className={labelClass}>Current Password</label>
                <input
                  id="setting-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  placeholder="Enter current password"
                  className={inputClass}
                />
              </div>

              {/* New Password */}
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  id="setting-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  placeholder="Enter new password"
                  className={inputClass}
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className={labelClass}>Confirm New Password</label>
                <input
                  id="setting-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  placeholder="Re-enter new password"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Error / Success messages */}
            {passwordError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold">
                <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-emerald-400 text-xs font-semibold">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {passwordSuccess}
              </div>
            )}

            <button
              id="setting-change-password-btn"
              onClick={handleChangePassword}
              className="self-start px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
            </button>
          </section>
        )}

        {/* ── COMPANY INFORMATION TAB ───────────────────────────────────── */}
        {activeTab === "company" && (
          <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-bold text-slate-200 mb-1">Company Information</h2>
              <p className="text-xs text-slate-500">
                This information appears in document headers (Shipment Statement, Tax Invoice, etc.).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="md:col-span-2">
                <label className={labelClass}>Company / Transport Name</label>
                <input
                  id="setting-company-name"
                  type="text"
                  value={company.companyName}
                  onChange={(e) => setCompany((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder="e.g. TMS TRANSOS"
                  className={inputClass}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className={labelClass}>Address</label>
                <textarea
                  id="setting-address"
                  rows={2}
                  value={company.address}
                  onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))}
                  placeholder="e.g, Transport Nagar, Ambur, Tamil Nadu - 635802"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Phone 1 */}
              <div>
                <label className={labelClass}>Phone Number 1</label>
                <input
                  id="setting-phone1"
                  type="text"
                  value={company.phoneNumber1}
                  onChange={(e) => setCompany((p) => ({ ...p, phoneNumber1: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                  className={inputClass}
                />
              </div>

              {/* Phone 2 */}
              <div>
                <label className={labelClass}>Phone Number 2</label>
                <input
                  id="setting-phone2"
                  type="text"
                  value={company.phoneNumber2}
                  onChange={(e) => setCompany((p) => ({ ...p, phoneNumber2: e.target.value }))}
                  placeholder="e.g. +91 87654 32109"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>Email</label>
                <input
                  id="setting-email"
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. billing@tms-transport.com"
                  className={inputClass}
                />
              </div>

              {/* GSTIN */}
              <div>
                <label className={labelClass}>GSTIN</label>
                <input
                  id="setting-gstin"
                  type="text"
                  value={company.gstin}
                  onChange={(e) => setCompany((p) => ({ ...p, gstin: e.target.value }))}
                  placeholder="e.g. 33AABCA1234F1Z5"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className={labelClass}>Company Logo</label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="setting-logo-input"
              />

              <div className="flex items-start gap-4">
                {/* Logo Preview */}
                <div className="h-20 w-20 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center bg-slate-950/60 shrink-0 overflow-hidden">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt="Company Logo Preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold tracking-wider text-center px-1">
                      No Logo
                    </span>
                  )}
                </div>

                {/* Logo Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    id="setting-select-logo-btn"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {company.logo ? "Replace Logo" : "Select Logo"}
                  </button>

                  {company.logo && (
                    <button
                      id="setting-remove-logo-btn"
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 bg-red-950/40 hover:bg-red-900/30 border border-red-900/50 text-red-400 hover:text-red-300 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Logo
                    </button>
                  )}

                  <p className="text-[10px] text-slate-600 leading-normal mt-1">
                    Stored as base64. PNG, JPG, or SVG recommended.
                  </p>
                </div>
              </div>
            </div>

            {/* Error / Success */}
            {companyError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold">
                <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {companyError}
              </div>
            )}
            {companySuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-emerald-400 text-xs font-semibold">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {companySuccess}
              </div>
            )}

            <button
              id="setting-save-company-btn"
              onClick={handleSaveCompany}
              className="self-start px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Company Information
            </button>
          </section>
        )}
      </div>
    </Layout>
  );
}
