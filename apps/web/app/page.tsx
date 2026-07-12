import type { Metadata } from "next";
import { ArrowRight, BookOpen, ShieldCheck, Stethoscope } from "lucide-react";
import Link from "next/link";
import { SymptomConsole } from "../components/symptom-console";
import { SiteFooter, SiteHeader } from "../components/site-shell";

export const metadata: Metadata = {
  title: "OTC Medicine Guidance by Symptom",
  description: "Use Otcora to explore adult OTC medicine compositions, common brand examples, prescription-only context, and safety cautions.",
  alternates: { canonical: "/" }
};

const faqItems = [
  ["Can Otcora prescribe medicine?", "No. Otcora is educational and does not prescribe, diagnose, or replace a doctor or pharmacist."],
  ["Why are prescription names shown?", "Composition names are separated as doctor-only context. Otcora does not show prescription brands, prices, strengths, buying links, or instructions to take them."],
  ["When should I seek urgent care?", "Severe symptoms such as breathing difficulty, chest pain, confusion, dehydration, blood in stool, or persistent high fever need medical review."],
  ["Who can use the self-care tool?", "The current version is limited to adults aged 18-64 who are not pregnant or breastfeeding. Everyone else should ask a pharmacist or doctor."]
];

const guideCards = [
  { title: "Fever medicine guide", copy: "Understand common OTC fever support and red flags.", href: "/symptoms/fever" },
  { title: "Cough medicine guide", copy: "Compare dry cough, wet cough, and congestion choices.", href: "/symptoms/cough" },
  { title: "OTC vs prescription", copy: "Learn why some medicines should not be self-started.", href: "/guides/otc-vs-prescription-medicines" }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-6 lg:sticky lg:top-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-trust">
            <Stethoscope aria-hidden="true" size={17} />
            Educational self-care support
          </div>
          <div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-6xl">
              Understand sensible adult OTC options from your symptoms.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Start with a symptom, see active compositions before common brand examples, and keep doctor-only medicine context clearly separate.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["OTC first", "Self-care options are prioritized."],
              ["Rx context only", "No prescription brands or buying links."],
              ["Safety-led", "Red flags point users to care."]
            ].map(([title, copy]) => (
              <div key={title} className="rounded-md border border-line bg-white/80 p-4">
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm leading-5 text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <SymptomConsole />
      </section>

      <section className="border-y border-line bg-surface/80 px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="how-otcora-helps">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            ["Composition first", "See active ingredients before brand examples."],
            ["Prescription separated", "Only composition names appear as doctor-only context."],
            ["Safety visible", "Red flags and disclaimers are kept close to results."]
          ].map(([title, copy]) => (
            <article key={title} className="rounded-md border border-line bg-white p-5">
              <p className="text-base font-semibold text-ink">{title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8" aria-label="Popular symptom guides">
        {guideCards.map(({ title, copy, href }) => (
          <Link key={href} href={href} className="group rounded-md border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-trust">
            <BookOpen aria-hidden="true" size={20} className="text-trust" />
            <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-trust">
              Read guide <ArrowRight aria-hidden="true" size={15} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8" aria-labelledby="faq">
        <div className="rounded-md border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" size={19} className="text-care" />
            <h2 id="faq" className="text-2xl font-semibold text-ink">Frequently asked questions</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {faqItems.map(([question, answer]) => (
              <article key={question} className="rounded-md border border-line bg-surface p-4">
                <h3 className="text-base font-semibold text-ink">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
