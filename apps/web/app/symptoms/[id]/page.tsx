import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../../components/site-shell";
import { siteUrl, symptomsForSeo } from "../../../lib/site";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return symptomsForSeo.map((symptom) => ({ id: symptom.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const symptom = symptomsForSeo.find((item) => item.id === id);
  if (!symptom) {
    return { title: "Symptom guide" };
  }
  return {
    title: symptom.title + " OTC Medicine Guide",
    description: symptom.description,
    keywords: [...symptom.keywords],
    alternates: { canonical: "/symptoms/" + symptom.id },
    openGraph: {
      title: symptom.title + " OTC Medicine Guide",
      description: symptom.description,
      url: siteUrl + "/symptoms/" + symptom.id
    }
  };
}

export default async function SymptomSeoPage({ params }: PageProps) {
  const { id } = await params;
  const symptom = symptomsForSeo.find((item) => item.id === id);
  if (!symptom) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">Symptom guide</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">{symptom.title} OTC medicine guide</h1>
        <p className="mt-5 text-lg leading-8 text-muted">{symptom.description}</p>
        <div className="mt-8 rounded-md border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">How to use Otcora for {symptom.title.toLowerCase()}</h2>
          <p className="mt-3 text-base leading-7 text-muted">
            Search for {symptom.title.toLowerCase()} in the Otcora symptom tool, review OTC compositions first, and keep prescription results separate. Use the medicine examples as educational information and confirm suitability, dose, and duration with a pharmacist or doctor.
          </p>
          <Link href={"/?symptom=" + symptom.id} className="mt-5 inline-flex items-center gap-2 rounded-md bg-trust px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink">
            <Search aria-hidden="true" size={17} />
            Open symptom search
          </Link>
        </div>
        <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-saffron">
            <AlertTriangle aria-hidden="true" size={19} />
            Red flags to review first
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
            {symptom.redFlags.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
