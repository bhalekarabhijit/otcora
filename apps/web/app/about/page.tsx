import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "About Otcora",
  description: "Learn why Otcora exists and how it approaches OTC medicine guidance as educational self-care support.",
  alternates: { canonical: "/about" }
};

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">About</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Otcora makes medicine information easier to discuss.</h1>
        <div className="mt-6 space-y-5 text-base leading-7 text-muted">
          <p>Otcora is an adult educational self-care tool for people who want to understand common over-the-counter options, doctor-only medicine categories, and safety cautions before speaking with a pharmacist or doctor.</p>
          <p>The product is composition first. Instead of overwhelming users with long lists, Otcora shows a few common OTC brand examples for recognition. Prescription information is limited to composition names and never includes brands, prices, strengths, buying links, or instructions to take them.</p>
          <p>The current self-care experience is limited to adults aged 18-64 who are not pregnant or breastfeeding. Serious and clinician-managed symptoms are stopped before medicine results are shown.</p>
          <p>Otcora does not sell medicines, prescribe medicines, diagnose illness, or replace professional care. Its role is to make self-care conversations clearer and safer.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
