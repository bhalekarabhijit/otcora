import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/site-shell";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Page not found</h1>
        <p className="mt-4 text-base leading-7 text-muted">The page may have moved, or the link may be incomplete.</p>
        <Link href="/" className="mt-6 inline-flex rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
          Go to Otcora
        </Link>
      </section>
      <SiteFooter />
    </main>
  );
}
