import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { FavouritesProvider } from "@/lib/favouritesContext";
import FavouritesTray from "@/components/FavouritesTray";
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
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <FavouritesProvider>
            {children}
            <FavouritesTray />
          </FavouritesProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
