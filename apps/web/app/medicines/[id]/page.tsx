import { getMedicineById } from "@otcora/core";
import type { Metadata } from "next";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../../components/site-shell";
import { isPublicOtcMedicine } from "../../../lib/public-medicine";
import { siteUrl } from "../../../lib/site";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const medicine = getMedicineById(id);
  if (!medicine || !isPublicOtcMedicine(medicine)) {
    return {
      title: "Medicine information",
      robots: { index: false, follow: false }
    };
  }
  return {
    title: medicine.name + " Medicine Information",
    description: "Educational information for " + medicine.name + ", including composition, OTC or prescription status, and safety cautions.",
    alternates: { canonical: siteUrl + "/medicines/" + id },
    robots: { index: false, follow: false }
  };
}

export default async function MedicinePage({ params }: PageProps) {
  const { id } = await params;
  const medicine = getMedicineById(id);
  if (!medicine || !isPublicOtcMedicine(medicine)) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-trust hover:text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          Back to results
        </Link>

        <article className="mt-6 rounded-md border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">{medicine.form ?? "Medicine"}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{medicine.name}</h1>
              {medicine.composition ? <p className="mt-2 max-w-2xl text-muted">{medicine.composition}</p> : null}
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-md bg-clinical px-3 py-2 text-sm font-semibold text-trust">
              <ShieldCheck aria-hidden="true" size={16} />
              OTC example
            </span>
          </div>

          <div className="mt-8 grid gap-3 rounded-md border border-line bg-surface p-4 text-sm text-muted sm:grid-cols-2">
            {medicine.manufacturer ? <p><strong className="text-ink">Manufacturer:</strong> {medicine.manufacturer}</p> : null}
            {medicine.packaging ? <p><strong className="text-ink">Pack:</strong> {medicine.packaging}</p> : null}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="text-base font-semibold text-ink">May help with</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                {medicine.indications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-base font-semibold text-ink">Cautions</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                {medicine.warnings.map((item) => (
                  <li key={item} className="flex gap-2">
                    <AlertTriangle aria-hidden="true" size={16} className="mt-1 shrink-0 text-saffron" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
