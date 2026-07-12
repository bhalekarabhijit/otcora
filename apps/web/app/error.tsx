"use client";

import { RotateCcw } from "lucide-react";
import { SiteFooter, SiteHeader } from "../components/site-shell";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-danger">Error</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Something went wrong</h1>
        <p className="mt-4 text-base leading-7 text-muted">Try again, or return to the symptom search from the homepage.</p>
        <button type="button" onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
          <RotateCcw aria-hidden="true" size={17} />
          Try again
        </button>
      </section>
      <SiteFooter />
    </main>
  );
}
