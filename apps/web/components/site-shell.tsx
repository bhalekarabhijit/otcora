"use client";

import { Activity, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/guides/otc-vs-prescription-medicines", label: "Guide" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

const footerLinks = [
  { href: "/methodology", label: "Methodology" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/medical-disclaimer", label: "Medical disclaimer" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3" aria-label="Otcora home">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-trust text-white shadow-soft">
          <Activity aria-hidden="true" size={22} />
        </span>
        <span>
          <span className="block text-lg font-semibold tracking-normal text-ink">Otcora</span>
          <span className="block text-xs font-medium uppercase tracking-[0.12em] text-muted">OTC guidance</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <nav className="hidden items-center gap-1 rounded-md border border-line bg-white p-1 text-sm font-medium text-muted md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 transition hover:bg-clinical hover:text-trust">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm text-muted lg:flex">
          <ShieldCheck aria-hidden="true" size={17} className="text-care" />
          Educational only
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/80">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold text-ink">
            <Activity aria-hidden="true" size={18} className="text-trust" />
            Otcora
          </Link>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Otcora is an educational self-care tool. It does not diagnose, prescribe, sell medicines, or replace advice from a doctor or pharmacist.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-muted md:items-end">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-trust">
                {link.label}
              </Link>
            ))}
          </div>
          <a href="mailto:hello@otcora.com" className="inline-flex items-center gap-2 hover:text-trust">
            <Mail aria-hidden="true" size={15} />
            hello@otcora.com
          </a>
        </div>
      </div>
    </footer>
  );
}
