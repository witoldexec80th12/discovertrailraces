"use client";

import { useFavourites, type FavouriteEntry } from "@/lib/favouritesContext";

interface HeartButtonProps {
  entry: FavouriteEntry;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "w-7 h-7 text-base",
  md: "w-9 h-9 text-xl",
  lg: "w-11 h-11 text-2xl",
  xl: "w-14 h-14 text-3xl",
};

export default function HeartButton({
  entry,
  className = "",
  size = "md",
}: HeartButtonProps) {
  const { isFavourited, addFavourite, removeFavourite } = useFavourites();
  const isActive = isFavourited(entry.entryFeeId);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isActive) {
      removeFavourite(entry.entryFeeId);
    } else {
      addFavourite(entry);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isActive ? "Remove from favourites" : "Add to favourites"}
      title={isActive ? "Remove from tray" : "Save to tray"}
      className={`
        flex items-center justify-center rounded-full
        transition-all duration-150 select-none
        ${
          isActive
            ? "bg-red-50 text-red-500 hover:bg-red-100"
            : "bg-white/80 text-neutral-400 hover:text-red-400 hover:bg-red-50"
        }
        shadow-sm border border-neutral-200
        ${SIZE_CLASSES[size]}
        ${className}
      `}
    >
      {isActive ? "♥" : "♡"}
    </button>
  );
}
