// ─────────────────────────────────────────────────────────────────────────────
// TMS transOS — Simple localStorage Settings Helpers
// This is intentionally a dummy/local-only system. No backend, no hashing.
// ─────────────────────────────────────────────────────────────────────────────

/** localStorage key for the dummy password */
export const TMS_PASSWORD_KEY = "tms_password";

/** localStorage key for company information + logo */
export const TMS_COMPANY_SETTINGS_KEY = "tms_company_settings";

/** Initial default password used when none has been set yet */
export const TMS_DEFAULT_PASSWORD = "admin123";

// ── Company Settings ─────────────────────────────────────────────────────────

export interface CompanySettings {
  companyName: string;
  address: string;
  phoneNumber1: string;
  phoneNumber2: string;
  email: string;
  gstin: string;
  /** base64 data URL (e.g. "data:image/png;base64,...") or empty string */
  logo: string;
}

/** Fallback defaults that match the previously hardcoded document values */
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "TMS TRANSOS",
  address: "Plot No. 12, Transport Nagar, Ambur, Tamil Nadu - 635802",
  phoneNumber1: "+91 98765 43210",
  phoneNumber2: "+91 87654 32109",
  email: "billing@tms-transport.com",
  gstin: "33AABCA1234F1Z5",
  logo: "",
};

/**
 * Read saved CompanySettings from localStorage.
 * Returns DEFAULT_COMPANY_SETTINGS if nothing has been saved yet.
 */
export function getCompanySettings(): CompanySettings {
  if (typeof window === "undefined") return DEFAULT_COMPANY_SETTINGS;
  try {
    const raw = localStorage.getItem(TMS_COMPANY_SETTINGS_KEY);
    if (!raw) return DEFAULT_COMPANY_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<CompanySettings>;
    return {
      companyName: parsed.companyName ?? DEFAULT_COMPANY_SETTINGS.companyName,
      address: parsed.address ?? DEFAULT_COMPANY_SETTINGS.address,
      phoneNumber1: parsed.phoneNumber1 ?? DEFAULT_COMPANY_SETTINGS.phoneNumber1,
      phoneNumber2: parsed.phoneNumber2 ?? DEFAULT_COMPANY_SETTINGS.phoneNumber2,
      email: parsed.email ?? DEFAULT_COMPANY_SETTINGS.email,
      gstin: parsed.gstin ?? DEFAULT_COMPANY_SETTINGS.gstin,
      logo: parsed.logo ?? "",
    };
  } catch {
    return DEFAULT_COMPANY_SETTINGS;
  }
}

/**
 * Persist CompanySettings to localStorage.
 */
export function saveCompanySettings(settings: CompanySettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TMS_COMPANY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Error saving company settings to localStorage:", err);
  }
}

// ── Password ─────────────────────────────────────────────────────────────────

/**
 * Read the stored dummy password.
 * Returns TMS_DEFAULT_PASSWORD if none has been set.
 */
export function getStoredPassword(): string {
  if (typeof window === "undefined") return TMS_DEFAULT_PASSWORD;
  try {
    return localStorage.getItem(TMS_PASSWORD_KEY) ?? TMS_DEFAULT_PASSWORD;
  } catch {
    return TMS_DEFAULT_PASSWORD;
  }
}

/**
 * Persist a new dummy password to localStorage.
 */
export function savePassword(newPassword: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TMS_PASSWORD_KEY, newPassword);
  } catch (err) {
    console.error("Error saving password to localStorage:", err);
  }
}

// ── Session Lock / Unlock ───────────────────────────────────────────────────

/** sessionStorage key for current tab authentication flag */
export const TMS_AUTH_KEY = "tms_authenticated";

/**
 * Check if current browser session is unlocked.
 */
export function isAppAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(TMS_AUTH_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Grant authentication for current session.
 */
export function setAppAuthenticated(authenticated: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (authenticated) {
      sessionStorage.setItem(TMS_AUTH_KEY, "true");
    } else {
      sessionStorage.removeItem(TMS_AUTH_KEY);
    }
  } catch (err) {
    console.error("Error setting app authentication state:", err);
  }
}

/**
 * Lock the application by removing session auth flag.
 */
export function lockApp(): void {
  setAppAuthenticated(false);
}

