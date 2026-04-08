"use client";

import { useRouter } from "next/navigation";

interface BackLinkProps {
  fallbackHref: string;
  sourceTitle?: string;
  children: React.ReactNode;
}

export default function BackLink({ fallbackHref, sourceTitle, children }: BackLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <a
      href={fallbackHref}
      onClick={handleClick}
      className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
      title={sourceTitle ? `Back to ${sourceTitle}` : undefined}
    >
      {children}
    </a>
  );
}
