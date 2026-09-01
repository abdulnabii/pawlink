import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pawlink-chi.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/", "/auth/login", "/auth/register"],
        disallow: ["/dashboard/", "/admin/", "/api/", "/c/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
