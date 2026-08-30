export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUPPORT"
  | "MODERATOR"
  | "ANALYST"
  | "OWNER"
  | "CARETAKER";

export const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SUPPORT",
  "MODERATOR",
  "ANALYST",
];

export type AdminSection =
  | "dashboard"
  | "users"
  | "pets"
  | "tags"
  | "scans"
  | "recovery"
  | "messages"
  | "notifications"
  | "subscriptions"
  | "reports"
  | "analytics"
  | "system"
  | "announcements"
  | "support"
  | "audit"
  | "settings";

export function hasAdminPermission(
  role: string | undefined,
  section: AdminSection,
  isWriteAction: boolean = false
): boolean {
  if (!role) return false;
  const upperRole = role.toUpperCase();

  if (upperRole === "SUPER_ADMIN") return true;

  if (upperRole === "ADMIN") {
    if (section === "settings" && isWriteAction) return false; // Only SUPER_ADMIN can modify critical settings
    return true;
  }

  if (upperRole === "SUPPORT") {
    if (section === "support" || section === "announcements") return true;
    if (section === "users" || section === "pets" || section === "recovery" || section === "dashboard") {
      return !isWriteAction; // Read-only on core data
    }
    return false;
  }

  if (upperRole === "MODERATOR") {
    if (section === "reports" || section === "messages") return true;
    if (section === "scans" || section === "recovery" || section === "dashboard") {
      return !isWriteAction;
    }
    return false;
  }

  if (upperRole === "ANALYST") {
    if (
      section === "dashboard" ||
      section === "analytics" ||
      section === "scans" ||
      section === "recovery" ||
      section === "system"
    ) {
      return !isWriteAction; // Read-only
    }
    return false;
  }

  return false;
}
