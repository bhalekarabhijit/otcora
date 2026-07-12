import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read Otcora's privacy policy for analytics, local storage, contact emails, and health-related inputs.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 22, 2026</p>
        <div className="mt-8 space-y-5 rounded-md border border-line bg-white p-6 text-base leading-7 text-muted shadow-soft">
          <p>Otcora is designed to work without user accounts. The symptom search tool may temporarily store selected symptoms, adult eligibility confirmation, and entered medicine-allergy text in your browser session storage so results can remain available when you navigate back.</p>
          <p>We do not ask for your name, phone number, prescription, or medical records. Do not enter sensitive personal medical information into free-text fields.</p>
          <p>If Google Analytics is enabled, Otcora may collect aggregated usage information such as page views, device type, country-level location, and interaction events. Analytics is used to improve the product and understand whether pages are useful.</p>
          <p>If advertising is enabled in the future, Google and other advertising providers may use cookies, web beacons, IP addresses, or similar identifiers to serve and measure ads. Otcora will not use selected symptoms or medicine-allergy information to create personalized advertising audiences.</p>
          <p>Where consent is required, analytics and advertising cookies will remain disabled until the user makes a choice. You can learn how Google uses information from partner sites at <a href="https://policies.google.com/technologies/partner-sites" className="font-medium text-trust hover:text-ink">Google's partner-sites policy</a>.</p>
          <p>If you email us, we receive your email address and message content so we can respond. We do not sell personal information.</p>
          <p>Otcora may update this policy as the product changes. Material updates will be reflected on this page.</p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
