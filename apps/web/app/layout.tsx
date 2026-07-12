import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://otcora.com";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Otcora",
  title: {
    default: "Otcora | OTC Medicine Guidance by Symptom",
    template: "%s | Otcora"
  },
  description: "Search symptoms and understand sensible OTC medicine options, prescription-only medicines, and safety cautions for educational self-care decisions.",
  keywords: [
    "OTC medicines",
    "over the counter medicines",
    "medicine by symptom",
    "fever medicine",
    "cough medicine",
    "OTC guidance India",
    "prescription medicine information"
  ],
  authors: [{ name: "Otcora" }],
  creator: "Otcora",
  publisher: "Otcora",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Otcora",
    title: "Otcora | OTC Medicine Guidance by Symptom",
    description: "Understand OTC-first medicine options, prescription separation, and safety cautions from symptoms.",
    locale: "en_IN"
  },
  twitter: {
    card: "summary",
    title: "Otcora | OTC Medicine Guidance by Symptom",
    description: "Search symptoms and understand OTC-first medicine options with safety cautions."
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#101918" }
  ]
};

const themeScript = [
  "(() => {",
  "  try {",
  "    const saved = window.localStorage.getItem('otcora.theme');",
  "    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;",
  "    if (saved === 'dark' || (!saved && prefersDark)) {",
  "      document.documentElement.classList.add('dark');",
  "    }",
  "  } catch (_) {}",
  "})();"
].join("\n");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {gaId ? (
          <>
            <Script src={"https://www.googletagmanager.com/gtag/js?id=" + gaId} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {"window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '" + gaId + "');"}
            </Script>
          </>
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
