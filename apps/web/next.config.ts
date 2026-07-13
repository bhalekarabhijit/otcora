import type { NextConfig } from "next";

export function buildSecurityHeaders(environment: string | undefined) {
  const scriptSources = [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    ...(environment === "development" ? ["'unsafe-eval'"] : []),
    "https://www.googletagmanager.com"
  ].join(" ");

  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        scriptSources,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://www.google-analytics.com",
        "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'"
      ].join("; ")
    },
    ...(environment === "production"
      ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
      : [])
  ];
}

const securityHeaders = buildSecurityHeaders(process.env.NODE_ENV);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@otcora/core", "@otcora/ui"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  }
};

export default nextConfig;
