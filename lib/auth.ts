import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "./db";
import { createServerSupabaseClient } from "./supabase/server";

export type UserRole = "OWNER" | "CARETAKER" | "ADMIN";

// Resolved lazily — never throw at module load time (breaks Vercel static generation)
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[PawLink] FATAL: JWT_SECRET env var is not set. " +
        "Go to Vercel → Project Settings → Environment Variables and add JWT_SECRET."
      );
    }
    return "dev_only_jwt_secret_NOT_FOR_PRODUCTION";
  }
  return secret;
}

const COOKIE_NAME = "pawlink_session";


export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  phone?: string | null;
  authUserId?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // Increased to cost 12
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export const ADMIN_EMAILS = [
  "abdulnabi.khaskheli@gmail.com",
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.toLowerCase()] : []),
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function signToken(user: SessionUser): string {
  const role = isAdminEmail(user.email) ? "ADMIN" : user.role;
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      authUserId: user.authUserId,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as SessionUser;
    if (decoded && isAdminEmail(decoded.email)) {
      decoded.role = "ADMIN";
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Resolves current user session supporting both Supabase Auth SSR and PawLink session cookies.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    // 1. Primary: Direct PawLink JWT Session Cookie
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const verified = verifyToken(token);
      if (verified) {
        if (isAdminEmail(verified.email)) {
          verified.role = "ADMIN";
        }
        return verified;
      }
    }

    // 2. Secondary: Supabase Auth SSR (if configured)
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const {
        data: { user: sbUser },
      } = await supabase.auth.getUser();

      if (sbUser && sbUser.email) {
        let appUser = await db.user.findFirst({
          where: {
            OR: [
              { authUserId: sbUser.id },
              { email: sbUser.email.toLowerCase() },
            ],
          },
        });

        const effectiveRole = isAdminEmail(sbUser.email) ? "ADMIN" : "OWNER";

        if (!appUser) {
          appUser = await db.user.create({
            data: {
              authUserId: sbUser.id,
              email: sbUser.email.toLowerCase(),
              name: sbUser.user_metadata?.name || sbUser.email.split("@")[0],
              phone: sbUser.phone || null,
              role: effectiveRole,
              notificationPreference: {
                create: {
                  whatsappEnabled: true,
                  whatsappVerified: false,
                  emailEnabled: true,
                  notificationPhone: sbUser.phone || null,
                },
              },
            },
          });
        }

        return {
          id: appUser.id,
          email: appUser.email,
          name: appUser.name,
          role: isAdminEmail(appUser.email) ? "ADMIN" : appUser.role,
          phone: appUser.phone,
          authUserId: sbUser.id,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && !isAdminEmail(user.email)) {
    throw new Error("FORBIDDEN_ADMIN_REQUIRED");
  }
  return { ...user, role: "ADMIN" };
}


export async function setSessionCookie(user: SessionUser) {
  const token = signToken(user);
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  try {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  } catch {}

  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
