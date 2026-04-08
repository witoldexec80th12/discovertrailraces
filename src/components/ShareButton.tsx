"use client";

import { useState } from "react";

interface ShareButtonProps {
  name: string;
}

export default function ShareButton({ name }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button
      onClick={handleShare}
      className="text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
    >
      {copied ? "✓ Copied!" : "Share"}
    </button>
  );
}
