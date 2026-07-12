import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Medical Disclaimer",
  description: "Otcora is educational only and does not diagnose, prescribe, or replace professional medical advice.",
  alternates: { canonical: "/medical-disclaimer" }
};

export default function MedicalDisclaimerPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">Safety</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Medical Disclaimer</h1>
        <div className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-center gap-2 font-semibold text-saffron">
            <AlertTriangle aria-hidden="true" size={19} />
            Not for emergencies
          </div>
          <p className="mt-3 text-sm leading-6">Seek urgent medical care for severe symptoms such as breathing difficulty, chest pain, confusion, severe dehydration, fainting, uncontrolled bleeding, severe allergic reaction, or symptoms in infants that worry you.</p>
        </div>
        <div className="mt-6 space-y-5 rounded-md border border-line bg-white p-6 text-base leading-7 text-muted shadow-soft">
          <p>Otcora does not provide medical advice, diagnosis, prescriptions, or treatment. The website is for general educational information only.</p>
          <p>Never start, stop, combine, or change medicines based only on Otcora. Confirm suitability, dose, duration, and safety with a qualified doctor or pharmacist.</p>
          <p>Prescription composition names are included only to explain what belongs under clinician care. They are not recommendations. Otcora does not provide prescription brands, prices, strengths, buying links, or dosing instructions.</p>
          <p>The self-care tool is currently limited to adults aged 18-64 who are not pregnant or breastfeeding. Children, older adults, pregnancy, breastfeeding, chronic illness, and regular medicine use deserve professional guidance.</p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
