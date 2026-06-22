import { getMedicineById } from "@otcora/core";
import { AlertTriangle, ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MedicinePage({ params }: PageProps) {
  const { id } = await params;
  const medicine = getMedicineById(id);
  if (!medicine) {
    notFound();
  }

  const isOtc = medicine.prescriptionStatus === "otc";

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
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
            <span className={`inline-flex w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isOtc ? "bg-clinical text-trust" : "bg-amber-50 text-saffron"}`}>
              {isOtc ? <ShieldCheck aria-hidden="true" size={16} /> : <FileText aria-hidden="true" size={16} />}
              {isOtc ? "OTC" : "Prescription"}
            </span>
          </div>

          <div className="mt-8 grid gap-3 rounded-md border border-line bg-surface p-4 text-sm text-muted sm:grid-cols-2">
            {medicine.manufacturer ? <p><strong className="text-ink">Manufacturer:</strong> {medicine.manufacturer}</p> : null}
            {medicine.packaging ? <p><strong className="text-ink">Pack:</strong> {medicine.packaging}</p> : null}
            {medicine.price ? <p><strong className="text-ink">Price:</strong> Rs. {medicine.price}</p> : null}
            {medicine.mrp ? <p><strong className="text-ink">MRP:</strong> Rs. {medicine.mrp}</p> : null}
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
    </main>
  );
}
