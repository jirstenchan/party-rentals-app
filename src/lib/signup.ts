// Keep this notice and version aligned with the website's signup agreement.
export const LEGAL_VERSION = "2026-01";
export const COLLECTION_NOTICE =
  "We collect your name, email and date of birth, and ask for a photo of a government or student ID when you verify. We use these to confirm users are real and of legal age. Only the Party Link admin team reviews ID photos. ID photos are deleted right after review. To ask for deletion, contact privacy@example.invalid (project placeholder; contact address to be updated).";

export type SignupDetails = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  agreed: boolean;
};

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

// Match the website's UTC calendar-date comparison, including leap birthdays.
export function isAdult(dateOfBirth: string, today = new Date()): boolean {
  if (!isValidDate(dateOfBirth)) return false;
  const cutoff = `${today.getUTCFullYear() - 18}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  return dateOfBirth <= cutoff;
}

export function getSignupError(details: SignupDetails): string {
  if (!details.fullName.trim()) return "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()))
    return "Enter a valid email.";
  if (!isValidDate(details.dateOfBirth)) return "Enter a valid date of birth.";
  if (!isAdult(details.dateOfBirth))
    return "You must be 18 or older to join Party Link.";
  if (details.password.length < 8)
    return "Use at least 8 characters for your password.";
  if (details.password !== details.confirmPassword)
    return "Passwords don't match.";
  if (!details.agreed)
    return "Accept the data collection notice, terms and privacy notice to continue.";
  return "";
}

export function getSignupMetadata(details: SignupDetails) {
  return {
    name: details.fullName.trim(),
    full_name: details.fullName.trim(),
    date_of_birth: details.dateOfBirth,
    accept_terms: details.agreed,
    consent_version: LEGAL_VERSION,
  };
}
