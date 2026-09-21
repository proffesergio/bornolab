/** Client-safe: membership types + defaults. No fs — importable from Client Components. */

export interface MemberUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  providers: string[]; // e.g. ["otp", "google", "facebook"]
  role: string; // role id (see RoleDef)
  planId: string; // plan id (see PlanDef)
  planStatus: "active" | "trial" | "past_due" | "cancelled" | "none";
  status: "active" | "suspended";
  createdAt: number;
  lastLoginAt: number;
  emailVerified: boolean;
}

export interface PlanDef {
  id: string;
  name: string;
  priceBDT: number; // 0 = Free
  interval: "free" | "monthly" | "yearly" | "lifetime";
  features: string[];
  limits: { pdfMB: number; pdfFiles: number };
  enabled: boolean;
}

export interface RoleDef {
  id: string;
  name: string;
  permissions: string[]; // permission keys (see PERMISSIONS)
  system?: boolean; // system roles cannot be deleted
}

export interface AdUnit {
  id: string;
  name: string;
  slot: "header" | "inFeed" | "footer";
  adSlotId: string; // data-ad-slot from AdSense
  size: string; // e.g. "responsive", "728x90", "300x250"
  enabled: boolean;
}

export interface AuditEntry {
  at: number;
  actor: string; // admin email or "user:<id>"
  action: string; // e.g. "user.update", "plan.create", "auth.login"
  detail?: string;
}

export const PERMISSIONS = [
  "users.view",
  "users.manage",
  "plans.manage",
  "roles.manage",
  "orders.manage",
  "catalog.manage",
  "tools.manage",
  "ads.manage",
  "payments.manage",
  "settings.manage",
] as const;

export const DEFAULT_PLANS: PlanDef[] = [
  {
    id: "free", name: "Free", priceBDT: 0, interval: "free",
    features: ["All free PDF tools", "Standard caps", "Community support"],
    limits: { pdfMB: 15, pdfFiles: 5 }, enabled: true,
  },
  {
    id: "pro", name: "Pro", priceBDT: 199, interval: "monthly",
    features: ["Higher caps (100 MB / 50 files)", "Priority processing", "No announcement bar"],
    limits: { pdfMB: 100, pdfFiles: 50 }, enabled: true,
  },
  {
    id: "studio", name: "Studio", priceBDT: 1999, interval: "yearly",
    features: ["Everything in Pro", "Batch automation", "Invoice billing"],
    limits: { pdfMB: 200, pdfFiles: 100 }, enabled: true,
  },
];

export const DEFAULT_ROLES: RoleDef[] = [
  { id: "admin", name: "Administrator", permissions: [...PERMISSIONS], system: true },
  { id: "manager", name: "Manager", permissions: ["users.view", "users.manage", "orders.manage", "catalog.manage", "tools.manage"], system: true },
  { id: "support", name: "Support", permissions: ["users.view", "orders.manage"], system: true },
  { id: "member", name: "Member", permissions: [], system: true },
];

export interface AuthProviderConfig {
  googleEnabled: boolean;
  facebookEnabled: boolean;
  otpEnabled: boolean;
  magicLinkEnabled: boolean;
  googleClientId: string; // public; secret stays in env GOOGLE_CLIENT_SECRET
  facebookAppId: string; // public; secret stays in env FACEBOOK_APP_SECRET
}

export const DEFAULT_AUTH_CONFIG: AuthProviderConfig = {
  googleEnabled: false,
  facebookEnabled: false,
  otpEnabled: true,
  magicLinkEnabled: true,
  googleClientId: "",
  facebookAppId: "",
};
