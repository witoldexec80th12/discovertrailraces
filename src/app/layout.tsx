import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DiscoverTrailRaces",
  description: "Find better trail races, understand what they're really like, and compare real cost per kilometer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="sticky top-0 z-50 bg-white/15 border-b border-neutral-100/30 shadow-sm backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <Link href="/" className="flex items-center">
              <img
                src="/images/logo_white.svg"
                alt="DiscoverTrailRaces"
                className="h-8 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-6 text-sm font-semibold text-neutral-600">
              <Link href="/cost" className="hover:text-neutral-900 transition-colors">
                Cost Index
              </Link>
              <Link href="/about" className="hover:text-neutral-900 transition-colors">
                About
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
