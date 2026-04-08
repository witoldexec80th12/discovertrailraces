"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/cost", label: "Cost Index" },
  { href: "/race-specificity", label: "Race Finder" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="sm:hidden sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-around h-11 px-4">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
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
    </nav>
  );
}
