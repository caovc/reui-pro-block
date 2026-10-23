/**
 * Official free REUI Rating, Radix Nova registry. MIT, Keenthemes.
 * Retrieved using `npx shadcn@latest view @reui/rating` on 2026-10-22.
 * Source: https://reui.io/r/radix-nova/rating.json
 * Original source SHA-256: f1d5526a5f501ab2e42544580d762b72d1d75afdf5a9b77df62bbed36e8194c1
 * Local integration: icon placeholders resolved to Lucide Star; editable stars
 * gain keyboard/ARIA attributes. Partial-fill, hover and click logic is upstream.
 * License: ./REUI-LICENSE.txt
 */
"use client";

import { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "cn";
import { Star } from "lucide-react";

const ratingVariants = cva("flex items-center", {
  variants: {
    size: {
      sm: "gap-2",
      default: "gap-2.5",
      lg: "gap-3",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const starVariants = cva("", {
  variants: {
    size: {
      sm: "w-4 h-4",
      default: "w-5 h-5",
      lg: "w-6 h-6",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const valueVariants = cva("text-muted-foreground w-5", {
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

function Rating({
  rating,
  maxRating = 5,
  size,
  className,
  starClassName,
  showValue = false,
  editable = false,
  onRatingChange,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof ratingVariants> & {
    /**
     * Current rating value (supports decimal values for partial stars)
     */
    rating: number;
    /**
     * Maximum rating value (number of stars to show)
     */
    maxRating?: number;
    /**
     * Whether to show the numeric rating value
     */
    showValue?: boolean;
    /**
     * Class name for the value span
     */
    starClassName?: string;
    /**
     * Whether the rating is editable (clickable)
     */
    editable?: boolean;
    /**
     * Callback function called when rating changes
     */
    onRatingChange?: (rating: number) => void;
  }) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const displayRating = editable && hoveredRating !== null ? hoveredRating : rating;

  const handleStarClick = (starRating: number) => {
    if (editable && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarMouseEnter = (starRating: number) => {
    if (editable) {
      setHoveredRating(starRating);
    }
  };

  const handleStarMouseLeave = () => {
    if (editable) {
      setHoveredRating(null);
    }
  };

  const renderStars = () => {
    const stars = [];

    for (let i = 1; i <= maxRating; i++) {
      const filled = displayRating >= i;
      const partiallyFilled = displayRating > i - 1 && displayRating < i;
      const fillPercentage = partiallyFilled ? (displayRating - (i - 1)) * 100 : 0;

      stars.push(
        <div
          key={i}
          className={cn("relative", editable && "cursor-pointer")}
          role={editable ? "button" : undefined}
          tabIndex={editable ? 0 : undefined}
          aria-label={editable ? `Rate ${i} out of ${maxRating} stars` : undefined}
          aria-pressed={editable ? rating === i : undefined}
          onKeyDown={(event) => {
            if (editable && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              handleStarClick(i);
            }
          }}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarMouseEnter(i)}
          onMouseLeave={handleStarMouseLeave}
        >
          {/* Background star (empty) */}
          <Star
            data-slot="rating-star-empty"
            className={cn(starVariants({ size }), "text-muted-foreground/30")}
          />

          {/* Filled star */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              width: filled ? "100%" : `${fillPercentage}%`,
            }}
          >
            <Star
              data-slot="rating-star-filled"
              className={cn(starVariants({ size }), "fill-yellow-400 text-yellow-400")}
            />
          </div>
        </div>,
      );
    }

    return stars;
  };

  return (
    <div data-slot="rating" className={cn(ratingVariants({ size }), className)} {...props}>
      <div className="flex items-center">{renderStars()}</div>
      {showValue && (
        <span data-slot="rating-value" className={cn(valueVariants({ size }), starClassName)}>
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export { Rating };
