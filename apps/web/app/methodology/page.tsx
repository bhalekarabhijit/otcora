import type { Metadata } from "next";
import { AlertTriangle, ListChecks, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "How Otcora Works",
  description: "Understand Otcora's adult-only scope, composition-first results, safety stops, brand examples, and current limitations.",
  alternates: { canonical: "/methodology" }
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">Methodology</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">How Otcora produces safer, clearer results</h1>
        <p className="mt-4 text-sm text-muted">Last updated: July 12, 2026</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <section className="rounded-md border border-line bg-white p-5">
            <ShieldCheck aria-hidden="true" size={22} className="text-care" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Adult-only scope</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Self-care results are limited to adults aged 18-64 who are not pregnant or breastfeeding.</p>
          </section>
          <section className="rounded-md border border-line bg-white p-5">
            <ListChecks aria-hidden="true" size={22} className="text-trust" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Composition first</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Active composition is ranked before a small set of common OTC brand examples.</p>
          </section>
          <section className="rounded-md border border-line bg-white p-5">
            <AlertTriangle aria-hidden="true" size={22} className="text-saffron" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Safety stops</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Urgent or clinician-managed symptoms stop self-care results and direct the user toward professional care.</p>
          </section>
        </div>

        <div className="mt-8 space-y-6 rounded-md border border-line bg-white p-6 text-base leading-7 text-muted shadow-soft">
          <section>
            <h2 className="text-xl font-semibold text-ink">What an OTC result means</h2>
            <p className="mt-2">An OTC composition is an educational self-care category, not a personalized instruction to take a medicine. Suitability still depends on allergies, medical conditions, regular medicines, label directions, and pharmacist advice.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-ink">How brand examples are ordered</h2>
            <p className="mt-2">Otcora shows no more than four adult examples per composition. Recognised names, clean catalog records, single-ingredient products, and common adult forms are preferred. This is an editorial recognition order, not verified national sales data, medical superiority, sponsorship, or endorsement.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-ink">What prescription context means</h2>
            <p className="mt-2">Prescription composition names may appear only to explain which medicine categories require a clinician. Brands, strengths, prices, product links, buying links, and dosing instructions are deliberately withheld.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-ink">Automation and limitations</h2>
            <p className="mt-2">The medical decision path is deterministic and rule based. It does not ask a general-purpose AI model to decide which medicine to show. Catalog information can still be incomplete or outdated, so Otcora keeps the output narrow and encourages pharmacist confirmation.</p>
          </section>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
