export interface PricingPlan {
  id: "FREE" | "PLUS" | "PRO";
  name: string;
  tagline: string;
  pricePKR: number;
  period: string;
  badge: string;
  isPopular?: boolean;
  features: string[];
  limits: {
    maxPets: number;
    whatsAppAlerts: boolean;
    liveMap: boolean;
    inAppChat: boolean;
  };
}

export const BANK_PAYMENT_CONFIG = {
  bankName: "Meezan Bank",
  accountTitle: "ABDUL NABI",
  raastOrAccountRef: "ABDUL NABI-9601",
  adminEmail: "abdulnabi.khaskheli@gmail.com",
  qrCodeUrl: "/images/meezan-qr.png",
  instructions:
    "Scan the Meezan Bank QR code using any banking or microfinance app (Meezan Bank App, Raast, Easypaisa, JazzCash, NayaPay, SadaPay, or 1Link mobile banking) to send the plan fee. Submit your Transaction ID / Reference below or email your receipt to abdulnabi.khaskheli@gmail.com.",
};

export const PLANS: PricingPlan[] = [
  {
    id: "FREE",
    name: "Basic ID",
    tagline: "Essential digital pet tag",
    pricePKR: 0,
    period: "forever",
    badge: "Free",
    features: [
      "1 Pet Profile & QR Tag",
      "Instant Scan Recovery Page",
      "Email Scan Alerts",
      "GPS Location Sharing",
    ],
    limits: { maxPets: 1, whatsAppAlerts: true, liveMap: true, inAppChat: true },
  },
  {
    id: "PLUS",
    name: "Plus Recovery",
    tagline: "Complete multi-pet recovery pack",
    pricePKR: 1499,
    period: "month",
    isPopular: true,
    badge: "Plus Member",
    features: [
      "Up to 5 Pet Profiles",
      "Instant WhatsApp Scan Alerts",
      "Interactive Leaflet Scan Map",
      "Emergency Lost Mode & Reward Banner",
      "Anonymous In-App Finder Chat",
    ],
    limits: { maxPets: 5, whatsAppAlerts: true, liveMap: true, inAppChat: true },
  },
  {
    id: "PRO",
    name: "Pro Household",
    tagline: "Unlimited pets & caretakers",
    pricePKR: 2999,
    period: "month",
    badge: "Pro Member",
    features: [
      "Unlimited Pets & Tags",
      "Caretaker & Family Delegation",
      "Digital Pet Passport & Medical Alerts",
      "Priority Notification Dispatch",
      "24/7 Dedicated Lost Mode Radar",
    ],
    limits: { maxPets: 999, whatsAppAlerts: true, liveMap: true, inAppChat: true },
  },
];
