import type { Metadata } from "next";
import { FileText, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "../../../components/site-shell";

export const metadata: Metadata = {
  title: "OTC vs Prescription Medicines",
  description: "Learn the difference between over-the-counter medicines and prescription medicines, and when self-care is not enough.",
  alternates: { canonical: "/guides/otc-vs-prescription-medicines" }
};

export default function OtcVsPrescriptionGuidePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">Guide</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">OTC vs prescription medicines: what changes?</h1>
        <p className="mt-5 text-lg leading-8 text-muted">Over-the-counter medicines are generally used for short-term self-care when symptoms are mild and familiar. Prescription medicines need a clinician because the condition, dose, side effects, interactions, or monitoring requirements can be more serious.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-md border border-line bg-white p-5">
            <ShieldCheck aria-hidden="true" size={22} className="text-care" />
            <h2 className="mt-4 text-xl font-semibold text-ink">OTC self-care</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Common examples include simple fever support, some allergy medicines, antacids, oral rehydration salts, and selected cough or cold products. Even OTC medicines can be unsafe for some people.</p>
          </section>
          <section className="rounded-md border border-line bg-white p-5">
            <FileText aria-hidden="true" size={22} className="text-saffron" />
            <h2 className="mt-4 text-xl font-semibold text-ink">Prescription-only care</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Antibiotics, many heart medicines, diabetes medicines, mental health medicines, and several pain medicines should not be self-started. They need diagnosis, dose selection, and monitoring.</p>
          </section>
        </div>
        <div className="mt-8 space-y-5 rounded-md border border-line bg-white p-6 text-base leading-7 text-muted shadow-soft">
          <p>Otcora separates these categories so users can avoid treating every medicine result as a shopping suggestion. If a medicine appears under prescription results, that is a signal to talk with a qualified clinician.</p>
          <p>Self-care is usually most appropriate when the symptom is mild, short-lived, familiar, and not associated with warning signs. New, severe, persistent, or unusual symptoms deserve medical review.</p>
          <p>Otcora's current self-care tool is limited to adults aged 18-64 who are not pregnant or breastfeeding. Children, older adults, pregnant or breastfeeding people, people with chronic disease, and anyone taking multiple medicines should ask a pharmacist or doctor.</p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
