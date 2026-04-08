"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFavourites, type FavouriteEntry } from "@/lib/favouritesContext";

interface HeartButtonProps {
  entry: FavouriteEntry;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  ghost?: boolean;
}

const SIZE_CLASSES = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-11 h-11",
  xl: "w-14 h-14",
};

const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 48,
};

export default function HeartButton({
  entry,
  className = "",
  size = "md",
  ghost = false,
}: HeartButtonProps) {
  const { isFavourited, addFavourite, removeFavourite, reachedGuestLimit } = useFavourites();
  const isActive = isFavourited(entry.entryFeeId);
  const router = useRouter();

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isActive) {
      removeFavourite(entry.entryFeeId);
    } else if (reachedGuestLimit) {
      router.push("/sign-in");
    } else {
      addFavourite(entry);
    }
  };

  const label = isActive
    ? "Remove from favourites"
    : reachedGuestLimit
    ? "Sign up to save more races"
    : "Add to favourites";

  const title = isActive
    ? "Remove from tray"
    : reachedGuestLimit
    ? "Limit reached — sign up to save more"
    : "Save to tray";

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={title}
      className={`
        flex items-center justify-center
        transition-all duration-150 select-none
        ${ghost
          ? isActive
            ? "text-red-500 hover:text-red-400"
            : reachedGuestLimit
            ? "text-neutral-300 hover:text-neutral-400"
            : "text-neutral-400 hover:text-red-400"
          : isActive
            ? "rounded-full bg-red-50 text-red-500 hover:bg-red-100 shadow-sm border border-neutral-200"
            : reachedGuestLimit
            ? "rounded-full bg-white/80 text-neutral-300 hover:text-neutral-400 hover:bg-neutral-50 shadow-sm border border-neutral-200"
            : "rounded-full bg-white/80 text-neutral-400 hover:text-red-400 hover:bg-red-50 shadow-sm border border-neutral-200"
        }
        ${ghost ? "" : SIZE_CLASSES[size]}
        ${className}
      `}
    >
      <Heart
        size={ICON_SIZES[size]}
        strokeWidth={1.8}
        fill={isActive ? "currentColor" : "none"}
      />
    </button>
  );
}
