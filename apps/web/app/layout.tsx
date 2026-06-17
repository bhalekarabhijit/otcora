import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otcora",
  description: "India-first OTC medicine guidance with clear prescription separation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
