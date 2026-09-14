"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user) {
          router.replace("/auth/login?mode=admin2fa");
          return;
        }
        const adminEmails = [
          "abdulnabi.khaskhely@gmail.com",
          "khaskheli.abdulnabi110@gmail.com",
          "abdulnabi.khaskheli@gmail.com",
          "admin@pawlink.pet",
        ];
        const isEmailAdmin = adminEmails.includes(data.user.email?.toLowerCase());
        const isAdminRole =
          ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR", "ANALYST"].includes(data.user.role) ||
          isEmailAdmin;

        if (isAdminRole) {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        router.replace("/dashboard");
      });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
      <p className="text-sm font-bold text-slate-700">Verifying administrative access...</p>
    </div>
  );
}
