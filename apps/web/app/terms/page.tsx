import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Read the terms and conditions for using Otcora's educational medicine guidance tool.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 22, 2026</p>
        <div className="mt-8 space-y-5 rounded-md border border-line bg-white p-6 text-base leading-7 text-muted shadow-soft">
          <p>Otcora provides educational information about symptoms, over-the-counter medicine categories, prescription-only medicine categories, and safety cautions. It is not a medical service.</p>
          <p>You agree not to use Otcora as a substitute for professional medical advice, diagnosis, treatment, emergency care, or pharmacist consultation. Always follow medicine labels and local regulations.</p>
          <p>Information can be incomplete, outdated, or unsuitable for your personal situation. Medicine suitability depends on age, weight, pregnancy status, allergies, other medicines, medical history, and clinician judgment.</p>
          <p>Otcora may change, remove, or improve features and content at any time. Continued use of the website means you accept the current terms.</p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
