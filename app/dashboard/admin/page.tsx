"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
      <p className="text-sm font-bold text-slate-700">Redirecting to Admin Operations Console...</p>
    </div>
  );
}
