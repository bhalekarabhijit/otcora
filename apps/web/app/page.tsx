import { Activity, ShieldCheck, Stethoscope } from "lucide-react";
import { SymptomConsole } from "../components/symptom-console";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="Otcora home">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-trust text-white shadow-soft">
            <Activity aria-hidden="true" size={22} />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-normal text-ink">Otcora</span>
            <span className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">OTC guidance</span>
          </span>
        </a>
        <div className="hidden items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm text-muted sm:flex">
          <ShieldCheck aria-hidden="true" size={17} className="text-care" />
          India-first medicine data
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-6 lg:sticky lg:top-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-trust">
            <Stethoscope aria-hidden="true" size={17} />
            Educational self-care support
          </div>
          <div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-ink sm:text-5xl lg:text-6xl">
              Find sensible OTC options from your symptoms.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Start typing a symptom, choose what fits, and Otcora separates self-care medicines from prescription-only options with cautions up front.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["OTC first", "Self-care options are prioritized."],
              ["Rx separated", "Prescription medicines stay clearly marked."],
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
    </main>
  );
}
