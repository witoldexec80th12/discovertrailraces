"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/cost", label: "Cost Index" },
  { href: "/race-specificity", label: "Race Finder" },
];

export default function MobileNav() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <nav className="sm:hidden sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="flex items-center h-11 px-4 gap-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo_white.svg"
            alt="DiscoverTrailRaces"
            width={120}
            height={30}
            className="h-6 w-auto"
          />
        </Link>
        <div className="flex items-center justify-around flex-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-[11px] font-medium transition-colors ${
                  isActive
                    ? "text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
