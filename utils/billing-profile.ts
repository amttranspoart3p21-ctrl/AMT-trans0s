export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  ifscCode: string;
}

export interface BillingProfile {
  id: string;
  profileName: string;
  companyName?: string;
  address?: string;
  contactNo?: string;
  gstin?: string;
  hsnCode?: string;
  bankDetails?: BankDetails;
  updatedAt: string;
}

const STORAGE_KEY = "tms_billing_profiles";

export function getSavedBillingProfiles(): BillingProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading saved billing profiles from localStorage:", err);
    return [];
  }
}

export function saveBillingProfile(profile: Omit<BillingProfile, "id" | "updatedAt"> & { id?: string }): BillingProfile {
  const existing = getSavedBillingProfiles();
  const now = new Date().toISOString();

  let targetId = profile.id;
  if (!targetId) {
    targetId = `BP-${Date.now()}`;
  }

  const newProfile: BillingProfile = {
    ...profile,
    id: targetId,
    updatedAt: now,
  };

  const index = existing.findIndex((p) => p.id === targetId || p.profileName.toLowerCase() === profile.profileName.toLowerCase());
  if (index >= 0) {
    existing[index] = newProfile;
  } else {
    existing.push(newProfile);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error("Error saving billing profile to localStorage:", err);
  }

  return newProfile;
}

export function deleteBillingProfile(id: string): void {
  const existing = getSavedBillingProfiles();
  const filtered = existing.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error("Error deleting billing profile from localStorage:", err);
  }
}
