import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Contact Otcora",
  description: "Contact Otcora for feedback, corrections, partnership conversations, or safety concerns.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">Contact</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Send feedback or correction requests.</h1>
        <div className="mt-6 rounded-md border border-line bg-white p-6 shadow-soft">
          <p className="text-base leading-7 text-muted">For product feedback, correction requests, partnership conversations, or safety concerns, email the Otcora team. Do not use this contact channel for emergencies or personal medical advice.</p>
          <a href="mailto:hello@otcora.com" className="mt-5 inline-flex items-center gap-2 rounded-md bg-trust px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink">
            <Mail aria-hidden="true" size={17} />
            hello@otcora.com
          </a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
