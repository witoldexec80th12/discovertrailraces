"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { getFavorites, invalidateFavoritesCache } from "@/lib/favoritesCache";

interface FavoriteButtonProps {
  entryFeeId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function FavoriteButton({
  entryFeeId,
  className = "",
  size = "md",
}: FavoriteButtonProps) {
  const { isSignedIn, isLoaded, user } = useUser();
  const { openSignIn } = useClerk();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const mountedRef = useRef(false);

  const sizeClasses = {
    sm: "w-7 h-7 text-base",
    md: "w-9 h-9 text-xl",
    lg: "w-11 h-11 text-2xl",
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    getFavorites(user.id).then((favorites) => {
      if (!mountedRef.current) return;
      setIsFavorited(favorites.includes(entryFeeId));
      setChecked(true);
    });
  }, [isLoaded, isSignedIn, user?.id, entryFeeId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      openSignIn({ redirectUrl: window.location.href });
      return;
    }

    setIsLoading(true);
    const newState = !isFavorited;
    setIsFavorited(newState);

    try {
      await fetch("/api/favorites", {
        method: newState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_fee_id: entryFeeId }),
      });
      invalidateFavoritesCache();
    } catch {
      setIsFavorited(!newState);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
      title={isSignedIn ? (isFavorited ? "Saved" : "Save race") : "Sign in to save races"}
      className={`
        flex items-center justify-center rounded-full
        transition-all duration-150
        ${isFavorited
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-white/80 text-neutral-400 hover:text-red-400 hover:bg-red-50"
        }
        ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        shadow-sm border border-neutral-200
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {isFavorited && checked ? "♥" : "♡"}
    </button>
  );
}
